const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const attendances = await prisma.attendance.findMany({
    where: { date: '2026-04-30' },
    include: { student: { select: { nis: true, user: { select: { name: true } } } } }
  });
  
  console.log(`Found ${attendances.length} records for today:`);
  for (const a of attendances) {
    console.log(`[${a.method}] ${a.student.user.name} - Status: ${a.status}, In: ${a.checkInTime}, Out: ${a.checkOutTime}`);
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
