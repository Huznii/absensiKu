const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schedules = await prisma.schedule.findMany();
  console.log('All Schedules:', schedules);
  
  const todayUTC = new Date().getDay();
  console.log('Today (UTC dayOfWeek):', todayUTC);

  const localTime = new Date(Date.now() + 7 * 3600000);
  const todayLocal = localTime.getDay();
  console.log('Today (GMT+7 dayOfWeek):', todayLocal);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
