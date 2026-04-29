const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/v1/students
const getAll = async (req, res, next) => {
  try {
    const { search, classId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (classId) where.classId = classId;
    if (search) {
      where.OR = [
        { nis: { contains: search } },
        { user: { name: { contains: search } } }
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
          class: { select: { id: true, name: true, grade: true, major: true } },
          parent: { include: { user: { select: { name: true, phone: true, email: true } } } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { nis: 'asc' }
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/students/:id
const getById = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
        class: true,
        parent: { include: { user: { select: { name: true, phone: true, email: true } } } }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
    }

    res.json({ student });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/students
const create = async (req, res, next) => {
  try {
    const { nis, name, email, password, phone, classId, address, parentEmail } = req.body;

    if (!nis || !name || !email || !password) {
      return res.status(400).json({ error: 'NIS, nama, email, dan password harus diisi.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, password: hashedPassword, name, phone, role: 'SISWA' }
      });

      let parentId = null;
      if (parentEmail) {
        const parentUser = await tx.user.findUnique({ where: { email: parentEmail } });
        if (parentUser) {
          const parent = await tx.parent.findUnique({ where: { userId: parentUser.id } });
          if (parent) parentId = parent.id;
        }
      }

      const student = await tx.student.create({
        data: { nis, userId: user.id, classId: classId || null, parentId, address },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          class: true
        }
      });

      return student;
    });

    res.status(201).json({ message: 'Siswa berhasil ditambahkan.', student: result });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/students/:id
const update = async (req, res, next) => {
  try {
    const { nis, name, email, phone, classId, address, isActive } = req.body;

    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      if (name || email || phone || isActive !== undefined) {
        await tx.user.update({
          where: { id: student.userId },
          data: {
            ...(name && { name }),
            ...(email && { email }),
            ...(phone !== undefined && { phone }),
            ...(isActive !== undefined && { isActive })
          }
        });
      }

      const newClassId = classId !== undefined ? (classId || null) : undefined;

      const updated = await tx.student.update({
        where: { id: req.params.id },
        data: {
          ...(nis && { nis }),
          ...(newClassId !== undefined && { classId: newClassId }),
          ...(address !== undefined && { address })
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
          class: true
        }
      });

      // When class is changed, update classId on attendance records from today onwards
      // so that reports reflect the student's current class
      if (newClassId !== undefined && newClassId !== student.classId) {
        const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
        await tx.attendance.updateMany({
          where: {
            studentId: req.params.id,
            date: { gte: today }
          },
          data: { classId: newClassId }
        });
      }

      return updated;
    });

    res.json({ message: 'Data siswa berhasil diperbarui.', student: result });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/students/:id
const remove = async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({ where: { id: req.params.id } });
    if (!student) {
      return res.status(404).json({ error: 'Siswa tidak ditemukan.' });
    }

    await prisma.user.delete({ where: { id: student.userId } });
    res.json({ message: 'Siswa berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
