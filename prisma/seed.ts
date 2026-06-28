import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const USERS = [
  'Alice Johnson',
  'Bob Smith',
  'Carlos Garcia',
  'Diana Lee',
  'Ethan Brown',
  'Fiona Davis',
  'George Wilson',
  'Hannah Martinez',
  'Ivan Chen',
  'Julia Kim',
];

async function main() {
  console.log('Seeding users...');
  await prisma.user.deleteMany();
  await prisma.user.createMany({ data: USERS.map((name) => ({ name })) });
  console.log(`  ✓ ${USERS.length} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
