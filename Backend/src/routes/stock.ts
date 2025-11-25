import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// Current stock for a single part
router.get('/:partId', async (req, res) => {
  const partId = Number(req.params.partId);

  try {
    const [incoming, outgoing] = await Promise.all([
      prisma.inventoryTransaction.aggregate({
        where: { partId, direction: 'IN' },
        _sum: { quantity: true }
      }),
      prisma.inventoryTransaction.aggregate({
        where: { partId, direction: 'OUT' },
        _sum: { quantity: true }
      })
    ]);

    const inQty = incoming._sum.quantity ?? 0;
    const outQty = outgoing._sum.quantity ?? 0;

    const stock = inQty - outQty;

    res.json({ partId, stock });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to calculate stock' });
  }
});

// Adjust stock for a part (manual stock correction)
router.post('/:partId/adjust', async (req, res) => {
  const partId = Number(req.params.partId);
  const { quantity } = req.body;

  if (isNaN(partId)) {
    return res.status(400).json({ error: 'Invalid part ID' });
  }

  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ error: 'Quantity must be a non-negative number' });
  }

  try {
    // Get current stock
    const [incoming, outgoing] = await Promise.all([
      prisma.inventoryTransaction.aggregate({
        where: { partId, direction: 'IN' },
        _sum: { quantity: true }
      }),
      prisma.inventoryTransaction.aggregate({
        where: { partId, direction: 'OUT' },
        _sum: { quantity: true }
      })
    ]);

    const currentStock = (incoming._sum.quantity ?? 0) - (outgoing._sum.quantity ?? 0);
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
      previousStock: currentStock, 
      newStock: quantity,
      adjustment: difference
    });
  } catch (e) {
    console.error(e);
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
      
      const partIds = partsWithPurchases.map((t: { partId: number }) => t.partId);
      partFilter = {
        isDeleted: false,
        id: { in: partIds }
      };
    }

    const parts = await prisma.part.findMany({
      where: partFilter,
      orderBy: { partNumber: 'asc' }
    });

    const stockPromises = parts.map(async (p: any) => {
      const [incoming, outgoing] = await Promise.all([
        prisma.inventoryTransaction.aggregate({
          where: { partId: p.id, direction: 'IN' },
          _sum: { quantity: true }
        }),
        prisma.inventoryTransaction.aggregate({
          where: { partId: p.id, direction: 'OUT' },
          _sum: { quantity: true }
        })
      ]);
      const inQty = incoming._sum.quantity ?? 0;
      const outQty = outgoing._sum.quantity ?? 0;
      return {
        ...p,
        stock: inQty - outQty
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
