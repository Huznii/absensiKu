const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const classId = '46dc5b5b-d1e6-4032-a120-a27accf1e2e9';
  const dayOfWeek = new Date(Date.now() + 7 * 3600000).getUTCDay();
  console.log('Calculated dayOfWeek:', dayOfWeek);
  
  const schedule = await prisma.schedule.findFirst({
    where: { classId, dayOfWeek, isActive: true }
  });
  console.log('Schedule found:', schedule);
}

test().catch(console.error).finally(() => prisma.$disconnect());
