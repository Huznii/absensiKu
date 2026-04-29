const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getChildren = async (req, res, next) => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { userId: req.user.id },
      include: { children: { include: { user: { select: { name: true, email: true } }, class: true } } }
    });
    if (!parent) return res.status(404).json({ error: 'Data orang tua tidak ditemukan.' });
    res.json({ children: parent.children });
  } catch (error) { next(error); }
};

const getChildAttendance = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const parent = await prisma.parent.findUnique({ where: { userId: req.user.id }, include: { children: true } });
    if (!parent) return res.status(404).json({ error: 'Data orang tua tidak ditemukan.' });
    const isMyChild = parent.children.some(c => c.id === childId);
    if (!isMyChild) return res.status(403).json({ error: 'Anda tidak memiliki akses untuk siswa ini.' });

    const attendances = await prisma.attendance.findMany({ where: { studentId: childId }, orderBy: { date: 'desc' }, take: 60 });
    const summary = { hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0 };
    attendances.forEach(a => { summary[a.status.toLowerCase()]++; });
    res.json({ summary, attendances });
  } catch (error) { next(error); }
};

module.exports = { getChildren, getChildAttendance };
