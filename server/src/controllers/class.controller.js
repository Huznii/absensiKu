const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res, next) => {
  try {
    const { academicYear, isActive } = req.query;
    const where = {};
    if (academicYear) where.academicYear = academicYear;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    const classes = await prisma.class.findMany({
      where, include: { _count: { select: { students: true } }, homeroomTeacher: { include: { user: { select: { name: true } } } } }, orderBy: [{ grade: 'asc' }, { name: 'asc' }]
    });
    res.json({ classes });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: { students: { include: { user: { select: { name: true, email: true } } } }, homeroomTeacher: { include: { user: { select: { name: true } } } }, schedules: true, _count: { select: { students: true } } }
    });
    if (!cls) return res.status(404).json({ error: 'Kelas tidak ditemukan.' });
    res.json({ class: cls });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { name, grade, major, academicYear } = req.body;
    if (!name || !grade || !academicYear) return res.status(400).json({ error: 'Nama, grade, dan tahun ajaran harus diisi.' });
    const cls = await prisma.class.create({ data: { name, grade, major: major || null, academicYear } });
    res.status(201).json({ message: 'Kelas berhasil ditambahkan.', class: cls });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { name, grade, major, academicYear, isActive } = req.body;
    const cls = await prisma.class.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(grade && { grade }), ...(major !== undefined && { major }), ...(academicYear && { academicYear }), ...(isActive !== undefined && { isActive }) }
    });
    res.json({ message: 'Kelas berhasil diperbarui.', class: cls });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.class.delete({ where: { id: req.params.id } });
    res.json({ message: 'Kelas berhasil dihapus.' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
