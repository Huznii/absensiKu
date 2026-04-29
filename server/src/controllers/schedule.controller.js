const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res, next) => {
  try {
    const { classId } = req.query;
    const where = {};
    if (classId) where.classId = classId;
    const schedules = await prisma.schedule.findMany({ where, include: { class: { select: { name: true, grade: true } } }, orderBy: [{ classId: 'asc' }, { dayOfWeek: 'asc' }] });
    res.json({ schedules });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { classId, dayOfWeek, checkInTime, checkOutTime } = req.body;
    if (!classId || dayOfWeek === undefined || !checkInTime || !checkOutTime) return res.status(400).json({ error: 'Semua field harus diisi.' });
    const schedule = await prisma.schedule.create({ data: { classId, dayOfWeek: parseInt(dayOfWeek), checkInTime, checkOutTime } });
    res.status(201).json({ message: 'Jadwal berhasil ditambahkan.', schedule });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { dayOfWeek, checkInTime, checkOutTime, isActive } = req.body;
    const schedule = await prisma.schedule.update({
      where: { id: req.params.id },
      data: { ...(dayOfWeek !== undefined && { dayOfWeek: parseInt(dayOfWeek) }), ...(checkInTime && { checkInTime }), ...(checkOutTime && { checkOutTime }), ...(isActive !== undefined && { isActive }) }
    });
    res.json({ message: 'Jadwal berhasil diperbarui.', schedule });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.schedule.delete({ where: { id: req.params.id } });
    res.json({ message: 'Jadwal berhasil dihapus.' });
  } catch (error) { next(error); }
};

module.exports = { getAll, create, update, remove };
