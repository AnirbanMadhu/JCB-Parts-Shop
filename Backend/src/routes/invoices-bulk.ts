import { Router } from 'express';
import { prisma } from '../prisma';
import { InvoiceStatus } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Protect all routes with authentication
router.use(authenticateToken);

/**
 * GET /api/invoices/bulk
 * Get multiple invoices by IDs
 */
router.post('/bulk', async (req, res) => {
  const { ids } = req.body as { ids: number[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        supplier: true,
        customer: true,
        items: {
          include: {
            part: true
          }
        }
      }
    });

    res.json(invoices);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load invoices' });
  }
});

/**
 * POST /api/invoices/bulk-update-status
 * Update status for multiple invoices
 */
router.post('/bulk-update-status', async (req, res) => {
  const { ids, status } = req.body as { ids: number[]; status: InvoiceStatus };

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  if (!status || !Object.values(InvoiceStatus).includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  try {
    const result = await prisma.invoice.updateMany({
      where: {
        id: { in: ids }
      },
      data: {
        status
      }
    });

    res.json({ 
      success: true, 
      updated: result.count,
      message: `${result.count} invoice(s) updated to ${status}` 
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to update invoices' });
  }
});

/**
 * DELETE /api/invoices/bulk-delete
 * Delete multiple invoices (only DRAFT invoices)
 */
router.post('/bulk-delete', async (req, res) => {
  const { ids } = req.body as { ids: number[] };

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids array is required' });
  }

  try {
    // First, verify all invoices are DRAFT
    const invoices = await prisma.invoice.findMany({
      where: { id: { in: ids } },
      select: { id: true, status: true }
    });

    const nonDraftInvoices = invoices.filter(inv => inv.status !== InvoiceStatus.DRAFT);
    
    if (nonDraftInvoices.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete ${nonDraftInvoices.length} non-draft invoice(s). Only DRAFT invoices can be deleted.`,
        nonDraftIds: nonDraftInvoices.map(inv => inv.id)
      });
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
      // Get all invoice items
      const items = await tx.invoiceItem.findMany({
        where: { invoiceId: { in: ids } },
        select: { id: true }
      });

      const itemIds = items.map(item => item.id);

      // Delete inventory transactions
      await tx.inventoryTransaction.deleteMany({
        where: { invoiceItemId: { in: itemIds } }
      });

      // Delete invoice items
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: { in: ids } }
      });

      // Delete invoices
      await tx.invoice.deleteMany({
        where: { id: { in: ids } }
      });
    });

    res.json({ 
      success: true, 
      deleted: ids.length,
      message: `${ids.length} invoice(s) deleted successfully` 
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to delete invoices' });
  }
});

/**
 * POST /api/invoices/statistics
 * Get statistics for invoices (used in dashboard)
 */
router.get('/statistics', async (req, res) => {
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  try {
    const where: any = {};
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [
      totalPurchases,
      totalSales,
      purchaseSum,
      salesSum,
      paidPurchases,
      paidSales
    ] = await Promise.all([
      prisma.invoice.count({ where: { ...where, type: 'PURCHASE' } }),
      prisma.invoice.count({ where: { ...where, type: 'SALE' } }),
      prisma.invoice.aggregate({
        where: { ...where, type: 'PURCHASE' },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { ...where, type: 'SALE' },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { ...where, type: 'PURCHASE', paymentStatus: 'PAID' },
        _sum: { paidAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { ...where, type: 'SALE', paymentStatus: 'PAID' },
        _sum: { paidAmount: true }
      })
    ]);

    res.json({
      purchases: {
        count: totalPurchases,
        total: purchaseSum._sum.total || 0,
        paid: paidPurchases._sum.paidAmount || 0
      },
      sales: {
        count: totalSales,
        total: salesSum._sum.total || 0,
        paid: paidSales._sum.paidAmount || 0
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

export default router;
