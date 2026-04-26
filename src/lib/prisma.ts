import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Connection pooling is handled by Neon's built-in pooler (the -pooler hostname in DATABASE_URL).
// Prisma Accelerate (prisma://... URL) adds edge caching on top — enable it by swapping
// DATABASE_URL to an Accelerate URL and keeping DIRECT_URL as the raw postgres:// for migrations.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (new PrismaClient().$extends(withAccelerate()) as unknown as PrismaClient);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
