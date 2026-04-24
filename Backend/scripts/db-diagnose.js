require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function maskDbUrl(url) {
  if (!url) return '';
  return url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}

async function main() {
  const dbUrl = process.env.DATABASE_URL || '';
  console.log('DATABASE_URL(masked):', maskDbUrl(dbUrl));
  console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'undefined');

  const dbIdentity = await prisma.$queryRawUnsafe(
    'SELECT current_database() AS database, current_user AS user, inet_server_addr()::text AS server_ip, inet_server_port() AS server_port'
  );
  console.log('DB identity:', dbIdentity[0]);

  const [
    users,
    customers,
    suppliers,
    parts,
    invoices,
    invoiceItems,
    inventoryTransactions,
    softDeletedCustomers,
    softDeletedSuppliers,
    softDeletedParts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.part.count(),
    prisma.invoice.count(),
    prisma.invoiceItem.count(),
    prisma.inventoryTransaction.count(),
    prisma.customer.count({ where: { isDeleted: true } }),
    prisma.supplier.count({ where: { isDeleted: true } }),
    prisma.part.count({ where: { isDeleted: true } }),
  ]);

  console.log('Counts:', {
    users,
    customers,
    suppliers,
    parts,
    invoices,
    invoiceItems,
    inventoryTransactions,
    softDeletedCustomers,
    softDeletedSuppliers,
    softDeletedParts,
  });

  const latestInvoices = await prisma.invoice.findMany({
    select: { id: true, invoiceNumber: true, type: true, status: true, date: true, total: true },
    orderBy: { date: 'desc' },
    take: 5,
  });
  console.log('Latest invoices:', latestInvoices);
}

main()
  .catch((err) => {
    console.error('db-diagnose failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
