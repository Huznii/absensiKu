const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const attendances = await prisma.attendance.findMany({
    where: { date: '2026-04-30' }
  });
  
  let count = 0;
  for (const att of attendances) {
    if (att.checkInTime && (att.checkInTime.startsWith('00:') || att.checkInTime.startsWith('01:'))) {
      const parts = att.checkInTime.split(':');
      let hour = parseInt(parts[0], 10);
      hour += 7; // shift 7 hours
      const newTime = `${String(hour).padStart(2, '0')}:${parts[1]}`;
      await prisma.attendance.update({
        where: { id: att.id },
        data: { checkInTime: newTime }
      });
      count++;
    }
  }
  console.log(`Fixed ${count} records.`);
}

fix().catch(console.error).finally(() => prisma.$disconnect());
