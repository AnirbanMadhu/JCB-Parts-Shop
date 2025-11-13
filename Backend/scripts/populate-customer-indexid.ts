import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Populating customer indexId...');
  
  const customers = await prisma.customer.findMany({
    orderBy: { id: 'asc' }
  });

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    if (!customer.indexId) {
      const indexId = `CUST-${String(i + 1).padStart(3, '0')}`;
      await prisma.customer.update({
        where: { id: customer.id },
        data: { indexId }
      });
      console.log(`Updated customer ${customer.id} with indexId: ${indexId}`);
    }
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
