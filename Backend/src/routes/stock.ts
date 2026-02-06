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
    const stockResult = await prisma.$queryRaw<Array<{incoming: bigint, outgoing: bigint}>>`
      SELECT 
        COALESCE(SUM(CASE WHEN direction = 'IN' THEN quantity ELSE 0 END), 0) as incoming,
        COALESCE(SUM(CASE WHEN direction = 'OUT' THEN quantity ELSE 0 END), 0) as outgoing
      FROM "InventoryTransaction"
      WHERE "partId" = ${partId}
    `;

    const inQty = Number(stockResult[0]?.incoming ?? 0);
    const outQty = Number(stockResult[0]?.outgoing ?? 0);
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
    const stockResult = await prisma.$queryRaw<Array<{incoming: bigint, outgoing: bigint}>>`
      SELECT 
        COALESCE(SUM(CASE WHEN direction = 'IN' THEN quantity ELSE 0 END), 0) as incoming,
        COALESCE(SUM(CASE WHEN direction = 'OUT' THEN quantity ELSE 0 END), 0) as outgoing
      FROM "InventoryTransaction"
      WHERE "partId" = ${partId}
    `;

    const currentStock = Number(stockResult[0]?.incoming ?? 0) - Number(stockResult[0]?.outgoing ?? 0);
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
    
    // If onlyPurchased filter is enabled, find parts with incoming transactions
    let partFilter: any = { isDeleted: false };
    
    if (onlyPurchased === 'true') {
      // Get all part IDs that have incoming inventory transactions
      const partsWithPurchases = await prisma.inventoryTransaction.findMany({
        where: { direction: 'IN' },
        select: { partId: true },
        distinct: ['partId']
      });
      
      const partIds = partsWithPurchases.map(t => t.partId);
      if (partIds.length === 0) {
        return res.json([]);
      }
      partFilter = { 
        isDeleted: false,
        id: { in: partIds }
      };
    }
    
    const parts = await prisma.part.findMany({ 
      where: partFilter,
      orderBy: { partNumber: 'asc' } 
    });

    // If no parts, return empty array
    if (parts.length === 0) {
      return res.json([]);
    }

    // Optimized: Get all stock calculations in one query
    const partIds = parts.map(p => p.id);
    const stockData = await prisma.$queryRaw<Array<{partid: number, incoming: bigint, outgoing: bigint}>>`
      SELECT 
        "partId" as partid,
        COALESCE(SUM(CASE WHEN direction = 'IN' THEN quantity ELSE 0 END), 0) as incoming,
        COALESCE(SUM(CASE WHEN direction = 'OUT' THEN quantity ELSE 0 END), 0) as outgoing
      FROM "InventoryTransaction"
      WHERE "partId" = ANY(${partIds})
      GROUP BY "partId"
    `;

    // Create a map for quick lookup
    const stockMap = new Map(
      stockData.map(s => [
        Number(s.partid), 
        { 
          incoming: Number(s.incoming), 
          outgoing: Number(s.outgoing),
          stock: Number(s.incoming) - Number(s.outgoing)
        }
      ])
    );

    // Combine parts with stock data
    const result = parts.map(p => ({
      ...p,
      stock: stockMap.get(p.id)?.stock ?? 0
    }));

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load stock list' });
  }
});

export default router;
