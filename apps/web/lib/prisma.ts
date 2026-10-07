import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  pool: Pool;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== 'test') {
  throw new Error('DATABASE_URL is not set.');
}

function getPool(): Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool;
  }

  const pool = new Pool({
    connectionString,
    // In development mode, limit pool max connections to 5 so we don't saturate Supabase's 15-connection limit across Next.js HMR reloads
    max: process.env.NODE_ENV === 'production' ? 15 : 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 20000,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool;
  }

  return pool;
}

function createPrismaClient(): PrismaClient {
  if (!connectionString) {
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error('Prisma is not initialized. DATABASE_URL must be set.');
      },
    }) as PrismaClient;
  }

  const pool = getPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
