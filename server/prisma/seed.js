const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.attendance.deleteMany();
  await prisma.qRSession.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw) => bcrypt.hashSync(pw, 12);

  // Create Admin
  const adminUser = await prisma.user.create({
    data: { email: 'admin@sekolah.id', password: hash('admin123'), name: 'Administrator', role: 'ADMIN', phone: '081200000001' }
  });

  // Create Kepala Sekolah
  const kepsekUser = await prisma.user.create({
    data: { email: 'kepsek@sekolah.id', password: hash('kepsek123'), name: 'Dr. Suharto, M.Pd', role: 'KEPALA_SEKOLAH', phone: '081200000002' }
  });

  // Create Classes
  const classes = await Promise.all([
    prisma.class.create({ data: { name: 'X IPA 1', grade: 'X', major: 'IPA', academicYear: '2025/2026' } }),
    prisma.class.create({ data: { name: 'X IPA 2', grade: 'X', major: 'IPA', academicYear: '2025/2026' } }),
    prisma.class.create({ data: { name: 'X IPS 1', grade: 'X', major: 'IPS', academicYear: '2025/2026' } }),
    prisma.class.create({ data: { name: 'XI IPA 1', grade: 'XI', major: 'IPA', academicYear: '2025/2026' } }),
    prisma.class.create({ data: { name: 'XII IPA 1', grade: 'XII', major: 'IPA', academicYear: '2025/2026' } }),
  ]);

  // Create Schedules for each class (Mon-Fri)
  for (const cls of classes) {
    for (let day = 1; day <= 5; day++) {
      await prisma.schedule.create({
        data: { classId: cls.id, dayOfWeek: day, checkInTime: '07:00', checkOutTime: '14:00' }
      });
    }
  }

  // Create Teachers
  const guruUsers = await Promise.all([
    prisma.user.create({ data: { email: 'guru@sekolah.id', password: hash('guru123'), name: 'Ibu Sari Dewi, S.Pd', role: 'GURU', phone: '081300000001' } }),
    prisma.user.create({ data: { email: 'guru2@sekolah.id', password: hash('guru123'), name: 'Bapak Ahmad Fauzi, M.Pd', role: 'GURU', phone: '081300000002' } }),
    prisma.user.create({ data: { email: 'guru3@sekolah.id', password: hash('guru123'), name: 'Ibu Ratna Sari, S.Pd', role: 'GURU', phone: '081300000003' } }),
  ]);

  await Promise.all([
    prisma.teacher.create({ data: { nip: '198501012010011001', userId: guruUsers[0].id, homeroomClassId: classes[0].id } }),
    prisma.teacher.create({ data: { nip: '198601012011011002', userId: guruUsers[1].id, homeroomClassId: classes[1].id } }),
    prisma.teacher.create({ data: { nip: '198701012012011003', userId: guruUsers[2].id, homeroomClassId: classes[2].id } }),
  ]);

  // Create Parents
  const parentUsers = await Promise.all([
    prisma.user.create({ data: { email: 'ortu@sekolah.id', password: hash('ortu123'), name: 'Bapak Widodo', role: 'ORANG_TUA', phone: '081400000001' } }),
    prisma.user.create({ data: { email: 'ortu2@sekolah.id', password: hash('ortu123'), name: 'Ibu Sumiati', role: 'ORANG_TUA', phone: '081400000002' } }),
  ]);

  const parents = await Promise.all([
    prisma.parent.create({ data: { userId: parentUsers[0].id } }),
    prisma.parent.create({ data: { userId: parentUsers[1].id } }),
  ]);

  // Create Students (15 students)
  const studentNames = [
    'Andi Pratama', 'Budi Santoso', 'Citra Dewi', 'Dian Permata', 'Eka Saputra',
    'Fitri Handayani', 'Galih Ramadhan', 'Hana Safira', 'Irfan Maulana', 'Jasmine Putri',
    'Kemal Hakim', 'Lina Marlina', 'Muhamad Rizki', 'Nadia Zahra', 'Oscar Wijaya'
  ];

  const studentUsers = [];
  for (let i = 0; i < studentNames.length; i++) {
    const firstName = studentNames[i].split(' ')[0].toLowerCase();
    const user = await prisma.user.create({
      data: {
        email: `${firstName}@siswa.sekolah.id`,
        password: hash('siswa123'),
        name: studentNames[i],
        role: 'SISWA',
        phone: `08150000${String(i + 1).padStart(4, '0')}`
      }
    });
    studentUsers.push(user);
  }

  // Assign students to classes with parents
  const students = [];
  for (let i = 0; i < studentUsers.length; i++) {
    const classIndex = i < 5 ? 0 : i < 10 ? 1 : i < 13 ? 2 : i < 14 ? 3 : 4;
    const parentId = i < 8 ? parents[0].id : parents[1].id;
    const student = await prisma.student.create({
      data: {
        nis: `2025${String(i + 1).padStart(4, '0')}`,
        userId: studentUsers[i].id,
        classId: classes[classIndex].id,
        parentId,
        address: `Jl. Pendidikan No. ${i + 1}, Jakarta`
      }
    });
    students.push(student);
  }

  // Create attendance data for the last 7 days
  const statuses = ['HADIR', 'HADIR', 'HADIR', 'HADIR', 'HADIR', 'HADIR', 'HADIR', 'TERLAMBAT', 'SAKIT', 'IZIN', 'ALPA'];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateStr = date.toISOString().split('T')[0];

    for (const student of students) {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const checkInMinute = status === 'TERLAMBAT' ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 10);

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: student.classId,
          date: dateStr,
          checkInTime: status !== 'ALPA' && status !== 'SAKIT' && status !== 'IZIN' ? `07:${String(checkInMinute).padStart(2, '0')}` : null,
          checkOutTime: status === 'HADIR' || status === 'TERLAMBAT' ? '14:00' : null,
          status,
          method: 'MANUAL',
          notes: status === 'SAKIT' ? 'Demam' : status === 'IZIN' ? 'Acara keluarga' : null
        }
      });
    }
  }

  // Set today's specific user as demo login
  console.log('\n✅ Seed berhasil!');
  console.log('\n📋 Demo Accounts:');
  console.log('Admin     : admin@sekolah.id / admin123');
  console.log('Guru      : guru@sekolah.id / guru123');
  console.log('Siswa     : andi@siswa.sekolah.id / siswa123');
  console.log('Kepsek    : kepsek@sekolah.id / kepsek123');
  console.log('Orang Tua : ortu@sekolah.id / ortu123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
