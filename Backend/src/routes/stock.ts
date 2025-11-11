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

// Optional: list stock for all parts (for report like your Excel)
router.get('/', async (_req, res) => {
  try {
    const parts = await prisma.part.findMany({ orderBy: { partNumber: 'asc' } });

    const stockPromises = parts.map(async (p) => {
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
