process.env.DATABASE_URL = "postgresql://postgres.ngawamxytyqvtasunwkp:25693525aziz@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require&sslrootcert=./prisma/prod-ca-2021.crt";
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@sakany.tn' } });
  console.log('Current user role in DB:', user?.role);
  if (user && user.role !== 'ADMIN') {
    await prisma.user.update({
      where: { email: 'admin@sakany.tn' },
      data: { role: 'ADMIN' }
    });
    console.log('Updated to ADMIN');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
