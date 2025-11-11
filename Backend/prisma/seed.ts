import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample suppliers
  const supplier1 = await prisma.supplier.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'JCB Parts India Ltd',
      address: 'Sector 5, Salt Lake, Kolkata - 700091, West Bengal',
      phone: '+91-9876543210',
      gstin: '19AABCU9603R1ZM',
      state: 'West Bengal'
    }
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Hydraulic Solutions Pvt Ltd',
      address: 'Industrial Area, Durgapur - 713204, West Bengal',
      phone: '+91-9123456789',
      gstin: '19BBCDE1234F1ZX',
      state: 'West Bengal'
    }
  });

  console.log('✅ Created suppliers:', supplier1.name, supplier2.name);

  // Create sample customers
  const customer1 = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'ABC Construction Ltd',
      address: 'Park Street, Kolkata - 700016, West Bengal',
      phone: '+91-8765432109',
      gstin: '19FGHIJ5678K1ZY',
      state: 'West Bengal'
    }
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'XYZ Earthmovers',
      address: 'NH6, Howrah - 711101, West Bengal',
      phone: '+91-7654321098',
      gstin: '19LMNOP9012Q1ZZ',
      state: 'West Bengal'
    }
  });

  console.log('✅ Created customers:', customer1.name, customer2.name);

  // Create sample parts
  const parts = [
    {
      partNumber: 'JCB-HF-001',
      itemName: 'Hydraulic Filter',
      description: 'High pressure hydraulic oil filter',
      hsnCode: '84212190',
      gstPercent: 18,
      unit: 'PCS',
      mrp: 2500,
      rtl: 2200,
      barcode: '8901234567890'
    },
    {
      partNumber: 'JCB-AF-002',
      itemName: 'Air Filter',
      description: 'Heavy duty air filter for excavators',
      hsnCode: '84213990',
      gstPercent: 18,
      unit: 'PCS',
      mrp: 1800,
      rtl: 1600
    },
    {
      partNumber: 'JCB-OF-003',
      itemName: 'Oil Filter',
      description: 'Engine oil filter',
      hsnCode: '84212190',
      gstPercent: 18,
      unit: 'PCS',
      mrp: 1200,
      rtl: 1000
    },
    {
      partNumber: 'JCB-BP-004',
      itemName: 'Brake Pad Set',
      description: 'Front brake pad set',
      hsnCode: '87083010',
      gstPercent: 28,
      unit: 'SET',
      mrp: 5500,
      rtl: 5000
    },
    {
      partNumber: 'JCB-EO-005',
      itemName: 'Engine Oil 15W-40',
      description: 'Premium quality engine oil 5L',
      hsnCode: '27101980',
      gstPercent: 18,
      unit: 'LTR',
      mrp: 3500,
      rtl: 3200
    }
  ];

  for (const partData of parts) {
    await prisma.part.upsert({
      where: { partNumber: partData.partNumber },
      update: partData,
      create: partData
    });
  }

  console.log('✅ Created', parts.length, 'parts');

  // Create a sample purchase invoice
  const part1 = await prisma.part.findUnique({ where: { partNumber: 'JCB-HF-001' } });
  const part2 = await prisma.part.findUnique({ where: { partNumber: 'JCB-AF-002' } });

  if (part1 && part2) {
    const purchaseInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'PUR-2025-001',
        date: new Date('2025-11-01'),
        type: 'PURCHASE',
        supplierId: supplier1.id,
        subtotal: 40000,
        discountPercent: 5,
        discountAmount: 2000,
        taxableValue: 38000,
        cgstPercent: 9,
        cgstAmount: 3420,
        sgstPercent: 9,
        sgstAmount: 3420,
        roundOff: 0,
        total: 44840,
        items: {
          create: [
            {
              partId: part1.id,
              hsnCode: part1.hsnCode,
              quantity: 20,
              unit: part1.unit,
              rate: 2000,
              amount: 40000
            }
          ]
        }
      }
    });

    // Create inventory transaction for purchase
    await prisma.inventoryTransaction.create({
      data: {
        partId: part1.id,
        invoiceItemId: (await prisma.invoiceItem.findFirst({ where: { invoiceId: purchaseInvoice.id } }))!.id,
        direction: 'IN',
        quantity: 20
      }
    });

    console.log('✅ Created purchase invoice:', purchaseInvoice.invoiceNumber);

    // Create a sample sales invoice
    const salesInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'SAL-2025-001',
        date: new Date('2025-11-05'),
        type: 'SALE',
        customerId: customer1.id,
        subtotal: 11000,
        discountPercent: 0,
        discountAmount: 0,
        taxableValue: 11000,
        cgstPercent: 9,
        cgstAmount: 990,
        sgstPercent: 9,
        sgstAmount: 990,
        roundOff: 0,
        total: 12980,
        items: {
          create: [
            {
              partId: part1.id,
              hsnCode: part1.hsnCode,
              quantity: 5,
              unit: part1.unit,
              rate: 2200,
              amount: 11000
            }
          ]
        }
      }
    });

    // Create inventory transaction for sale
    await prisma.inventoryTransaction.create({
      data: {
        partId: part1.id,
        invoiceItemId: (await prisma.invoiceItem.findFirst({ where: { invoiceId: salesInvoice.id } }))!.id,
        direction: 'OUT',
        quantity: 5
      }
    });

    console.log('✅ Created sales invoice:', salesInvoice.invoiceNumber);
  }

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
