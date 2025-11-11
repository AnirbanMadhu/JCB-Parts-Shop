import { Router } from 'express';
import { prisma } from '../prisma';
import { PartCreateBody } from '../types';

const router = Router();

// Create / update part from manual entry or barcode scan
router.post('/', async (req, res) => {
  const body = req.body as PartCreateBody;

  if (!body.partNumber || !body.itemName || !body.hsnCode) {
    return res.status(400).json({ error: 'partNumber, itemName, hsnCode required' });
  }

  // Set defaults for required fields if not provided
  const gstPercent = body.gstPercent ?? 18;
  const unit = body.unit ?? 'PCS';

  try {
    const part = await prisma.part.upsert({
      where: { partNumber: body.partNumber },
      update: {
        itemName: body.itemName,
        description: body.description,
        hsnCode: body.hsnCode,
        gstPercent,
        unit,
        mrp: body.mrp,
        rtl: body.rtl,
        barcode: body.barcode,
        qrCode: body.qrCode
      },
      create: {
        partNumber: body.partNumber,
        itemName: body.itemName,
        description: body.description,
        hsnCode: body.hsnCode,
        gstPercent,
        unit,
        mrp: body.mrp,
        rtl: body.rtl,
        barcode: body.barcode,
        qrCode: body.qrCode
      }
    });

    res.json(part);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save part' });
  }
});

// Search by partNumber or barcode (used when scanning)
router.get('/search', async (req, res) => {
  const { q, barcode } = req.query as { q?: string; barcode?: string };

  try {
    if (barcode) {
      const part = await prisma.part.findUnique({ where: { barcode } });
      if (!part) return res.status(404).json({ error: 'Part not found' });
      return res.json(part);
    }

    const parts = await prisma.part.findMany({
      where: q
        ? {
            OR: [
              { partNumber: { contains: q, mode: 'insensitive' } },
              { itemName: { contains: q, mode: 'insensitive' } }
            ]
          }
        : undefined,
      take: 50,
      orderBy: { partNumber: 'asc' }
    });

    res.json(parts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to search parts' });
  }
});

// Get single part by ID
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  
  // Check if ID is a valid number
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid part ID. Must be a number.' });
  }
  
  try {
    const part = await prisma.part.findUnique({ where: { id } });
    if (!part) return res.status(404).json({ error: 'Part not found' });
    res.json(part);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load part' });
  }
});

// Update part
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as PartCreateBody;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid part ID. Must be a number.' });
  }

  if (!body.partNumber || !body.itemName || !body.hsnCode) {
    return res.status(400).json({ error: 'partNumber, itemName, hsnCode required' });
  }

  const gstPercent = body.gstPercent ?? 18;
  const unit = body.unit ?? 'PCS';

  try {
    const part = await prisma.part.update({
      where: { id },
      data: {
        partNumber: body.partNumber,
        itemName: body.itemName,
        description: body.description,
        hsnCode: body.hsnCode,
        gstPercent,
        unit,
        mrp: body.mrp,
        rtl: body.rtl,
        barcode: body.barcode,
        qrCode: body.qrCode
      }
    });

    res.json(part);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update part' });
  }
});

// Delete part
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid part ID. Must be a number.' });
  }

  try {
    await prisma.part.delete({ where: { id } });
    res.json({ success: true, message: 'Part deleted' });
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Cannot delete part with existing invoices or transactions' 
      });
    }
    res.status(500).json({ error: 'Failed to delete part' });
  }
});

export default router;
