import { Router } from 'express';
import { prisma } from '../prisma';
import { InvoiceCreateBody } from '../types';
import { InvoiceType, InventoryDirection, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// Generate next invoice number for customer/supplier
router.get('/next-number', async (req, res) => {
  const { type, customerId, supplierId } = req.query as {
    type?: 'PURCHASE' | 'SALE';
    customerId?: string;
    supplierId?: string;
  };

  try {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();
    
    // Financial year runs from April to March
    // If month is Jan-Mar (0-2), we're in the second half of financial year
    // If month is Apr-Dec (3-11), we're in the first half of financial year
    let financialYearStart, financialYearEnd;
    if (currentMonth >= 3) { // April (3) to December (11)
      financialYearStart = currentYear;
      financialYearEnd = currentYear + 1;
    } else { // January (0) to March (2)
      financialYearStart = currentYear - 1;
      financialYearEnd = currentYear;
    }
    
    const year = financialYearStart.toString().slice(-2);
    const nextYear = financialYearEnd.toString().slice(-2);

    // Calculate month/year range for filtering
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let sequenceNumber = 1;

    // Get count of ALL invoices of this type in current month/year (resets monthly)
    if (type === 'SALE') {
      const invoiceCount = await prisma.invoice.count({
        where: {
          type: InvoiceType.SALE,
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });
      sequenceNumber = invoiceCount + 1;
    } else if (type === 'PURCHASE') {
      const invoiceCount = await prisma.invoice.count({
        where: {
          type: InvoiceType.PURCHASE,
          date: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      });
      sequenceNumber = invoiceCount + 1;
    }

    // Format: JCB/SequenceNumber/MONTH/YY-YY (e.g., JCB/02/NOV/25-26)
    const invoiceNumber = `JCB/${sequenceNumber.toString().padStart(2, '0')}/${month}/${year}-${nextYear}`;

    res.json({ invoiceNumber, sequenceNumber, financialYear: `${year}-${nextYear}` });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to generate invoice number' });
  }
});

// Create purchase or sales invoice
router.post('/', async (req, res) => {
  const body = req.body as InvoiceCreateBody;

  console.log(`[INVOICE CREATE] Type: ${body.type}, Invoice#: ${body.invoiceNumber}, Items: ${body.items?.length || 0}, Discount: ${body.discountPercent}% / ₹${body.discountAmount}`);

  if (!body.invoiceNumber || !body.date || !body.type || !body.items?.length) {
    console.error('[INVOICE CREATE] Validation failed - missing required fields');
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

      // Handle both percentage and fixed amount discount on subtotal first
      const discountPercent = body.discountPercent ?? 0;
      let discountAmount = new Decimal(0);
      
      if (body.discountAmount !== undefined && body.discountAmount !== null && body.discountAmount > 0) {
        // Fixed amount discount provided
        discountAmount = new Decimal(body.discountAmount);
      } else if (discountPercent > 0) {
        // Percentage discount on subtotal (before tax)
        discountAmount = subtotal.mul(discountPercent).div(100);
      }

      // Calculate taxable value after discount
      const taxableValue = subtotal.sub(discountAmount);

      const cgstPercent = body.cgstPercent ?? 0;
      const sgstPercent = body.sgstPercent ?? 0;

      const cgstAmount = taxableValue.mul(cgstPercent).div(100);
      const sgstAmount = taxableValue.mul(sgstPercent).div(100);

      // Calculate gross total (taxable value + taxes)
      const gross = taxableValue.add(cgstAmount).add(sgstAmount);

      // round to nearest rupee like invoice
      const roundedTotal = gross.toDecimalPlaces(0);
      const roundOff = roundedTotal.sub(gross);

      // Use current system date and time for invoice creation
      const invoiceDate = new Date();

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
          deliveryNote: body.deliveryNote,
          buyerOrderNo: body.buyerOrderNo,
          dispatchDocNo: body.dispatchDocNo,
          deliveryNoteDate: body.deliveryNoteDate ? new Date(body.deliveryNoteDate) : null,
          dispatchedThrough: body.dispatchedThrough,
          termsOfDelivery: body.termsOfDelivery,
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

    console.log(`[INVOICE CREATE] ✓ Success - Created invoice ID: ${result.id}, Type: ${result.type}`);
    res.status(201).json(result);
  } catch (e: any) {
    console.error('[INVOICE CREATE] ✗ Error:', e.message || e);
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

  console.log(`[INVOICE LIST] Fetching invoices - Type: ${type || 'ALL'}, Limit: ${limit}`);

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
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      take: Number(limit)
    });

    console.log(`[INVOICE LIST] ✓ Found ${invoices.length} invoices (Type: ${type || 'ALL'})`);
    res.json(invoices);
  } catch (e) {
    console.error('[INVOICE LIST] ✗ Error:', e);
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
    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if editing is allowed based on status and settings
    const allowEditSubmitted = body.allowEditSubmitted ?? false;
    if (existingInvoice.status !== InvoiceStatus.DRAFT && !allowEditSubmitted) {
      return res.status(400).json({ error: 'Only DRAFT invoices can be edited. Enable "Allow Editing of Submitted Invoices" in Setup to edit submitted invoices.' });
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

      // Calculate tax on full subtotal (before discount)
      const taxableValue = subtotal;
      const cgstPercent = body.cgstPercent ?? 0;
      const sgstPercent = body.sgstPercent ?? 0;
      const cgstAmount = taxableValue.mul(cgstPercent).div(100);
      const sgstAmount = taxableValue.mul(sgstPercent).div(100);
      
      // Calculate gross before discount
      const grossBeforeDiscount = taxableValue.add(cgstAmount).add(sgstAmount);

      // Handle both percentage and fixed amount discount on grand total
      const discountPercent = body.discountPercent ?? 0;
      let discountAmount = new Decimal(0);
      
      if (body.discountAmount !== undefined && body.discountAmount !== null && body.discountAmount > 0) {
        // Fixed amount discount provided
        discountAmount = new Decimal(body.discountAmount);
      } else if (discountPercent > 0) {
        // Percentage discount on grand total (after tax)
        discountAmount = grossBeforeDiscount.mul(discountPercent).div(100);
      }

      const gross = grossBeforeDiscount.sub(discountAmount);
      const roundedTotal = gross.toDecimalPlaces(0);
      const roundOff = roundedTotal.sub(gross);

      // Use system time for status changes
      const invoiceDate = new Date();
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

// Update payment status (PATCH)
router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid invoice ID. Must be a number.' });
  }

  const { 
    paymentStatus, 
    paidAmount, 
    dueAmount, 
    paymentDate, 
    paymentMethod, 
    paymentNote, 
    note,
    deliveryNote,
    buyerOrderNo,
    dispatchDocNo,
    deliveryNoteDate,
    dispatchedThrough,
    termsOfDelivery
  } = req.body;

  try {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const updateData: any = {};
    
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (paidAmount !== undefined) updateData.paidAmount = new Decimal(paidAmount);
    if (dueAmount !== undefined) updateData.dueAmount = new Decimal(dueAmount);
    if (paymentDate !== undefined) updateData.paymentDate = paymentDate ? new Date(paymentDate) : null;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod || null;
    if (paymentNote !== undefined) updateData.paymentNote = paymentNote || null;
    if (note !== undefined) updateData.note = note || null;
    if (deliveryNote !== undefined) updateData.deliveryNote = deliveryNote || null;
    if (buyerOrderNo !== undefined) updateData.buyerOrderNo = buyerOrderNo || null;
    if (dispatchDocNo !== undefined) updateData.dispatchDocNo = dispatchDocNo || null;
    if (deliveryNoteDate !== undefined) updateData.deliveryNoteDate = deliveryNoteDate ? new Date(deliveryNoteDate) : null;
    if (dispatchedThrough !== undefined) updateData.dispatchedThrough = dispatchedThrough || null;
    if (termsOfDelivery !== undefined) updateData.termsOfDelivery = termsOfDelivery || null;

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        supplier: true,
        items: {
          include: {
            part: true
          }
        }
      }
    });

    res.json(updatedInvoice);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to update payment status' });
  }
});

export default router;
