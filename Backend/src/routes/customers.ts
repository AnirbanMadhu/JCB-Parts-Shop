import { Router } from 'express';
import { prisma } from '../prisma';
import { CustomerCreateBody } from '../types';

const router = Router();

// Create a new customer
router.post('/', async (req, res) => {
  const body = req.body as CustomerCreateBody;

  if (!body.name) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        gstin: body.gstin,
        state: body.state
      }
    });

    res.status(201).json(customer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get all customers
router.get('/', async (req, res) => {
  const { search } = req.query as { search?: string };

  try {
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { gstin: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } }
            ]
          }
        : undefined,
      orderBy: { name: 'asc' }
    });

    res.json(customers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

// Get single customer by ID
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid customer ID. Must be a number.' });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        salesInvoices: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load customer' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const body = req.body as CustomerCreateBody;

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid customer ID. Must be a number.' });
  }

  if (!body.name) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        address: body.address,
        phone: body.phone,
        gstin: body.gstin,
        state: body.state
      }
    });

    res.json(customer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid customer ID. Must be a number.' });
  }

  try {
    await prisma.customer.delete({ where: { id } });
    res.json({ success: true, message: 'Customer deleted' });
  } catch (e: any) {
    console.error(e);
    if (e.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing invoices' 
      });
    }
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
