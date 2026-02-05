import { Router } from 'express';
import { prisma } from '../prisma';
import { SupplierCreateBody } from '../types';

const router = Router();

// Create a new supplier
router.post('/', async (req, res) => {
  const body = req.body as SupplierCreateBody;

  // Comprehensive validation
  if (!body.name || !body.name.trim()) {
    return res.status(400).json({ error: 'Supplier name is required' });
  }

  const name = body.name.trim();
  const email = body.email?.trim();
  const contactPerson = body.contactPerson?.trim();
  const phone = body.phone?.trim();
  const gstin = body.gstin?.trim();
  const address = body.address?.trim();
  const state = body.state?.trim();

  // Validate lengths
  if (name.length > 200) {
    return res.status(400).json({ error: 'Name too long (max 200 characters)' });
  }
  if (email && email.length > 100) {
    return res.status(400).json({ error: 'Email too long (max 100 characters)' });
  }
  if (contactPerson && contactPerson.length > 100) {
    return res.status(400).json({ error: 'Contact person name too long (max 100 characters)' });
  }
  if (phone && phone.length > 20) {
    return res.status(400).json({ error: 'Phone too long (max 20 characters)' });
  }
  if (gstin && gstin.length > 15) {
    return res.status(400).json({ error: 'GSTIN too long (max 15 characters)' });
  }

  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate GSTIN format if provided
  if (gstin && !/^[0-9A-Z]{15}$/i.test(gstin)) {
    return res.status(400).json({ error: 'GSTIN must be 15 alphanumeric characters' });
  }

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name: name,
        email: email || null,
        contactPerson: contactPerson || null,
        address: address || null,
        phone: phone || null,
        gstin: gstin || null,
        state: state || null
      }
    });

    res.status(201).json(supplier);
  } catch (e: any) {
    console.error('Supplier creation error:', e);
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

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid supplier ID. Must be a positive number.' });
  }

  if (!body.name || !body.name.trim()) {
    return res.status(400).json({ error: 'Supplier name is required' });
  }

  const name = body.name.trim();
  const email = body.email?.trim();
  const contactPerson = body.contactPerson?.trim();
  const phone = body.phone?.trim();
  const gstin = body.gstin?.trim();
  const address = body.address?.trim();
  const state = body.state?.trim();

  // Validate lengths
  if (name.length > 200) {
    return res.status(400).json({ error: 'Name too long (max 200 characters)' });
  }
  if (email && email.length > 100) {
    return res.status(400).json({ error: 'Email too long (max 100 characters)' });
  }
  if (contactPerson && contactPerson.length > 100) {
    return res.status(400).json({ error: 'Contact person name too long (max 100 characters)' });
  }
  if (phone && phone.length > 20) {
    return res.status(400).json({ error: 'Phone too long (max 20 characters)' });
  }
  if (gstin && gstin.length > 15) {
    return res.status(400).json({ error: 'GSTIN too long (max 15 characters)' });
  }

  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate GSTIN format if provided
  if (gstin && !/^[0-9A-Z]{15}$/i.test(gstin)) {
    return res.status(400).json({ error: 'GSTIN must be 15 alphanumeric characters' });
  }

  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: name,
        email: email || null,
        contactPerson: contactPerson || null,
        address: address || null,
        phone: phone || null,
        gstin: gstin || null,
        state: state || null
      }
    });

    res.json(supplier);
  } catch (e: any) {
    console.error('Supplier update error:', e);
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(500).json({ error: 'Failed to update supplier' });
  }
});

// Delete supplier (soft delete)
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid supplier ID. Must be a positive number.' });
  }

  try {
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseInvoices: {
          take: 1
        }
      }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    // Check if supplier has any invoices
    if (supplier.purchaseInvoices.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete supplier with existing invoices. Consider soft delete instead.',
        hasInvoices: true 
      });
    }

    const deletedSupplier = await prisma.supplier.update({
      where: { id },
      data: { isDeleted: true }
    });
    
    res.json({ success: true, message: 'Supplier deleted successfully', supplier: deletedSupplier });
  } catch (e: any) {
    console.error('Supplier deletion error:', e);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
});

export default router;
