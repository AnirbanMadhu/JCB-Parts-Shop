import { Router } from 'express';
import { prisma } from '../prisma';
import { InvoiceCreateBody } from '../types';
import { InvoiceType, InventoryDirection, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// Create purchase or sales invoice
router.post('/', async (req, res) => {
  const body = req.body as InvoiceCreateBody;

  if (!body.invoiceNumber || !body.date || !body.type || !body.items?.length) {
    return res.status(400).json({ error: 'invoiceNumber, date, type, items required' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // calculate totals
      let subtotal = new Decimal(0);
      const itemsData: any[] = [];

      for (const item of body.items) {
        const part = await tx.part.findUnique({ where: { id: item.partId } });
        if (!part) throw new Error(`Part ${item.partId} not found`);

        const qty = new Decimal(item.quantity);
        const rate = new Decimal(item.rate);
        const amount = qty.mul(rate);
        subtotal = subtotal.add(amount);

        itemsData.push({
          partId: part.id,
          hsnCode: part.hsnCode,
          quantity: item.quantity,
          unit: item.unit || part.unit,
          rate,
          amount
        });
      }

      const discountPercent = body.discountPercent ?? 0;
      const discountAmount = subtotal.mul(discountPercent).div(100);

      const taxableValue = subtotal.sub(discountAmount);

      const cgstPercent = body.cgstPercent ?? 0;
      const sgstPercent = body.sgstPercent ?? 0;

      const cgstAmount = taxableValue.mul(cgstPercent).div(100);
      const sgstAmount = taxableValue.mul(sgstPercent).div(100);

      const gross = taxableValue.add(cgstAmount).add(sgstAmount);

      // round to nearest rupee like invoice
      const roundedTotal = gross.toDecimalPlaces(0);
      const roundOff = roundedTotal.sub(gross);

      // Parse the date and set time to current time
      const invoiceDate = new Date(body.date);
      const now = new Date();
      invoiceDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: body.invoiceNumber,
          date: invoiceDate,
          type: body.type as InvoiceType,
          status: body.status as InvoiceStatus || InvoiceStatus.SUBMITTED,
          supplierId: body.type === 'PURCHASE' ? body.supplierId ?? null : null,
          customerId: body.type === 'SALE' ? body.customerId ?? null : null,
          subtotal,
          discountPercent,
          discountAmount,
          taxableValue,
          cgstPercent,
          cgstAmount,
          sgstPercent,
          sgstAmount,
          roundOff,
          total: roundedTotal,
          items: {
            create: itemsData
          }
        },
        include: { items: true }
      });

      // create inventory transactions for each item
      const direction =
        body.type === 'PURCHASE'
          ? InventoryDirection.IN
          : InventoryDirection.OUT;

      for (const item of invoice.items) {
        await tx.inventoryTransaction.create({
          data: {
            partId: item.partId,
            invoiceItemId: item.id,
            direction,
            quantity: item.quantity
          }
        });
      }

      return invoice;
    });

    res.status(201).json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to create invoice' });
  }
});

// Get all invoices with filters
router.get('/', async (req, res) => {
  const { type, startDate, endDate, supplierId, customerId, limit = '50' } = req.query as {
    type?: 'PURCHASE' | 'SALE';
    startDate?: string;
    endDate?: string;
    supplierId?: string;
    customerId?: string;
    limit?: string;
  };

  try {
    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }
    
    if (supplierId) {
      where.supplierId = Number(supplierId);
    }
    
    if (customerId) {
      where.customerId = Number(customerId);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        supplier: true,
        customer: true,
        items: {
          include: {
            part: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: Number(limit)
    });

    res.json(invoices);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load invoices' });
  }
});

// Get invoice with items
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  
  // Check if ID is a valid number
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid invoice ID. Must be a number.' });
  }
  
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            part: true
          }
        },
        supplier: true,
        customer: true
      }
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    res.json(invoice);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load invoice' });
  }
});

// Update invoice (only DRAFT invoices can be updated)
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as InvoiceCreateBody;
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid invoice ID. Must be a number.' });
  }

  if (!body.invoiceNumber || !body.date || !body.type || !body.items?.length) {
    return res.status(400).json({ error: 'invoiceNumber, date, type, items required' });
  }

  try {
    // Check if invoice exists and is DRAFT
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (existingInvoice.status !== InvoiceStatus.DRAFT) {
      return res.status(400).json({ error: 'Only DRAFT invoices can be edited' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Delete existing invoice items and their inventory transactions
      await tx.inventoryTransaction.deleteMany({
        where: {
          invoiceItemId: {
            in: existingInvoice.items.map(item => item.id)
          }
        }
      });

      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      // Calculate new totals
      let subtotal = new Decimal(0);
      const itemsData: any[] = [];

      for (const item of body.items) {
        const part = await tx.part.findUnique({ where: { id: item.partId } });
        if (!part) throw new Error(`Part ${item.partId} not found`);

        const qty = new Decimal(item.quantity);
        const rate = new Decimal(item.rate);
        const amount = qty.mul(rate);
        subtotal = subtotal.add(amount);

        itemsData.push({
          partId: part.id,
          hsnCode: part.hsnCode,
          quantity: item.quantity,
          unit: item.unit || part.unit,
          rate,
          amount
        });
      }

      const discountPercent = body.discountPercent ?? 0;
      const discountAmount = subtotal.mul(discountPercent).div(100);
      const taxableValue = subtotal.sub(discountAmount);
      const cgstPercent = body.cgstPercent ?? 0;
      const sgstPercent = body.sgstPercent ?? 0;
      const cgstAmount = taxableValue.mul(cgstPercent).div(100);
      const sgstAmount = taxableValue.mul(sgstPercent).div(100);
      const gross = taxableValue.add(cgstAmount).add(sgstAmount);
      const roundedTotal = gross.toDecimalPlaces(0);
      const roundOff = roundedTotal.sub(gross);

      // Parse the date and set time to current time if status changes
      const invoiceDate = new Date(body.date);
      if (body.status && body.status !== InvoiceStatus.DRAFT) {
        const now = new Date();
        invoiceDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      }

      // Update the invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          invoiceNumber: body.invoiceNumber,
          date: invoiceDate,
          status: body.status as InvoiceStatus || InvoiceStatus.DRAFT,
          supplierId: body.type === 'PURCHASE' ? body.supplierId ?? null : null,
          customerId: body.type === 'SALE' ? body.customerId ?? null : null,
          subtotal,
          discountPercent,
          discountAmount,
          taxableValue,
          cgstPercent,
          cgstAmount,
          sgstPercent,
          sgstAmount,
          roundOff,
          total: roundedTotal,
          items: {
            create: itemsData
          }
        },
        include: { items: true }
      });

      // Create new inventory transactions
      const direction =
        body.type === 'PURCHASE'
          ? InventoryDirection.IN
          : InventoryDirection.OUT;

      for (const item of updatedInvoice.items) {
        await tx.inventoryTransaction.create({
          data: {
            partId: item.partId,
            invoiceItemId: item.id,
            direction,
            quantity: item.quantity
          }
        });
      }

      return updatedInvoice;
    });

    res.json(result);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to update invoice' });
  }
});

export default router;
