/**
 * One-shot backfill: set transactionType=B2B and deliveryAddress=null on all
 * existing invoices that were created before this field was introduced.
 * Run once: npx ts-node scripts/backfill-transaction-type.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.invoice.updateMany({
    where: { transactionType: undefined as any },
    data: { transactionType: 'B2B' },
  });
  console.log(`Backfilled ${result.count} invoices with transactionType=B2B`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
