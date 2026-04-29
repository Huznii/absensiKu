# Walkthrough — Aplikasi Absensi Siswa MVP

## Ringkasan

Berhasil membangun **Aplikasi Absensi Siswa** full-stack MVP dengan fitur lengkap:

- ✅ **Backend API** — Node.js + Express + Prisma + SQLite (17 API endpoints)
- ✅ **Frontend Web** — Vite + React dengan design premium
- ✅ **5 Role User** — Admin, Guru, Siswa, Kepala Sekolah, Orang Tua
- ✅ **QR Code Attendance** — Generate & scan dengan auto-refresh 30 detik
- ✅ **CRUD Master Data** — Siswa, Guru, Kelas, Jadwal
- ✅ **Laporan & Analitik** — Harian, bulanan, dashboard dengan charts
- ✅ **UI Premium** — Dark mode, glassmorphism, animations, responsive

## Screenshots

![Login Page - Glassmorphism design dengan dark theme](C:\Users\USER\.gemini\antigravity\brain\3f21382a-3145-433a-84b4-41c813ba8203\login_screenshot.png)

![Admin Dashboard - Stats, bar chart, pie chart, sidebar navigation](C:\Users\USER\.gemini\antigravity\brain\3f21382a-3145-433a-84b4-41c813ba8203\dashboard_screenshot.png)

## Cara Menjalankan

```bash
# Terminal 1 — Backend
cd server
npm install
npx prisma migrate dev --name init
node prisma/seed.js
node --watch server.js    # → http://localhost:5000

# Terminal 2 — Frontend
cd client
npm install
npm run dev               # → http://localhost:5173
```

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@sekolah.id | admin123 |
| Guru | guru@sekolah.id | guru123 |
| Siswa | andi@siswa.sekolah.id | siswa123 |
| Kepala Sekolah | kepsek@sekolah.id | kepsek123 |
| Orang Tua | ortu@sekolah.id | ortu123 |

## Struktur Project

```
absensi_apk/
├── server/                     # Backend API
│   ├── prisma/
│   │   ├── schema.prisma       # 7 models database
│   │   └── seed.js             # 15 siswa, 3 guru, 5 kelas, 7 hari data
│   ├── src/
│   │   ├── controllers/        # 7 controllers (auth, attendance, student, etc.)
│   │   ├── middleware/         # auth, role, error handling
│   │   └── routes/            # 8 route files
│   └── server.js
├── client/                     # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, AppLayout, Layout.css
│   │   │   └── ui/            # components.css (design system)
│   │   ├── context/           # AuthContext
│   │   ├── pages/
│   │   │   ├── auth/          # LoginPage
│   │   │   ├── attendance/    # QRGenerate, QRScan, ManualAttendance
│   │   │   ├── admin/         # StudentMgmt, TeacherMgmt, ClassMgmt, ScheduleMgmt
│   │   │   └── reports/       # DailyReport, MonthlyReport
│   │   ├── services/          # api.js (axios)
│   │   ├── App.jsx            # Router + protected routes
│   │   └── index.css          # Global styles + CSS variables
│   └── index.html
└── .env
```

## Fitur yang Diimplementasi

### 🔐 Authentication (AUTH-001, AUTH-003)
- Login multi-role dengan JWT
- Role-based route protection
- Auth context dengan localStorage persistence

### 📱 Absensi QR Code (ABS-001 ~ ABS-007)
- Generate QR dinamis per sesi (30 detik auto-refresh)
- Scan QR untuk absensi masuk/keluar
- Validasi waktu (cek terlambat vs jadwal)
- Input manual per siswa
- Bulk attendance per kelas
- Status: Hadir, Sakit, Izin, Alpa, Terlambat

### 📊 Manajemen Data Master (MDM-001 ~ MDM-004)
- CRUD Siswa dengan search, filter kelas, pagination
- CRUD Guru dengan wali kelas assignment
- CRUD Kelas dengan jumlah siswa counter
- CRUD Jadwal per kelas per hari

### 📈 Laporan & Analitik (RPT-001 ~ RPT-003, RPT-006)
- Laporan harian dengan filter tanggal & kelas
- Laporan bulanan dengan chart (Recharts) & tabel per siswa
- Dashboard analitik: stat cards, bar chart trend 7 hari, pie chart distribusi
- Persentase kehadiran per siswa

### 👨‍👩‍👧‍👦 Modul Orang Tua
- Dashboard monitoring anak
- Daftar anak dan kelas

### 🎨 UI/UX
- Dark/light mode toggle
- Glassmorphism login page
- Responsive sidebar (collapsible di mobile)
- Micro-animations (fadeIn, scaleIn)
- Color-coded status badges
- Google Fonts (Inter + Outfit)
- CSS Variables design system

## Validasi

- ✅ Backend server berjalan di port 5000
- ✅ Frontend dev server berjalan di port 5173
- ✅ Login berhasil untuk role Admin
- ✅ Dashboard menampilkan stats + charts
- ✅ Sidebar navigation berfungsi
- ✅ Seed data: 15 siswa, 3 guru, 5 kelas, 7 hari attendance history

## Fitur yang sudah jalan(Fase 1):

✅ Login multi-role (5 role)
✅ Dashboard analytics + charts
✅ QR Absensi (generate + scan + mode proyektor)
✅ Absensi Manual & Bulk
✅ CRUD Siswa, Guru, Kelas, Jadwal
✅ Reset Password oleh Admin
✅ Laporan Harian & Bulanan
✅ Dark/Light mode + responsive

Fitur yang bisa dikembangkan selanjutnya (Fase 2):

🔜 Notifikasi ke orang tua (WhatsApp/FCM)
🔜 Absensi dengan kamera selfie (anti-proxy)
🔜 Export laporan ke PDF/Excel
🔜 Geofencing (validasi lokasi GPS)