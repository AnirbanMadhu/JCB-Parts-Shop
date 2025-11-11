import { Router } from 'express';
import { prisma } from '../prisma';
import { InvoiceCreateBody } from '../types';
import { InvoiceType, InventoryDirection } from '@prisma/client';
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

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber: body.invoiceNumber,
          date: new Date(body.date),
          type: body.type as InvoiceType,
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

export default router;
