import { Router } from 'express';
import { prisma } from '../prisma';
// import { authenticateToken } from '../middleware/auth';

const router = Router();

// TODO: Re-enable authentication after verifying data access
// router.use(authenticateToken);

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

    // Get stock transactions for this part
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { partId },
      select: { direction: true, quantity: true }
    });

    const inQty = transactions
      .filter(t => t.direction === 'IN')
      .reduce((sum, t) => sum + t.quantity, 0);
    
    const outQty = transactions
      .filter(t => t.direction === 'OUT')
      .reduce((sum, t) => sum + t.quantity, 0);
    
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

    // Get current stock transactions
    const transactions = await prisma.inventoryTransaction.findMany({
      where: { partId },
      select: { direction: true, quantity: true }
    });

    const inQty = transactions
      .filter(t => t.direction === 'IN')
      .reduce((sum, t) => sum + t.quantity, 0);
    
    const outQty = transactions
      .filter(t => t.direction === 'OUT')
      .reduce((sum, t) => sum + t.quantity, 0);

    const currentStock = inQty - outQty;
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

    // Optimized: Calculate stock for all parts in parallel batches
    const stockPromises = parts.map(async (part) => {
      const transactions = await prisma.inventoryTransaction.findMany({
        where: { partId: part.id },
        select: { direction: true, quantity: true }
      });
      
      const incoming = transactions
        .filter(t => t.direction === 'IN')
        .reduce((sum, t) => sum + t.quantity, 0);
      
      const outgoing = transactions
        .filter(t => t.direction === 'OUT')
        .reduce((sum, t) => sum + t.quantity, 0);
      
      return {
        ...part,
        stock: incoming - outgoing
      };
    });

    const result = await Promise.all(stockPromises);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load stock list' });
  }
});

export default router;
