const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const prisma = new PrismaClient();

// POST /api/v1/attendance/qr/generate
const generateQR = async (req, res, next) => {
  try {
    const { classId, type = 'CHECK_IN' } = req.body;

    if (!classId) {
      return res.status(400).json({ error: 'classId harus diisi.' });
    }

    // Deactivate previous active sessions for this class and type
    await prisma.qRSession.updateMany({
      where: { classId, type, isActive: true },
      data: { isActive: false }
    });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 1000); // 30 seconds

    const session = await prisma.qRSession.create({
      data: {
        classId,
        token,
        type,
        expiresAt,
        createdBy: req.user.id,
        isActive: true
      }
    });

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
      token: session.token,
      type: session.type,
      classId: session.classId
    }), { width: 400, margin: 2 });

    res.json({
      session: {
        id: session.id,
        token: session.token,
        type: session.type,
        expiresAt: session.expiresAt,
        qrCode: qrDataUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/attendance/qr/scan
const scanQR = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'QR token harus diisi.' });
    }

    const session = await prisma.qRSession.findUnique({ where: { token } });
    if (!session || !session.isActive) {
      return res.status(400).json({ error: 'QR Code tidak valid atau sudah tidak aktif.' });
    }

    if (new Date() > session.expiresAt) {
      await prisma.qRSession.update({ where: { id: session.id }, data: { isActive: false } });
      return res.status(400).json({ error: 'QR Code sudah expired. Minta guru untuk generate ulang.' });
    }

    // Get student data
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: { class: true }
    });

    if (!student) {
      return res.status(400).json({ error: 'Data siswa tidak ditemukan.' });
    }

    // Verify class matches
    if (student.classId !== session.classId) {
      return res.status(400).json({ error: 'QR Code ini bukan untuk kelas Anda.' });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check schedule for lateness
    const dayOfWeek = now.getDay();
    const schedule = await prisma.schedule.findFirst({
      where: { classId: session.classId, dayOfWeek, isActive: true }
    });

    let existing = await prisma.attendance.findUnique({
      where: { studentId_date: { studentId: student.id, date: today } }
    });

    if (session.type === 'CHECK_IN') {
      if (existing && existing.checkInTime) {
        return res.status(400).json({ error: 'Anda sudah absen masuk hari ini.' });
      }

      let status = 'HADIR';
      if (schedule && currentTime > schedule.checkInTime) {
        status = 'TERLAMBAT';
      }

      if (existing) {
        existing = await prisma.attendance.update({
          where: { id: existing.id },
          data: { checkInTime: currentTime, status, method: 'QR' }
        });
      } else {
        existing = await prisma.attendance.create({
          data: {
            studentId: student.id,
            classId: session.classId,
            date: today,
            checkInTime: currentTime,
            status,
            method: 'QR'
          }
        });
      }

      res.json({
        message: `Absensi masuk berhasil! Status: ${status}`,
        attendance: existing
      });
    } else {
      // CHECK_OUT
      if (!existing || !existing.checkInTime) {
        return res.status(400).json({ error: 'Anda belum absen masuk hari ini.' });
      }
      if (existing.checkOutTime) {
        return res.status(400).json({ error: 'Anda sudah absen keluar hari ini.' });
      }

      existing = await prisma.attendance.update({
        where: { id: existing.id },
        data: { checkOutTime: currentTime }
      });

      res.json({
        message: 'Absensi keluar berhasil!',
        attendance: existing
      });
    }
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/attendance/manual
const manualAttendance = async (req, res, next) => {
  try {
    const { studentId, date, status, notes } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({ error: 'studentId, date, dan status harus diisi.' });
    }

    const validStatuses = ['HADIR', 'SAKIT', 'IZIN', 'ALPA', 'TERLAMBAT'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status harus salah satu dari: ${validStatuses.join(', ')}` });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const attendance = await prisma.attendance.upsert({
      where: { studentId_date: { studentId, date } },
      update: { status, notes, method: 'MANUAL', recordedById: req.user.id },
      create: {
        studentId,
        classId: student.classId,
        date,
        checkInTime: status === 'HADIR' || status === 'TERLAMBAT' ? currentTime : null,
        status,
        method: 'MANUAL',
        notes,
        recordedById: req.user.id
      }
    });

    res.json({ message: 'Absensi manual berhasil disimpan.', attendance });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/attendance/bulk
const bulkAttendance = async (req, res, next) => {
  try {
    const { classId, date, attendances } = req.body;
    // attendances: [{ studentId, status, notes }]

    if (!classId || !date || !attendances || !Array.isArray(attendances)) {
      return res.status(400).json({ error: 'classId, date, dan attendances array harus diisi.' });
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const results = [];
    for (const att of attendances) {
      const record = await prisma.attendance.upsert({
        where: { studentId_date: { studentId: att.studentId, date } },
        update: {
          status: att.status,
          notes: att.notes || null,
          method: 'MANUAL',
          recordedById: req.user.id
        },
        create: {
          studentId: att.studentId,
          classId,
          date,
          checkInTime: att.status === 'HADIR' || att.status === 'TERLAMBAT' ? currentTime : null,
          status: att.status,
          method: 'MANUAL',
          notes: att.notes || null,
          recordedById: req.user.id
        }
      });
      results.push(record);
    }

    res.json({ message: `${results.length} absensi berhasil disimpan.`, attendances: results });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/attendance/today?classId=
const getToday = async (req, res, next) => {
  try {
    const { classId } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const where = { date: today };
    if (classId) where.classId = classId;

    // If student, only show own attendance
    if (req.user.role === 'SISWA') {
      const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (student) where.studentId = student.id;
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ date: today, attendances });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/attendance/history/:studentId
const getHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    const where = { studentId };
    if (month && year) {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
      const endYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year);
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
      where.date = { gte: startDate, lt: endDate };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 90
    });

    res.json({ attendances });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateQR, scanQR, manualAttendance, bulkAttendance, getToday, getHistory };
