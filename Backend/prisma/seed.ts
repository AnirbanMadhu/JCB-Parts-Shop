import { prisma } from '../src/prisma';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Create admin user if it doesn't exist
    console.log('👤 Creating admin user...');
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@jcbparts.com' },
    });

    let adminUser;
    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      adminUser = existingAdmin;
    } else {
      const hashedPassword = await hashPassword('Admin@123');
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@jcbparts.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'ADMIN',
          isActive: true,
          mustChangePassword: false,
        },
      });
      console.log('✓ Admin user created: admin@jcbparts.com / Admin@123');
    }

    // 2. Create sample parts
    console.log('📦 Creating sample parts...');
    const sampleParts = [
      {
        partNumber: 'JCB-001',
        itemName: 'Hydraulic Cylinder',
        description: 'Main hydraulic cylinder for JCB equipment',
        hsnCode: '8409',
        gstPercent: 18,
        unit: 'Nos',
        mrp: 15000.0,
        rtl: 12000.0,
      },
      {
        partNumber: 'JCB-002',
        itemName: 'Engine Oil Filter',
        description: 'Original engine oil filter',
        hsnCode: '8409',
        gstPercent: 18,
        unit: 'Nos',
        mrp: 800.0,
        rtl: 650.0,
      },
      {
        partNumber: 'JCB-003',
        itemName: 'Air Filter',
        description: 'Engine air filter assembly',
        hsnCode: '8409',
        gstPercent: 18,
        unit: 'Nos',
        mrp: 1200.0,
        rtl: 1000.0,
      },
      {
        partNumber: 'JCB-004',
        itemName: 'Transmission Fluid',
        description: 'ATF for transmission system',
        hsnCode: '2710',
        gstPercent: 18,
        unit: 'Ltr',
        mrp: 450.0,
        rtl: 380.0,
      },
      {
        partNumber: 'JCB-005',
        itemName: 'Brake Pad Set',
        description: 'Complete brake pad set',
        hsnCode: '8708',
        gstPercent: 18,
        unit: 'Nos',
        mrp: 5000.0,
        rtl: 4000.0,
      },
      {
        partNumber: 'JCB-006',
        itemName: 'Battery',
        description: '12V automotive battery',
        hsnCode: '8507',
        gstPercent: 18,
        unit: 'Nos',
        mrp: 8000.0,
        rtl: 6500.0,
      },
      {
        partNumber: 'JCB-007',
        itemName: 'Spark Plug',
        description: 'Engine spark plugs',
        hsnCode: '8511',
        gstPercent: 18,
        unit: 'Nos',
        mrp: 250.0,
        rtl: 200.0,
      },
      {
        partNumber: 'JCB-008',
        itemName: 'Fuel Injector',
        description: 'Fuel injection system component',
        hsnCode: '8409',
        gstPercent: 18,
        unit: 'Nos',
        mrp: 3500.0,
        rtl: 2800.0,
      },
    ];

    for (const part of sampleParts) {
      const existingPart = await prisma.part.findUnique({
        where: { partNumber: part.partNumber },
      });

      if (!existingPart) {
        await prisma.part.create({ data: part });
        console.log(`✓ Created part: ${part.partNumber}`);
      } else {
        console.log(`✓ Part already exists: ${part.partNumber}`);
      }
    }

    // 3. Create sample suppliers
    console.log('🏭 Creating sample suppliers...');
    const sampleSuppliers = [
      {
        name: 'JCB Parts International',
        email: 'parts@jcbintl.com',
        contactPerson: 'Rajesh Kumar',
        phone: '+91-11-4142-1234',
        address: '123 Industrial Estate, Delhi - 110001',
        gstin: '07AABCT1234H1Z0',
        state: 'Delhi',
        stateCode: '07',
      },
      {
        name: 'Hindustan Motors Parts',
        email: 'supply@hmparts.com',
        contactPerson: 'Amit Sharma',
        phone: '+91-22-2345-6789',
        address: '456 Business Park, Mumbai - 400010',
        gstin: '27AABCU1234H1Z0',
        state: 'Maharashtra',
        stateCode: '27',
      },
      {
        name: 'Eastern Automotive Solutions',
        email: 'sales@eastparts.com',
        contactPerson: 'Priya Dutta',
        phone: '+91-33-4567-8901',
        address: '789 Tech Zone, Kolkata - 700016',
        gstin: '19AABCD1234H1Z0',
        state: 'West Bengal',
        stateCode: '19',
      },
      {
        name: 'South India Parts Trading',
        email: 'contact@siparts.com',
        contactPerson: 'Suresh Naidu',
        phone: '+91-80-9876-5432',
        address: '321 Tech Park, Bangalore - 560100',
        gstin: '29AABCP1234H1Z0',
        state: 'Karnataka',
        stateCode: '29',
      },
    ];

    for (const supplier of sampleSuppliers) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: { name: supplier.name },
      });

      if (!existingSupplier) {
        await prisma.supplier.create({ data: supplier });
        console.log(`✓ Created supplier: ${supplier.name}`);
      } else {
        console.log(`✓ Supplier already exists: ${supplier.name}`);
      }
    }

    // 4. Create sample customers
    console.log('👥 Creating sample customers...');
    const sampleCustomers = [
      {
        indexId: 'CUST-001',
        name: 'ABC Construction Ltd',
        email: 'info@abcconstruction.com',
        phone: '+91-11-5555-6666',
        address: 'Plot 100, Industrial Area, Delhi - 110001',
        gstin: '07AABCC1234H1Z0',
        state: 'Delhi',
        stateCode: '07',
      },
      {
        indexId: 'CUST-002',
        name: 'XYZ Enterprises Pvt Ltd',
        email: 'contact@xyzent.com',
        phone: '+91-22-6666-7777',
        address: 'Building A, Commerce Complex, Mumbai - 400020',
        gstin: '27AABCE1234H1Z0',
        state: 'Maharashtra',
        stateCode: '27',
      },
      {
        indexId: 'CUST-003',
        name: 'PQR Industrial Traders',
        email: 'sales@pqrind.com',
        phone: '+91-33-7777-8888',
        address: 'House 99, Business District, Kolkata - 700030',
        gstin: '19AABCF1234H1Z0',
        state: 'West Bengal',
        stateCode: '19',
      },
      {
        indexId: 'CUST-004',
        name: 'DEF Manufacturing Co',
        email: 'orders@defmfg.com',
        phone: '+91-80-8888-9999',
        address: 'Suite 500, Tech Tower, Bangalore - 560102',
        gstin: '29AABCG1234H1Z0',
        state: 'Karnataka',
        stateCode: '29',
      },
      {
        indexId: 'CUST-005',
        name: 'GHI Equipment Rentals',
        email: 'rent@ghiequip.com',
        phone: '+91-40-9999-0000',
        address: 'Plaza 200, Industrial Park, Hyderabad - 500040',
        gstin: '36AABCH1234H1Z0',
        state: 'Telangana',
        stateCode: '36',
      },
    ];

    for (const customer of sampleCustomers) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { name: customer.name },
      });

      if (!existingCustomer) {
        await prisma.customer.create({ data: customer });
        console.log(`✓ Created customer: ${customer.name}`);
      } else {
        console.log(`✓ Customer already exists: ${customer.name}`);
      }
    }

    // 5. Create sample invoices
    console.log('📄 Creating sample invoices...');

    // Get the created/existing parts, suppliers, and customers
    const parts = await prisma.part.findMany();
    const suppliers = await prisma.supplier.findMany();
    const customers = await prisma.customer.findMany();

    if (parts.length > 0 && suppliers.length > 0) {
      // Create a sample purchase invoice
      const existingPurchaseInvoice = await prisma.invoice.findFirst({
        where: { invoiceNumber: 'PUR-2026-001' },
      });

      if (!existingPurchaseInvoice && suppliers.length > 0) {
        const invoiceItems = parts.slice(0, 3).map((part, index) => ({
          partId: part.id,
          hsnCode: part.hsnCode,
          quantity: 5 + index,
          unit: part.unit,
          rate: part.rtl || 1000,
          amount: (part.rtl || 1000) * (5 + index),
        }));

        const subtotal = invoiceItems.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
        const discountAmount = subtotal * 0.05; // 5% discount
        const taxableValue = subtotal - discountAmount;
        const cgstAmount = taxableValue * 0.09;
        const sgstAmount = taxableValue * 0.09;
        const total = taxableValue + cgstAmount + sgstAmount;

        await prisma.invoice.create({
          data: {
            invoiceNumber: 'PUR-2026-001',
            type: 'PURCHASE',
            status: 'SUBMITTED',
            date: new Date('2026-04-01'),
            supplierId: suppliers[0].id,
            subtotal,
            discountPercent: 5,
            discountAmount,
            taxableValue,
            cgstPercent: 9,
            cgstAmount,
            sgstPercent: 9,
            sgstAmount,
            roundOff: 0,
            total,
            paymentStatus: 'PAID',
            paidAmount: total,
            paymentDate: new Date('2026-04-05'),
            paymentMethod: 'Bank Transfer',
            items: {
              create: invoiceItems,
            },
          },
          include: { items: true },
        });
        console.log('✓ Created sample purchase invoice: PUR-2026-001');
      }
    }

    if (parts.length > 0 && customers.length > 0) {
      // Create a sample sales invoice
      const existingSalesInvoice = await prisma.invoice.findFirst({
        where: { invoiceNumber: 'SAL-2026-001' },
      });

      if (!existingSalesInvoice && customers.length > 0) {
        const invoiceItems = parts.slice(1, 4).map((part, index) => ({
          partId: part.id,
          hsnCode: part.hsnCode,
          quantity: 3 + index,
          unit: part.unit,
          rate: part.mrp || 1500,
          amount: (part.mrp || 1500) * (3 + index),
        }));

        const subtotal = invoiceItems.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
        const discountAmount = subtotal * 0.03; // 3% discount
        const taxableValue = subtotal - discountAmount;
        const cgstAmount = taxableValue * 0.09;
        const sgstAmount = taxableValue * 0.09;
        const total = taxableValue + cgstAmount + sgstAmount;

        await prisma.invoice.create({
          data: {
            invoiceNumber: 'SAL-2026-001',
            type: 'SALE',
            status: 'SUBMITTED',
            date: new Date('2026-04-02'),
            customerId: customers[0].id,
            subtotal,
            discountPercent: 3,
            discountAmount,
            taxableValue,
            cgstPercent: 9,
            cgstAmount,
            sgstPercent: 9,
            sgstAmount,
            roundOff: 0,
            total,
            paymentStatus: 'PAID',
            paidAmount: total,
            paymentDate: new Date('2026-04-10'),
            paymentMethod: 'Cheque',
            items: {
              create: invoiceItems,
            },
          },
          include: { items: true },
        });
        console.log('✓ Created sample sales invoice: SAL-2026-001');
      }
    }

    console.log('\n✅ Database seed completed successfully!');
    console.log('\n📝 Admin Login Credentials:');
    console.log('   Email: admin@jcbparts.com');
    console.log('   Password: Admin@123');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
