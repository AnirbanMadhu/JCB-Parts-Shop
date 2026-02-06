import { Router } from 'express';
import { prisma } from '../prisma';
import { CustomerCreateBody } from '../types';
import { cacheMiddleware, clearCachePattern } from '../middleware/cache';
// import { authenticateToken } from '../middleware/auth';

const router = Router();

// TODO: Re-enable authentication after verifying data access
// router.use(authenticateToken);

// Generate next indexId
async function generateIndexId(): Promise<string> {
  const lastCustomer = await prisma.customer.findFirst({
    orderBy: { id: 'desc' }
  });
  
  if (!lastCustomer || !lastCustomer.indexId) {
    return 'CUST-001';
  }
  
  // Extract number from last indexId (e.g., CUST-001 -> 1)
  const match = lastCustomer.indexId.match(/CUST-(\d+)/);
  const lastNum = match ? parseInt(match[1], 10) : 0;
  const nextNum = lastNum + 1;
  
  return `CUST-${String(nextNum).padStart(3, '0')}`;
}

// Create a new customer
router.post('/', async (req, res) => {
  const body = req.body as CustomerCreateBody;

  // Comprehensive validation
  if (!body.name || !body.name.trim()) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  const name = body.name.trim();
  const email = body.email?.trim();
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

  // Validate GSTIN format if provided (15 characters alphanumeric)
  if (gstin && !/^[0-9A-Z]{15}$/i.test(gstin)) {
    return res.status(400).json({ error: 'GSTIN must be 15 alphanumeric characters' });
  }

  try {
    const indexId = await generateIndexId();
    
    const customer = await prisma.customer.create({
      data: {
        indexId,
        name: name,
        email: email || null,
        address: address || null,
        phone: phone || null,
        gstin: gstin || null,
        state: state || null
      }
    });

    // Clear customer cache on create
    clearCachePattern('/api/customers');
    res.status(201).json(customer);
  } catch (e: any) {
    console.error('Customer creation error:', e);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Get all customers - Cache for 60 seconds
router.get('/', cacheMiddleware(60), async (req, res) => {
  const { search } = req.query as { search?: string };

  try {
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            isDeleted: false,
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { indexId: { contains: search, mode: 'insensitive' } },
              { gstin: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } }
            ]
          }
        : { isDeleted: false },
      orderBy: { id: 'asc' }
    });

    res.json(customers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load customers' });
  }
});

// Get single customer by ID - Cache for 60 seconds
router.get('/:id', cacheMiddleware(60), async (req, res) => {
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

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid customer ID. Must be a positive number.' });
  }

  if (!body.name || !body.name.trim()) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  const name = body.name.trim();
  const email = body.email?.trim();
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
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: name,
        email: email || null,
        address: address || null,
        phone: phone || null,
        gstin: gstin || null,
        state: state || null
      }
    });

    // Clear customer cache on update
    clearCachePattern('/api/customers');
    clearCachePattern('/api/invoices');
    res.json(customer);
  } catch (e: any) {
    console.error('Customer update error:', e);
    if (e.code === 'P2025') {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer (soft delete)
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid customer ID. Must be a positive number.' });
  }

  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        salesInvoices: {
          take: 1
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has any invoices
    if (customer.salesInvoices.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing invoices. Consider soft delete instead.',
        hasInvoices: true 
      });
    }

    const deletedCustomer = await prisma.customer.update({
      where: { id },
      data: { isDeleted: true }
    });
    
    // Clear customer cache on delete
    clearCachePattern('/api/customers');
    clearCachePattern('/api/invoices');
    res.json({ success: true, message: 'Customer deleted successfully', customer: deletedCustomer });
  } catch (e: any) {
    console.error('Customer deletion error:', e);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
