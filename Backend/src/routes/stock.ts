import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication
router.use(authenticateToken);

// Current stock for a single part
router.get('/:partId', async (req, res) => {
  const partId = Number(req.params.partId);

  // Validate part ID
  if (isNaN(partId) || partId <= 0) {
    return res.status(400).json({ error: 'Invalid part ID. Must be a positive number.' });
  }

  try {
    // Check if part exists
    const part = await prisma.part.findUnique({ where: { id: partId } });
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }
    if (part.isDeleted) {
      return res.status(404).json({ error: 'Part has been deleted' });
    }

    // Optimized: Use single SQL query instead of two aggregate calls
    const stockResult = await prisma.$queryRaw<Array<{incoming: number, outgoing: number}>>`
      SELECT 
        COALESCE(SUM(CASE WHEN direction = 'IN' THEN quantity ELSE 0 END), 0)::INTEGER as incoming,
        COALESCE(SUM(CASE WHEN direction = 'OUT' THEN quantity ELSE 0 END), 0)::INTEGER as outgoing
      FROM "InventoryTransaction"
      WHERE "partId" = ${partId}
    `;

    const inQty = stockResult[0]?.incoming ?? 0;
    const outQty = stockResult[0]?.outgoing ?? 0;
    const stock = inQty - outQty;

    res.json({ partId, stock, incoming: inQty, outgoing: outQty });
  } catch (e) {
    console.error('Stock calculation error:', e);
    res.status(500).json({ error: 'Failed to calculate stock' });
  }
});

// Adjust stock for a part (manual stock correction)
router.post('/:partId/adjust', async (req, res) => {
  const partId = Number(req.params.partId);
  const { quantity } = req.body;

  // Comprehensive validation
  if (isNaN(partId) || partId <= 0) {
    return res.status(400).json({ error: 'Invalid part ID. Must be a positive number.' });
  }

  if (typeof quantity !== 'number') {
    return res.status(400).json({ error: 'Quantity must be a number' });
  }

  if (quantity < 0) {
    return res.status(400).json({ error: 'Quantity cannot be negative' });
  }

  if (!Number.isFinite(quantity)) {
    return res.status(400).json({ error: 'Quantity must be a finite number' });
  }

  try {
    // Check if part exists and is not deleted
    const part = await prisma.part.findUnique({ where: { id: partId } });
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }
    if (part.isDeleted) {
      return res.status(400).json({ error: 'Cannot adjust stock for deleted part' });
    }

    // Get current stock using optimized single query
    const stockResult = await prisma.$queryRaw<Array<{incoming: number, outgoing: number}>>`
      SELECT 
        COALESCE(SUM(CASE WHEN direction = 'IN' THEN quantity ELSE 0 END), 0)::INTEGER as incoming,
        COALESCE(SUM(CASE WHEN direction = 'OUT' THEN quantity ELSE 0 END), 0)::INTEGER as outgoing
      FROM "InventoryTransaction"
      WHERE "partId" = ${partId}
    `;

    const currentStock = (stockResult[0]?.incoming ?? 0) - (stockResult[0]?.outgoing ?? 0);
    const difference = quantity - currentStock;

    if (difference !== 0) {
      // Create adjustment transaction
      await prisma.inventoryTransaction.create({
        data: {
          partId,
          direction: difference > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(difference),
        }
      });
    }

    res.json({ 
      success: true, 
      partId, 
      partNumber: part.partNumber,
      previousStock: currentStock, 
      newStock: quantity,
      adjustment: difference,
      message: difference === 0 ? 'No adjustment needed' : `Stock adjusted by ${difference}`,
    });
  } catch (e) {
    console.error('Stock adjustment error:', e);
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

// Optional: list stock for all parts (for report like your Excel)
router.get('/', async (req, res) => {
  try {
    const { onlyPurchased } = req.query;
    
    // Optimized: Use single SQL query with GROUP BY instead of N queries
    // This reduces database calls from O(2n) to O(1)
    const stockQuery = onlyPurchased === 'true'
      ? prisma.$queryRaw`
          SELECT 
            p.id,
            p."partNumber",
            p."itemName",
            p.description,
            p."hsnCode",
            p."gstPercent",
            p.unit,
            p.mrp,
            p.rtl,
            p.barcode,
            p."qrCode",
            p."isDeleted",
            p."createdAt",
            p."updatedAt",
            COALESCE(SUM(CASE WHEN it.direction = 'IN' THEN it.quantity ELSE 0 END), 0) as incoming,
            COALESCE(SUM(CASE WHEN it.direction = 'OUT' THEN it.quantity ELSE 0 END), 0) as outgoing,
            COALESCE(SUM(CASE WHEN it.direction = 'IN' THEN it.quantity ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN it.direction = 'OUT' THEN it.quantity ELSE 0 END), 0) as stock
          FROM "Part" p
          INNER JOIN "InventoryTransaction" it ON it."partId" = p.id
          WHERE p."isDeleted" = false
            AND EXISTS (
              SELECT 1 FROM "InventoryTransaction" it2 
              WHERE it2."partId" = p.id AND it2.direction = 'IN'
            )
          GROUP BY p.id, p."partNumber", p."itemName", p.description, p."hsnCode", 
                   p."gstPercent", p.unit, p.mrp, p.rtl, p.barcode, p."qrCode", 
                   p."isDeleted", p."createdAt", p."updatedAt"
          ORDER BY p."partNumber" ASC
        `
      : prisma.$queryRaw`
          SELECT 
            p.id,
            p."partNumber",
            p."itemName",
            p.description,
            p."hsnCode",
            p."gstPercent",
            p.unit,
            p.mrp,
            p.rtl,
            p.barcode,
            p."qrCode",
            p."isDeleted",
            p."createdAt",
            p."updatedAt",
            COALESCE(SUM(CASE WHEN it.direction = 'IN' THEN it.quantity ELSE 0 END), 0) as incoming,
            COALESCE(SUM(CASE WHEN it.direction = 'OUT' THEN it.quantity ELSE 0 END), 0) as outgoing,
            COALESCE(SUM(CASE WHEN it.direction = 'IN' THEN it.quantity ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN it.direction = 'OUT' THEN it.quantity ELSE 0 END), 0) as stock
          FROM "Part" p
          LEFT JOIN "InventoryTransaction" it ON it."partId" = p.id
          WHERE p."isDeleted" = false
          GROUP BY p.id, p."partNumber", p."itemName", p.description, p."hsnCode", 
                   p."gstPercent", p.unit, p.mrp, p.rtl, p.barcode, p."qrCode", 
                   p."isDeleted", p."createdAt", p."updatedAt"
          ORDER BY p."partNumber" ASC
        `;

    const result = await stockQuery;
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load stock list' });
  }
});

export default router;
