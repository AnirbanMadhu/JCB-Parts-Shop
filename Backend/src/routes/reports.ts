import { Router } from 'express';
import { prisma } from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// Dashboard statistics
router.get('/dashboard', async (_req, res) => {
  try {
    const [
      totalParts,
      totalSuppliers,
      totalCustomers,
      purchaseInvoices,
      salesInvoices,
      lowStockParts
    ] = await Promise.all([
      prisma.part.count(),
      prisma.supplier.count(),
      prisma.customer.count(),
      prisma.invoice.aggregate({
        where: { type: 'PURCHASE' },
        _sum: { total: true },
        _count: true
      }),
      prisma.invoice.aggregate({
        where: { type: 'SALE' },
        _sum: { total: true },
        _count: true
      }),
      // Get parts with low stock (less than 5 units)
      prisma.$queryRaw`
        SELECT 
          p.id,
          p."partNumber",
          p."itemName",
          COALESCE(SUM(CASE WHEN it.direction = 'IN' THEN it.quantity ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN it.direction = 'OUT' THEN it.quantity ELSE 0 END), 0) as stock
        FROM "Part" p
        LEFT JOIN "InventoryTransaction" it ON it."partId" = p.id
        GROUP BY p.id, p."partNumber", p."itemName"
        HAVING 
          COALESCE(SUM(CASE WHEN it.direction = 'IN' THEN it.quantity ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN it.direction = 'OUT' THEN it.quantity ELSE 0 END), 0) < 5
        ORDER BY stock ASC
        LIMIT 10
      `
    ]);

    res.json({
      totalParts,
      totalSuppliers,
      totalCustomers,
      purchases: {
        count: purchaseInvoices._count,
        total: purchaseInvoices._sum.total || new Decimal(0)
      },
      sales: {
        count: salesInvoices._count,
        total: salesInvoices._sum.total || new Decimal(0)
      },
      lowStockParts
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate dashboard report' });
  }
});

// Monthly sales/purchase report
router.get('/monthly', async (req, res) => {
  const { year = new Date().getFullYear().toString(), type } = req.query as {
    year?: string;
    type?: 'PURCHASE' | 'SALE';
  };

  try {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const where: any = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };

    if (type) {
      where.type = type;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      select: {
        date: true,
        total: true,
        type: true
      }
    });

    // Group by month
    const monthlyData: Record<string, { purchase: Decimal; sale: Decimal }> = {};
    
    for (let i = 1; i <= 12; i++) {
      const month = i.toString().padStart(2, '0');
      monthlyData[month] = { purchase: new Decimal(0), sale: new Decimal(0) };
    }

    invoices.forEach(inv => {
      const month = (inv.date.getMonth() + 1).toString().padStart(2, '0');
      if (inv.type === 'PURCHASE') {
        monthlyData[month].purchase = monthlyData[month].purchase.add(inv.total);
      } else {
        monthlyData[month].sale = monthlyData[month].sale.add(inv.total);
      }
    });

    res.json({ year, data: monthlyData });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// Top selling parts
router.get('/top-parts', async (req, res) => {
  const { limit = '10', type = 'SALE' } = req.query as {
    limit?: string;
    type?: 'PURCHASE' | 'SALE';
  };

  try {
    const topParts = await prisma.$queryRaw`
      SELECT 
        p.id,
        p."partNumber",
        p."itemName",
        SUM(ii.quantity) as "totalQuantity",
        SUM(ii.amount) as "totalAmount"
      FROM "InvoiceItem" ii
      JOIN "Part" p ON p.id = ii."partId"
      JOIN "Invoice" i ON i.id = ii."invoiceId"
      WHERE i.type = ${type}
      GROUP BY p.id, p."partNumber", p."itemName"
      ORDER BY "totalAmount" DESC
      LIMIT ${Number(limit)}
    `;

    res.json(topParts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate top parts report' });
  }
});

// Profit/Loss calculation (sales - purchases)
router.get('/profit-loss', async (req, res) => {
  const { startDate, endDate } = req.query as {
    startDate?: string;
    endDate?: string;
  };

  try {
    const where: any = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const [purchases, sales] = await Promise.all([
      prisma.invoice.aggregate({
        where: { ...where, type: 'PURCHASE' },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { ...where, type: 'SALE' },
        _sum: { total: true }
      })
    ]);

    const totalPurchases = purchases._sum.total || new Decimal(0);
    const totalSales = sales._sum.total || new Decimal(0);
    const profitLoss = totalSales.sub(totalPurchases);

    res.json({
      totalPurchases,
      totalSales,
      profitLoss,
      profitMargin: totalSales.greaterThan(0) 
        ? profitLoss.div(totalSales).mul(100).toFixed(2) + '%'
        : '0%'
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate profit/loss report' });
  }
});

export default router;
