const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/v1/reports/daily?date=&classId=
const daily = async (req, res, next) => {
  try {
    const { date, classId } = req.query;
    const targetDate = date || new Date(Date.now() + 7 * 3600000).toISOString().split('T')[0];
    const where = { date: targetDate };
    // Filter by the student's current class, not the snapshot classId on the attendance record
    if (classId) where.student = { classId };

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { id: true, name: true, grade: true } }
          }
        },
        class: { select: { name: true, grade: true } }
      },
      orderBy: [{ student: { nis: 'asc' } }]
    });

    // Map attendances to include the student's current class info
    const mappedAttendances = attendances.map(a => ({
      ...a,
      // Override class info with the student's current class
      class: a.student?.class || a.class
    }));

    const summary = { total: mappedAttendances.length, hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0 };
    mappedAttendances.forEach(a => {
      const key = a.status.toLowerCase();
      if (summary[key] !== undefined) summary[key]++;
    });

    res.json({ date: targetDate, summary, attendances: mappedAttendances });
  } catch (error) { next(error); }
};

// GET /api/v1/reports/monthly?month=&year=&classId=
const monthly = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month || (now.getMonth() + 1));
    const year = parseInt(req.query.year || now.getFullYear());
    const { classId } = req.query;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const where = { date: { gte: startDate, lt: endDate } };
    // Filter by the student's current class, not the snapshot classId on the attendance record
    if (classId) where.student = { classId };

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: { select: { id: true, name: true, grade: true } }
          }
        }
      },
      orderBy: [{ date: 'asc' }]
    });

    // Group by student
    const byStudent = {};
    attendances.forEach(a => {
      if (!byStudent[a.studentId]) {
        byStudent[a.studentId] = {
          name: a.student.user.name,
          className: a.student.class?.name || '-',
          hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0, total: 0
        };
      }
      byStudent[a.studentId][a.status.toLowerCase()]++;
      byStudent[a.studentId].total++;
    });

    // Group by date for chart
    const byDate = {};
    attendances.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = { hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0 };
      byDate[a.date][a.status.toLowerCase()]++;
    });

    res.json({ month, year, byStudent: Object.values(byStudent), byDate, totalRecords: attendances.length });
  } catch (error) { next(error); }
};

// GET /api/v1/reports/student/:id
const studentReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } }, class: true }
    });
    if (!student) return res.status(404).json({ error: 'Siswa tidak ditemukan.' });

    const attendances = await prisma.attendance.findMany({
      where: { studentId: id },
      orderBy: { date: 'desc' },
      take: 120
    });

    const summary = { hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0 };
    attendances.forEach(a => { summary[a.status.toLowerCase()]++; });

    res.json({ student, summary, total: attendances.length, attendances });
  } catch (error) { next(error); }
};

// GET /api/v1/reports/dashboard
const dashboard = async (req, res, next) => {
  try {
    const today = new Date(Date.now() + 7 * 3600000).toISOString().split('T')[0];
    const userRole = req.user.role;

    // For GURU: scope to homeroom class only
    let homeroomClassId = null;
    let classInfo = null;
    if (userRole === 'GURU') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId: req.user.id },
        include: { homeroomClass: true }
      });
      if (teacher?.homeroomClassId) {
        homeroomClassId = teacher.homeroomClassId;
        classInfo = teacher.homeroomClass;
      }
    }

    // Filter by the student's current class, not the snapshot classId on the attendance record
    const classFilter = homeroomClassId ? { student: { classId: homeroomClassId } } : {};

    const [totalStudents, totalTeachers, totalClasses, todayAttendances] = await Promise.all([
      homeroomClassId
        ? prisma.student.count({ where: { classId: homeroomClassId } })
        : prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count({ where: { isActive: true } }),
      prisma.attendance.findMany({
        where: { date: today, ...classFilter },
        include: homeroomClassId
          ? { student: { include: { user: { select: { name: true } } } } }
          : undefined
      })
    ]);

    const todaySummary = { hadir: 0, sakit: 0, izin: 0, alpa: 0, terlambat: 0 };
    todayAttendances.forEach(a => { todaySummary[a.status.toLowerCase()]++; });

    // Last 7 days trend
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(new Date(d.getTime() + 7 * 3600000).toISOString().split('T')[0]);
    }
    const weekAttendances = await prisma.attendance.findMany({
      where: { date: { in: days }, ...classFilter }
    });

    const weeklyTrend = days.map(date => {
      const dayData = weekAttendances.filter(a => a.date === date);
      return {
        date,
        hadir: dayData.filter(a => a.status === 'HADIR').length,
        terlambat: dayData.filter(a => a.status === 'TERLAMBAT').length,
        izin: dayData.filter(a => a.status === 'IZIN').length,
        sakit: dayData.filter(a => a.status === 'SAKIT').length,
        alpa: dayData.filter(a => a.status === 'ALPA').length
      };
    });

    // For GURU: include today's student attendance list
    let todayStudents = null;
    if (homeroomClassId) {
      const allStudents = await prisma.student.findMany({
        where: { classId: homeroomClassId },
        include: { user: { select: { name: true } } },
        orderBy: { nis: 'asc' }
      });
      todayStudents = allStudents.map(s => {
        const att = todayAttendances.find(a => a.studentId === s.id);
        return {
          id: s.id,
          nis: s.nis,
          name: s.user.name,
          status: att?.status || 'BELUM',
          checkInTime: att?.checkInTime || null,
          checkOutTime: att?.checkOutTime || null
        };
      });
    }

    res.json({
      totalStudents,
      totalTeachers,
      totalClasses,
      today: { date: today, ...todaySummary, total: todayAttendances.length },
      weeklyTrend,
      classInfo,
      todayStudents
    });
  } catch (error) { next(error); }
};

module.exports = { daily, monthly, studentReport, dashboard };
