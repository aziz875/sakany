import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL;

// In test environments (vitest), prisma is mocked — skip initialization.
// In all other environments, DATABASE_URL is required.
if (!connectionString && process.env.NODE_ENV !== 'test') {
  throw new Error('DATABASE_URL is not set.');
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  (connectionString
    ? new PrismaClient({
        adapter: new PrismaPg({ connectionString }),
      })
    : (new Proxy({} as PrismaClient, {
        get() {
          throw new Error('Prisma is not initialized. DATABASE_URL must be set.');
        },
      }) as PrismaClient));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
