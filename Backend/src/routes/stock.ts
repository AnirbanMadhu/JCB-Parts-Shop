import { Router } from 'express';
import { prisma } from '../prisma';
import { cacheMiddleware, clearCachePattern } from '../middleware/cache';
// import { authenticateToken } from '../middleware/auth';

const router = Router();

// TODO: Re-enable authentication after verifying data access
// router.use(authenticateToken);

// Current stock for a single part - Cache for 10 seconds
router.get('/:partId', cacheMiddleware(10), async (req, res) => {
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

  if (typeof quantity !== 'number' || isNaN(quantity)) {
    return res.status(400).json({ error: 'Quantity must be a valid number' });
  }

  if (quantity < 0) {
    return res.status(400).json({ error: 'Quantity cannot be negative' });
  }

  if (!Number.isFinite(quantity)) {
    return res.status(400).json({ error: 'Quantity must be a finite number' });
  }

  if (quantity > 1000000) {
    return res.status(400).json({ error: 'Quantity too large (max 1,000,000)' });
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

    // Clear stock cache after adjustment
    clearCachePattern('/api/stock');
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

// Optional: list stock for all parts (for report like your Excel) - Cache for 20 seconds
router.get('/', cacheMiddleware(20), async (req, res) => {
  try {
    const { onlyPurchased } = req.query;
    
    // OPTIMIZED: Use a single aggregated query instead of N+1 queries
    // This prevents connection pool exhaustion
    
    // Get all transactions with part information in one query
    const transactions = await prisma.inventoryTransaction.findMany({
      select: {
        partId: true,
        direction: true,
        quantity: true,
      },
    });

    // Create a map of partId -> stock calculations
    const stockMap = new Map<number, { incoming: number; outgoing: number }>();
    
    for (const transaction of transactions) {
      const current = stockMap.get(transaction.partId) || { incoming: 0, outgoing: 0 };
      
      if (transaction.direction === 'IN') {
        current.incoming += transaction.quantity;
      } else {
        current.outgoing += transaction.quantity;
      }
      
      stockMap.set(transaction.partId, current);
    }

    // Build filter for parts
    let partFilter: any = { isDeleted: false };
    
    if (onlyPurchased === 'true') {
      // Filter to only parts that have incoming transactions
      const partIdsWithPurchases = Array.from(stockMap.entries())
        .filter(([_, stock]) => stock.incoming > 0)
        .map(([partId]) => partId);
      
      if (partIdsWithPurchases.length === 0) {
        return res.json([]);
      }
      
      partFilter = { 
        isDeleted: false,
        id: { in: partIdsWithPurchases }
      };
    }
    
    // Fetch all parts in a single query
    const parts = await prisma.part.findMany({ 
      where: partFilter,
      orderBy: { partNumber: 'asc' } 
    });

    // Combine parts with stock data
    const result = parts.map((part) => {
      const stockData = stockMap.get(part.id) || { incoming: 0, outgoing: 0 };
      return {
        ...part,
        stock: stockData.incoming - stockData.outgoing
      };
    });

    res.json(result);
  } catch (e) {
    console.error('Stock list error:', e);
    res.status(500).json({ error: 'Failed to load stock list' });
  }
});

export default router;
