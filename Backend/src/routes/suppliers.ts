import { Router } from 'express';
import { prisma } from '../prisma';
import { SupplierCreateBody } from '../types';

const router = Router();

// Create a new supplier
router.post('/', async (req, res) => {
  const body = req.body as SupplierCreateBody;

  if (!body.name) {
    return res.status(400).json({ error: 'Supplier name is required' });
  }

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        email: body.email,
        contactPerson: body.contactPerson,
        address: body.address,
        phone: body.phone,
        gstin: body.gstin,
        state: body.state
      }
    });

    res.status(201).json(supplier);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

// Get all suppliers
router.get('/', async (req, res) => {
  const { search } = req.query as { search?: string };

  try {
    const suppliers = await prisma.supplier.findMany({
      where: search
        ? {
            isDeleted: false,
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { gstin: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } }
            ]
          }
        : { isDeleted: false },
      orderBy: { name: 'asc' }
    });

    res.json(suppliers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load suppliers' });
  }
});

// Get single supplier by ID
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid supplier ID. Must be a number.' });
  }

  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseInvoices: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load supplier' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as SupplierCreateBody;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid supplier ID. Must be a number.' });
  }

  if (!body.name) {
    return res.status(400).json({ error: 'Supplier name is required' });
  }

  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        contactPerson: body.contactPerson,
        address: body.address,
        phone: body.phone,
        gstin: body.gstin,
        state: body.state
      }
    });

    res.json(supplier);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier (soft delete)
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid supplier ID. Must be a number.' });
  }

  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isDeleted: true }
    });
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;
