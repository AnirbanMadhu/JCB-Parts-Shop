const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env'),
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  dotenv.config({ path: envPath });
  console.log(`[DB DEBUG] Loaded env from: ${envPath}`);
} else {
  console.log('[DB DEBUG] No .env file found in default locations. Using process environment only.');
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rawUrl = process.env.DATABASE_URL || '';
    const maskedUrl = rawUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
    console.log(`[DB DEBUG] DATABASE_URL: ${maskedUrl}`);

    const dbInfo = await prisma.$queryRaw`
      SELECT current_database()::text as db_name, current_user::text as db_user
    `;

    const [users, customers, suppliers, parts, invoices, invoiceItems, inventoryTransactions] = await Promise.all([
      prisma.user.count(),
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.part.count(),
      prisma.invoice.count(),
      prisma.invoiceItem.count(),
      prisma.inventoryTransaction.count(),
    ]);

    console.log(JSON.stringify({
      database: dbInfo[0] || null,
      counts: {
        users,
        customers,
        suppliers,
        parts,
        invoices,
        invoiceItems,
        inventoryTransactions,
      },
    }, null, 2));
  } catch (error) {
    console.error('DB_DEBUG_CHECK_ERROR:', error?.message || error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
