require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@gym.com' },
    update: {},
    create: { name: 'Admin', email: 'admin@gym.com', passwordHash, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'reception@gym.com' },
    update: {},
    create: { name: 'Receptionist', email: 'reception@gym.com', passwordHash, role: 'RECEPTIONIST' },
  });

  const monthly = await prisma.membershipPlan.create({
    data: { name: 'Monthly', durationDays: 30, price: 1000 },
  });
  const yearly = await prisma.membershipPlan.create({
    data: { name: 'Yearly', durationDays: 365, price: 10000 },
  });

  console.log('Seeded. Plan IDs:');
  console.log('Monthly:', monthly.id);
  console.log('Yearly :', yearly.id);
}

main().finally(() => prisma.$disconnect());