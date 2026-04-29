const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (search) {
      where.OR = [
        { nip: { contains: search } },
        { user: { name: { contains: search } } }
      ];
    }
    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
          homeroomClass: { select: { id: true, name: true, grade: true, major: true } }
        },
        skip, take: parseInt(limit), orderBy: { nip: 'asc' }
      }),
      prisma.teacher.count({ where })
    ]);
    res.json({ teachers, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, phone: true, isActive: true } }, homeroomClass: true }
    });
    if (!teacher) return res.status(404).json({ error: 'Guru tidak ditemukan.' });
    res.json({ teacher });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { nip, name, email, password, phone, homeroomClassId } = req.body;
    if (!nip || !name || !email || !password) return res.status(400).json({ error: 'NIP, nama, email, dan password harus diisi.' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, password: hashedPassword, name, phone, role: 'GURU' } });
      return tx.teacher.create({
        data: { nip, userId: user.id, homeroomClassId: homeroomClassId || null },
        include: { user: { select: { id: true, name: true, email: true } }, homeroomClass: true }
      });
    });
    res.status(201).json({ message: 'Guru berhasil ditambahkan.', teacher: result });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { nip, name, email, phone, homeroomClassId, isActive } = req.body;
    const teacher = await prisma.teacher.findUnique({ where: { id: req.params.id } });
    if (!teacher) return res.status(404).json({ error: 'Guru tidak ditemukan.' });
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: teacher.userId }, data: { ...(name && { name }), ...(email && { email }), ...(phone !== undefined && { phone }), ...(isActive !== undefined && { isActive }) } });
      return tx.teacher.update({ where: { id: req.params.id }, data: { ...(nip && { nip }), ...(homeroomClassId !== undefined && { homeroomClassId: homeroomClassId || null }) }, include: { user: { select: { id: true, name: true, email: true, phone: true, isActive: true } }, homeroomClass: true } });
    });
    res.json({ message: 'Data guru berhasil diperbarui.', teacher: result });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: req.params.id } });
    if (!teacher) return res.status(404).json({ error: 'Guru tidak ditemukan.' });
    await prisma.user.delete({ where: { id: teacher.userId } });
    res.json({ message: 'Guru berhasil dihapus.' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
