import { Router } from 'express';
import { prisma } from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { cacheMiddleware } from '../middleware/cache';
// import { authenticateToken } from '../middleware/auth';

const router = Router();

// TODO: Re-enable authentication after verifying data access
// router.use(authenticateToken);

// Dashboard statistics - Cache for 30 seconds
router.get('/dashboard', cacheMiddleware(30), async (_req, res) => {
  try {
    const [totalParts, activeParts, totalSuppliers, activeSuppliers, totalCustomers, activeCustomers] = await Promise.all([
      prisma.part.count(),
      prisma.part.count({ where: { isDeleted: false } }),
      prisma.supplier.count(),
      prisma.supplier.count({ where: { isDeleted: false } }),
      prisma.customer.count(),
      prisma.customer.count({ where: { isDeleted: false } })
    ]);

    const [purchaseInvoices, salesInvoices] = await Promise.all([
      prisma.invoice.aggregate({
        where: { type: 'PURCHASE', status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true
      }),
      prisma.invoice.aggregate({
        where: { type: 'SALE', status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: true
      })
    ]);

    // Get parts with low stock (less than 5 units)
    const lowStockParts = await prisma.$queryRaw`
        SELECT 
          p.id,
          p."partNumber",
          p."itemName",
          COALESCE(SUM(CASE WHEN it.direction = 'IN' THEN it.quantity ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN it.direction = 'OUT' THEN it.quantity ELSE 0 END), 0) as stock
        FROM "Part" p
        LEFT JOIN "InventoryTransaction" it ON it."partId" = p.id
        WHERE p."isDeleted" = false
        GROUP BY p.id, p."partNumber", p."itemName"
        HAVING 
          COALESCE(SUM(CASE WHEN it.direction = 'IN' THEN it.quantity ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN it.direction = 'OUT' THEN it.quantity ELSE 0 END), 0) < 5
        ORDER BY stock ASC
        LIMIT 10
      ` as any[];

    res.json({
      totalParts,
      activeParts,
      totalSuppliers,
      activeSuppliers,
      totalCustomers,
      activeCustomers,
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

// Weekly purchase data for current month
router.get('/weekly-purchases', async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    
    // Validate year and month
    let currentYear = now.getFullYear();
    let currentMonth = now.getMonth() + 1; // 1-12
    
    if (year) {
      const yearNum = parseInt(year as string);
      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
        return res.status(400).json({ error: 'Invalid year. Must be between 2000 and 2100' });
      }
      currentYear = yearNum;
    }
    
    if (month) {
      const monthNum = parseInt(month as string);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: 'Invalid month. Must be between 1 and 12' });
      }
      currentMonth = monthNum;
    }

    // Get first and last day of the month
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    // Get all purchase invoices for the month
    const purchaseInvoices = await prisma.invoice.findMany({
      where: {
        type: 'PURCHASE',
        status: { not: 'CANCELLED' },
        date: {
          gte: firstDay,
          lte: lastDay
        }
      },
      select: {
        date: true,
        total: true,
        id: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Calculate weeks in the month
    const weeks: Array<{
      weekNumber: number;
      weekLabel: string;
      dateRange: string;
      startDate: string;
      endDate: string;
      purchases: number;
      invoiceCount: number;
    }> = [];

    // Divide month into weeks
    let weekNumber = 1;
    let currentWeekStart = new Date(firstDay);

    while (currentWeekStart <= lastDay) {
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
      
      // Don't go past the end of the month
      if (currentWeekEnd > lastDay) {
        currentWeekEnd.setTime(lastDay.getTime());
      }

      // Calculate purchases for this week
      const weekPurchases = purchaseInvoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= currentWeekStart && invDate <= currentWeekEnd;
      });

      const totalPurchases = weekPurchases.reduce((sum, inv) => {
        return sum + parseFloat(inv.total.toString());
      }, 0);

      const startDay = currentWeekStart.getDate();
      const endDay = currentWeekEnd.getDate();
      const dateRange = `${startDay}-${endDay}`;

      weeks.push({
        weekNumber,
        weekLabel: `Week ${weekNumber}`,
        dateRange,
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: currentWeekEnd.toISOString().split('T')[0],
        purchases: totalPurchases,
        invoiceCount: weekPurchases.length
      });

      // Move to next week
      currentWeekStart = new Date(currentWeekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
      weekNumber++;
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    res.json({
      month: monthNames[currentMonth - 1],
      year: currentYear,
      weeks
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load weekly purchase data' });
  }
});

// Weekly sales data for current month
router.get('/weekly-sales', async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const currentYear = year ? parseInt(year as string) : now.getFullYear();
    const currentMonth = month ? parseInt(month as string) : now.getMonth() + 1; // 1-12

    // Get first and last day of the month
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);

    // Get all sales invoices for the month
    const salesInvoices = await prisma.invoice.findMany({
      where: {
        type: 'SALE',
        status: { not: 'CANCELLED' },
        date: {
          gte: firstDay,
          lte: lastDay
        }
      },
      select: {
        date: true,
        total: true,
        id: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Calculate weeks in the month
    const weeks: Array<{
      weekNumber: number;
      weekLabel: string;
      dateRange: string;
      startDate: string;
      endDate: string;
      sales: number;
      invoiceCount: number;
    }> = [];

    // Divide month into weeks
    let weekNumber = 1;
    let currentWeekStart = new Date(firstDay);

    while (currentWeekStart <= lastDay) {
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
      
      // Don't go past the end of the month
      if (currentWeekEnd > lastDay) {
        currentWeekEnd.setTime(lastDay.getTime());
      }

      // Calculate sales for this week
      const weekSales = salesInvoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate >= currentWeekStart && invDate <= currentWeekEnd;
      });

      const totalSales = weekSales.reduce((sum, inv) => {
        return sum + parseFloat(inv.total.toString());
      }, 0);

      const startDay = currentWeekStart.getDate();
      const endDay = currentWeekEnd.getDate();
      const dateRange = `${startDay}-${endDay}`;

      weeks.push({
        weekNumber,
        weekLabel: `Week ${weekNumber}`,
        dateRange,
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: currentWeekEnd.toISOString().split('T')[0],
        sales: totalSales,
        invoiceCount: weekSales.length
      });

      // Move to next week
      currentWeekStart = new Date(currentWeekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
      weekNumber++;
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    res.json({
      month: monthNames[currentMonth - 1],
      year: currentYear,
      weeks
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load weekly sales data' });
  }
});

// Monthly cashflow data (rolling 12 months with running balance)
router.get('/cashflow', async (req, res) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const currentYear = year ? parseInt(year as string) : now.getFullYear();
    const currentMonth = month ? parseInt(month as string) : now.getMonth() + 1; // 1-12

    // Calculate date range for last 12 months from current month
    const endDate = new Date(currentYear, currentMonth, 1); // First day of NEXT month (to include current month)
    const startDate = new Date(currentYear, currentMonth - 12, 1); // 12 months back

    // Get all sales and purchases in the date range
    const salesData = await prisma.$queryRaw<Array<{ year: number; month: number; total: number }>>`
      SELECT 
        EXTRACT(YEAR FROM date)::INTEGER as year,
        EXTRACT(MONTH FROM date)::INTEGER as month,
        SUM(total)::DECIMAL as total
      FROM "Invoice"
      WHERE type = 'SALE' 
        AND status != 'CANCELLED'
        AND date >= ${startDate}
        AND date < ${endDate}
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year, month
    `;

    const purchaseData = await prisma.$queryRaw<Array<{ year: number; month: number; total: number }>>`
      SELECT 
        EXTRACT(YEAR FROM date)::INTEGER as year,
        EXTRACT(MONTH FROM date)::INTEGER as month,
        SUM(total)::DECIMAL as total
      FROM "Invoice"
      WHERE type = 'PURCHASE' 
        AND status != 'CANCELLED'
        AND date >= ${startDate}
        AND date < ${endDate}
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year, month
    `;

    // Create monthly data for last 12 months with running stock balance
    const monthlyData = [];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    let runningStockBalance = 0; // Cumulative stock value

    // Generate 12 months of data
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(currentYear, currentMonth - 12 + i, 1);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1;

      const sales = salesData.find(s => s.year === targetYear && s.month === targetMonth);
      const purchase = purchaseData.find(p => p.year === targetYear && p.month === targetMonth);

      const salesAmount = sales ? parseFloat(sales.total.toString()) : 0;
      const purchaseAmount = purchase ? parseFloat(purchase.total.toString()) : 0;

      // Stock balance: increases with purchases, decreases with sales
      runningStockBalance += purchaseAmount - salesAmount;

      monthlyData.push({
        month: targetMonth,
        year: targetYear,
        monthName: monthNames[targetMonth - 1],
        monthYear: `${monthNames[targetMonth - 1]} ${targetYear}`,
        sales: salesAmount,
        purchases: purchaseAmount,
        netCashflow: salesAmount - purchaseAmount, // Profit for the month
        stockBalance: Math.max(0, runningStockBalance) // Stock value (can't be negative)
      });
    }

    res.json({
      startMonth: monthlyData[0]?.monthYear || '',
      endMonth: monthlyData[11]?.monthYear || '',
      data: monthlyData
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load cashflow data' });
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
    const where: any = {
      status: { notIn: ['CANCELLED', 'DRAFT'] }
    };
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);  // Include the entire end date
        where.date.lte = end;
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

// Balance Sheet (Assets, Liabilities, Equity)
router.get('/balance-sheet', async (req, res) => {
  const { asOfDate } = req.query as {
    asOfDate?: string;
  };

  try {
    // Use provided date or current date
    const balanceDate = asOfDate ? new Date(asOfDate) : new Date();
    balanceDate.setHours(23, 59, 59, 999);

    // Get all purchase and sales invoices up to the balance date
    const [purchases, sales, stockValue] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          type: 'PURCHASE',
          status: { notIn: ['CANCELLED', 'DRAFT'] },
          date: { lte: balanceDate }
        },
        _sum: { total: true, paidAmount: true }
      }),
      prisma.invoice.aggregate({
        where: {
          type: 'SALE',
          status: { notIn: ['CANCELLED', 'DRAFT'] },
          date: { lte: balanceDate }
        },
        _sum: { total: true, paidAmount: true }
      }),
      // Calculate current stock value (inventory)
      prisma.$queryRaw<Array<{ totalValue: number }>>`
        SELECT 
          COALESCE(SUM(
            CASE 
              WHEN it.direction = 'IN' THEN it.quantity * p.mrp
              ELSE 0
            END
          ), 0) - COALESCE(SUM(
            CASE 
              WHEN it.direction = 'OUT' THEN it.quantity * p.mrp
              ELSE 0
            END
          ), 0) as "totalValue"
        FROM "Part" p
        LEFT JOIN "InventoryTransaction" it ON it."partId" = p.id
        LEFT JOIN "InvoiceItem" ii ON ii.id = it."invoiceItemId"
        LEFT JOIN "Invoice" i ON i.id = ii."invoiceId"
        WHERE p."isDeleted" = false
          AND (i.id IS NULL OR i.date <= ${balanceDate})
      `
    ]);

    const totalPurchases = purchases._sum.total || new Decimal(0);
    const totalSales = sales._sum.total || new Decimal(0);
    const purchasesPaid = purchases._sum.paidAmount || new Decimal(0);
    const salesPaid = sales._sum.paidAmount || new Decimal(0);
    
    // Calculate receivables (sales not yet paid)
    const accountsReceivable = totalSales.sub(salesPaid);
    
    // Calculate payables (purchases not yet paid)
    const accountsPayable = totalPurchases.sub(purchasesPaid);
    
    // Inventory value
    const inventory = new Decimal(stockValue[0]?.totalValue || 0);
    
    // Cash in hand (simplified: sales paid - purchases paid)
    const cash = salesPaid.sub(purchasesPaid);
    
    // Total Assets
    const totalAssets = cash.add(accountsReceivable).add(inventory);
    
    // Retained Earnings (cumulative profit)
    const retainedEarnings = totalSales.sub(totalPurchases);
    
    // Total Liabilities
    const totalLiabilities = accountsPayable;
    
    // Total Equity (Assets - Liabilities)
    const totalEquity = totalAssets.sub(totalLiabilities);

    res.json({
      asOfDate: balanceDate.toISOString().split('T')[0],
      assets: {
        currentAssets: {
          cash: Number(cash),
          accountsReceivable: Number(accountsReceivable),
          inventory: Number(inventory),
          total: Number(totalAssets)
        },
        total: Number(totalAssets)
      },
      liabilities: {
        currentLiabilities: {
          accountsPayable: Number(accountsPayable),
          total: Number(totalLiabilities)
        },
        total: Number(totalLiabilities)
      },
      equity: {
        retainedEarnings: Number(retainedEarnings),
        total: Number(totalEquity)
      },
      totalLiabilitiesAndEquity: Number(totalLiabilities.add(totalEquity))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate balance sheet' });
  }
});

export default router;
