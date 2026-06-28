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

const CHECK_IN_POINTS = [
  { day: 'DAY-1', pointsAdded: 1 },
  { day: 'DAY-2', pointsAdded: 2 },
  { day: 'DAY-3', pointsAdded: 3 },
  { day: 'DAY-4', pointsAdded: 5 },
  { day: 'DAY-5', pointsAdded: 8 },
  { day: 'DAY-6', pointsAdded: 13 },
  { day: 'DAY-7', pointsAdded: 21 },
];

async function main() {
  console.log('Seeding check-in points...');
  await prisma.checkInPoint.createMany({ data: CHECK_IN_POINTS });
  console.log(`  ✓ ${CHECK_IN_POINTS.length} check-in points`);

  console.log('Seeding users...');
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
