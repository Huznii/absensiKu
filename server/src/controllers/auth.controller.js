const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Akun Anda telah dinonaktifkan.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email atau password salah.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Get role-specific data
    let roleData = null;
    if (user.role === 'SISWA') {
      roleData = await prisma.student.findUnique({
        where: { userId: user.id },
        include: { class: true }
      });
    } else if (user.role === 'GURU') {
      roleData = await prisma.teacher.findUnique({
        where: { userId: user.id },
        include: { homeroomClass: true }
      });
    } else if (user.role === 'ORANG_TUA') {
      roleData = await prisma.parent.findUnique({
        where: { userId: user.id },
        include: { children: { include: { user: { select: { name: true } }, class: true } } }
      });
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        roleData
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true, phone: true, isActive: true }
    });

    let roleData = null;
    if (user.role === 'SISWA') {
      roleData = await prisma.student.findUnique({
        where: { userId: user.id },
        include: { class: true }
      });
    } else if (user.role === 'GURU') {
      roleData = await prisma.teacher.findUnique({
        where: { userId: user.id },
        include: { homeroomClass: true }
      });
    } else if (user.role === 'ORANG_TUA') {
      roleData = await prisma.parent.findUnique({
        where: { userId: user.id },
        include: { children: { include: { user: { select: { name: true } }, class: true } } }
      });
    }

    res.json({ user: { ...user, roleData } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password lama salah.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password berhasil diubah.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/reset-password (Admin only)
const resetPassword = async (req, res, next) => {
  try {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'userId dan newPassword harus diisi.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: `Password untuk ${targetUser.name} berhasil direset.` });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, changePassword, resetPassword };
