import { Router } from 'express';
import { prisma } from '../prisma';
import { PartCreateBody } from '../types';

const router = Router();

// Create / update part from manual entry or barcode scan
router.post('/', async (req, res) => {
  const body = req.body as PartCreateBody;

  if (!body.partNumber || !body.itemName || !body.hsnCode) {
    return res.status(400).json({ error: 'partNumber, itemName, hsnCode required' });
  }

  // Validate part number format (e.g., 550/42835C, 336/E8026)
  const partNumberPattern = /^[0-9]+\/[A-Z0-9]+$/;
  if (!partNumberPattern.test(body.partNumber)) {
    return res.status(400).json({ 
      error: 'Invalid part number format. Use format: Number/Alphanumeric (e.g., 550/42835C, 336/E8026)' 
    });
  }

  // Set defaults for required fields if not provided
  const gstPercent = body.gstPercent ?? 18;
  const unit = body.unit ?? 'PCS';

  try {
    const part = await prisma.part.upsert({
      where: { partNumber: body.partNumber },
      update: {
        itemName: body.itemName,
        description: body.description,
        hsnCode: body.hsnCode,
        gstPercent,
        unit,
        mrp: body.mrp,
        rtl: body.rtl,
        barcode: body.barcode,
        qrCode: body.qrCode
      },
      create: {
        partNumber: body.partNumber,
        itemName: body.itemName,
        description: body.description,
        hsnCode: body.hsnCode,
        gstPercent,
        unit,
        mrp: body.mrp,
        rtl: body.rtl,
        barcode: body.barcode,
        qrCode: body.qrCode
      }
    });

    res.json(part);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save part' });
  }
});

// Search by partNumber, barcode, or QR code (used when scanning)
router.get('/search', async (req, res) => {
  const { q, barcode, qrCode } = req.query as { q?: string; barcode?: string; qrCode?: string };

  try {
    // Search by barcode
    if (barcode) {
      const part = await prisma.part.findUnique({ 
        where: { barcode },
      });
      if (!part || part.isDeleted) {
        return res.status(404).json({ error: 'Part not found' });
      }
      return res.json(part);
    }

    // Search by QR code
    if (qrCode) {
      const part = await prisma.part.findUnique({ 
        where: { qrCode },
      });
      if (!part || part.isDeleted) {
        return res.status(404).json({ error: 'Part not found' });
      }
      return res.json(part);
    }

    // General search by part number or item name
    const parts = await prisma.part.findMany({
      where: q
        ? {
            isDeleted: false,
            OR: [
              { partNumber: { contains: q, mode: 'insensitive' } },
              { itemName: { contains: q, mode: 'insensitive' } }
            ]
          }
        : { isDeleted: false },
      take: 50,
      orderBy: { partNumber: 'asc' }
    });

    res.json(parts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to search parts' });
  }
});

// Get single part by ID
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  
  // Check if ID is a valid number
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid part ID. Must be a number.' });
  }
  
  try {
    const part = await prisma.part.findUnique({ where: { id } });
    if (!part) return res.status(404).json({ error: 'Part not found' });
    res.json(part);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load part' });
  }
});

// Update part
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as PartCreateBody;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid part ID. Must be a number.' });
  }

  if (!body.partNumber || !body.itemName || !body.hsnCode) {
    return res.status(400).json({ error: 'partNumber, itemName, hsnCode required' });
  }

  // Validate part number format (e.g., 550/42835C, 336/E8026)
  const partNumberPattern = /^[0-9]+\/[A-Z0-9]+$/;
  if (!partNumberPattern.test(body.partNumber)) {
    return res.status(400).json({ 
      error: 'Invalid part number format. Use format: Number/Alphanumeric (e.g., 550/42835C, 336/E8026)' 
    });
  }

  const gstPercent = body.gstPercent ?? 18;
  const unit = body.unit ?? 'PCS';

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
        qrCode: body.qrCode || null
      }
    });

    res.json(part);
  } catch (e: any) {
    console.error(e);
    // Handle unique constraint violations
    if (e.code === 'P2002') {
      const field = e.meta?.target?.[0] || 'field';
      return res.status(400).json({ error: `${field} already exists. Please use a different value.` });
    }
    res.status(500).json({ error: 'Failed to update part' });
  }
});

// Delete part (soft delete)
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid part ID. Must be a number.' });
  }

  try {
    const part = await prisma.part.update({
      where: { id },
      data: { isDeleted: true }
    });
    res.json({ success: true, message: 'Part deleted successfully' });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete part' });
  }
});

export default router;
