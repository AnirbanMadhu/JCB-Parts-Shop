import { Router } from "express";
import { prisma } from "../prisma";
import { PartCreateBody } from "../types";
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication
router.use(authenticateToken);

// Get all parts (paginated)
router.get("/", async (req, res) => {
  const { page = "1", limit = "50" } = req.query as {
    page?: string;
    limit?: string;
  };
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  try {
    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where: { isDeleted: false },
        take: limitNum,
        skip: skip,
        orderBy: { partNumber: "asc" },
      }),
      prisma.part.count({ where: { isDeleted: false } }),
    ]);

    res.json({
      data: parts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch parts" });
  }
});

// Create / update part from manual entry or barcode scan
router.post("/", async (req, res) => {
  const body = req.body as PartCreateBody;

  // Comprehensive validation
  if (!body.partNumber || !body.itemName || !body.hsnCode) {
    return res
      .status(400)
      .json({ error: "partNumber, itemName, hsnCode required" });
  }

  // Trim and validate string fields
  const partNumber = body.partNumber.trim();
  const itemName = body.itemName.trim();
  const hsnCode = body.hsnCode.trim();
  
  if (!partNumber || !itemName || !hsnCode) {
    return res.status(400).json({ error: 'Fields cannot be empty or whitespace only' });
  }

  // Validate lengths
  if (partNumber.length > 50) {
    return res.status(400).json({ error: 'Part number too long (max 50 characters)' });
  }
  if (itemName.length > 200) {
    return res.status(400).json({ error: 'Item name too long (max 200 characters)' });
  }
  if (hsnCode.length > 20) {
    return res.status(400).json({ error: 'HSN code too long (max 20 characters)' });
  }

  // Validate part number format - accepts both formats:
  // 1. Number/Alphanumeric (e.g., 550/42835C, 336/E8026)
  // 2. Purely numeric (e.g., 027800028)
  const partNumberPattern = /^[0-9]+(\/[A-Z0-9]+)?$/i;
  if (!partNumberPattern.test(partNumber)) {
    return res.status(400).json({
      error:
        "Invalid part number format. Use: Number/Alphanumeric (e.g., 550/42835C) or numeric (e.g., 027800028)",
    });
  }

  // Set defaults for required fields if not provided
  const gstPercent = body.gstPercent ?? 18;
  const unit = body.unit?.trim() ?? "Nos"; // Match frontend default

  // Validate numeric fields
  if (gstPercent < 0 || gstPercent > 100) {
    return res.status(400).json({ error: 'GST percent must be between 0 and 100' });
  }
  if (body.mrp !== undefined && body.mrp !== null && body.mrp < 0) {
    return res.status(400).json({ error: 'MRP cannot be negative' });
  }
  if (body.rtl !== undefined && body.rtl !== null && body.rtl < 0) {
    return res.status(400).json({ error: 'RTL cannot be negative' });
  }

  // Validate barcode and QR code if provided
  const barcode = body.barcode?.trim() || null;
  const qrCode = body.qrCode?.trim() || null;
  
  if (barcode && barcode.length > 100) {
    return res.status(400).json({ error: 'Barcode too long (max 100 characters)' });
  }
  if (qrCode && qrCode.length > 100) {
    return res.status(400).json({ error: 'QR code too long (max 100 characters)' });
  }

  try {
    const part = await prisma.part.upsert({
      where: { partNumber: partNumber },
      update: {
        itemName: itemName,
        description: body.description?.trim(),
        hsnCode: hsnCode,
        gstPercent,
        unit,
        mrp: body.mrp,
        rtl: body.rtl,
        barcode: barcode,
        qrCode: qrCode,
      },
      create: {
        partNumber: partNumber,
        itemName: itemName,
        description: body.description?.trim(),
        hsnCode: hsnCode,
        gstPercent,
        unit,
        mrp: body.mrp,
        rtl: body.rtl,
        barcode: barcode,
        qrCode: qrCode,
      },
    });

    res.json(part);
  } catch (e: any) {
    console.error('Part creation error:', e);
    // Handle unique constraint violations for barcode or QR code
    if (e.code === "P2002") {
      const field = e.meta?.target?.[0] || "field";
      let fieldName = "Field";
      if (field === "barcode") fieldName = "Barcode";
      else if (field === "qrCode") fieldName = "QR Code";
      else if (field === "partNumber") fieldName = "Part Number";
      
      return res.status(400).json({
        error: `${fieldName} already exists. Please use a different value.`,
        field: field
      });
    }
    res.status(500).json({ error: "Failed to save part" });
  }
});

// Search by partNumber, barcode, or QR code (used when scanning)
router.get("/search", async (req, res) => {
  const { q, barcode, qrCode } = req.query as {
    q?: string;
    barcode?: string;
    qrCode?: string;
  };

  try {
    // Optimized helper function to add stock info using single query
    const addStockInfo = async (part: any) => {
      const stockResult = await prisma.$queryRaw<Array<{incoming: number, outgoing: number}>>`
        SELECT 
          COALESCE(SUM(CASE WHEN direction = 'IN' THEN quantity ELSE 0 END), 0)::INTEGER as incoming,
          COALESCE(SUM(CASE WHEN direction = 'OUT' THEN quantity ELSE 0 END), 0)::INTEGER as outgoing
        FROM "InventoryTransaction"
        WHERE "partId" = ${part.id}
      `;
      const inQty = stockResult[0]?.incoming ?? 0;
      const outQty = stockResult[0]?.outgoing ?? 0;
      return { ...part, stock: inQty - outQty };
    };

    // Search by barcode
    if (barcode) {
      const part = await prisma.part.findUnique({
        where: { barcode },
      });
      if (!part || part.isDeleted) {
        return res.status(404).json({ error: "Part not found" });
      }
      const partWithStock = await addStockInfo(part);
      return res.json(partWithStock);
    }

    // Search by QR code
    if (qrCode) {
      const part = await prisma.part.findUnique({
        where: { qrCode },
      });
      if (!part || part.isDeleted) {
        return res.status(404).json({ error: "Part not found" });
      }
      const partWithStock = await addStockInfo(part);
      return res.json(partWithStock);
    }

    // General search by part number or item name
    const parts = await prisma.part.findMany({
      where: q
        ? {
            isDeleted: false,
            OR: [
              { partNumber: { contains: q, mode: "insensitive" } },
              { itemName: { contains: q, mode: "insensitive" } },
            ],
          }
        : { isDeleted: false },
      take: 50,
      orderBy: { partNumber: "asc" },
    });

    res.json(parts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to search parts" });
  }
});

// Get single part by ID
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  // Check if ID is a valid number
  if (isNaN(id)) {
    return res
      .status(400)
      .json({ error: "Invalid part ID. Must be a number." });
  }

  try {
    const part = await prisma.part.findUnique({ where: { id } });
    if (!part) return res.status(404).json({ error: "Part not found" });
    res.json(part);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load part" });
  }
});

// Update part
router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as PartCreateBody;

  if (isNaN(id)) {
    return res
      .status(400)
      .json({ error: "Invalid part ID. Must be a number." });
  }

  if (!body.partNumber || !body.itemName || !body.hsnCode) {
    return res
      .status(400)
      .json({ error: "partNumber, itemName, hsnCode required" });
  }

  // Validate part number format - accepts both formats:
  // 1. Number/Alphanumeric (e.g., 550/42835C, 336/E8026)
  // 2. Purely numeric (e.g., 027800028)
  const partNumberPattern = /^[0-9]+(\/[A-Z0-9]+)?$/i;
  if (!partNumberPattern.test(body.partNumber)) {
    return res.status(400).json({
      error:
        "Invalid part number format. Use: Number/Alphanumeric (e.g., 550/42835C) or numeric (e.g., 027800028)",
    });
  }

  const gstPercent = body.gstPercent ?? 18;
  const unit = body.unit ?? "Nos"; // Match frontend default

  try {
    const part = await prisma.part.update({
      where: { id },
      data: {
        partNumber: body.partNumber,
        itemName: body.itemName,
        description: body.description,
        hsnCode: body.hsnCode,
        gstPercent,
        unit,
        mrp: body.mrp,
        rtl: body.rtl,
        barcode: body.barcode || null,
        qrCode: body.qrCode || null,
      },
    });

    res.json(part);
  } catch (e: any) {
    console.error(e);
    // Handle unique constraint violations
    if (e.code === "P2002") {
      const field = e.meta?.target?.[0] || "field";
      return res
        .status(400)
        .json({
          error: `${field} already exists. Please use a different value.`,
        });
    }
    res.status(500).json({ error: "Failed to update part" });
  }
});

// Delete part (soft delete)
router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid part ID. Must be a positive number." });
  }

  try {
    // Check if part exists
    const part = await prisma.part.findUnique({
      where: { id }
    });

    if (!part) {
      return res.status(404).json({ error: "Part not found" });
    }

    if (part.isDeleted) {
      return res.status(400).json({ error: "Part is already deleted" });
    }

    // Check if part has any stock using optimized single query
    const stockResult = await prisma.$queryRaw<Array<{incoming: number, outgoing: number}>>`
      SELECT 
        COALESCE(SUM(CASE WHEN direction = 'IN' THEN quantity ELSE 0 END), 0)::INTEGER as incoming,
        COALESCE(SUM(CASE WHEN direction = 'OUT' THEN quantity ELSE 0 END), 0)::INTEGER as outgoing
      FROM "InventoryTransaction"
      WHERE "partId" = ${id}
    `;

    const stock = (stockResult[0]?.incoming ?? 0) - (stockResult[0]?.outgoing ?? 0);
    
    // Warn if part has stock
    if (stock > 0) {
      // Allow deletion but warn the user
      const deletedPart = await prisma.part.update({
        where: { id },
        data: { isDeleted: true },
      });
      return res.json({ 
        success: true, 
        message: "Part deleted successfully",
        warning: `Part had ${stock} units in stock`,
        part: deletedPart
      });
    }

    const deletedPart = await prisma.part.update({
      where: { id },
      data: { isDeleted: true },
    });
    
    res.json({ 
      success: true, 
      message: "Part deleted successfully",
      part: deletedPart
    });
  } catch (e: any) {
    console.error('Part deletion error:', e);
    if (e.code === 'P2025') {
      return res.status(404).json({ error: "Part not found" });
    }
    res.status(500).json({ error: "Failed to delete part" });
  }
});

export default router;
