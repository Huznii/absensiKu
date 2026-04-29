import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reportAPI, attendanceAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../components/ui/components.css';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#6366f1', '#ef4444'];
const STATUS_COLOR = { HADIR: '#10b981', TERLAMBAT: '#f59e0b', SAKIT: '#3b82f6', IZIN: '#6366f1', ALPA: '#ef4444', BELUM: '#64748b' };

export default function Dashboard() {
  const { user } = useAuth();
  const [dashData, setDashData] = useState(null);
  const [todayAtt, setTodayAtt] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await reportAPI.dashboard();
        setDashData(data);
        if (user.role === 'SISWA') {
          const att = await attendanceAPI.getToday();
          setTodayAtt(att.data.attendances);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="spinner" />;

  const greetHour = new Date().getHours();
  const greet = greetHour < 11 ? 'Selamat Pagi' : greetHour < 15 ? 'Selamat Siang' : greetHour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  // Student Dashboard
  if (user.role === 'SISWA') {
    const myAtt = todayAtt[0];
    return (
      <div className="animate-fade-in">
        <h1 style={{ marginBottom: 4 }}>{greet}, {user.name?.split(' ')[0]}! 👋</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{user.roleData?.class?.name || 'Kelas belum diatur'}</p>
        <div className="stats-grid">
          <div className="card card--stat card--primary">
            <div className="stat-icon">📍</div>
            <div className="stat-value">{myAtt ? myAtt.status : 'Belum'}</div>
            <div className="stat-label">Status Hari Ini</div>
          </div>
          <div className="card card--stat card--success">
            <div className="stat-icon">🕐</div>
            <div className="stat-value">{myAtt?.checkInTime || '--:--'}</div>
            <div className="stat-label">Jam Masuk</div>
          </div>
          <div className="card card--stat card--info">
            <div className="stat-icon">🕑</div>
            <div className="stat-value">{myAtt?.checkOutTime || '--:--'}</div>
            <div className="stat-label">Jam Keluar</div>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <h3 style={{ marginBottom: 8 }}>📱 Scan QR Code untuk Absensi</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Minta guru untuk menampilkan QR Code kelas</p>
          <a href="/attendance/scan" className="btn btn--primary btn--lg">Buka Scanner</a>
        </div>
      </div>
    );
  }

  // Parent Dashboard
  if (user.role === 'ORANG_TUA') {
    return (
      <div className="animate-fade-in">
        <h1 style={{ marginBottom: 4 }}>{greet}, {user.name?.split(' ')[0]}! 👋</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Monitoring kehadiran anak Anda</p>
        <div className="stats-grid">
          <div className="card card--stat card--primary">
            <div className="stat-icon">👨‍👩‍👧‍👦</div>
            <div className="stat-value">{user.roleData?.children?.length || 0}</div>
            <div className="stat-label">Jumlah Anak</div>
          </div>
        </div>
        {user.roleData?.children?.map(child => (
          <div className="card" key={child.id} style={{ marginBottom: 12 }}>
            <h3>🎓 {child.user.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Kelas: {child.class?.name || '-'}</p>
          </div>
        ))}
      </div>
    );
  }

  // No data guard
  if (!dashData) return <div className="empty-state"><div className="empty-state__icon">📊</div><div className="empty-state__text">Tidak ada data</div></div>;

  const pieData = [
    { name: 'Hadir', value: dashData.today.hadir },
    { name: 'Terlambat', value: dashData.today.terlambat },
    { name: 'Sakit', value: dashData.today.sakit },
    { name: 'Izin', value: dashData.today.izin },
    { name: 'Alpa', value: dashData.today.alpa },
  ].filter(d => d.value > 0);

  const isGuru = user.role === 'GURU';
  const scopeLabel = isGuru && dashData.classInfo
    ? `Wali Kelas ${dashData.classInfo.name}`
    : 'Ringkasan data kehadiran sekolah';

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: 4 }}>{greet}, {user.name?.split(' ')[0]}! 👋</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{scopeLabel}</p>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="card card--stat card--primary">
          <div className="stat-icon">🎓</div>
          <div className="stat-value">{dashData.totalStudents}</div>
          <div className="stat-label">{isGuru ? 'Siswa di Kelas' : 'Total Siswa'}</div>
        </div>
        <div className="card card--stat card--success">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{dashData.today.hadir}</div>
          <div className="stat-label">Hadir Hari Ini</div>
        </div>
        <div className="card card--stat card--warning">
          <div className="stat-icon">⏰</div>
          <div className="stat-value">{dashData.today.terlambat}</div>
          <div className="stat-label">Terlambat</div>
        </div>
        <div className="card card--stat card--info">
          <div className="stat-icon">💊</div>
          <div className="stat-value">{dashData.today.sakit}</div>
          <div className="stat-label">Sakit</div>
        </div>
        <div className="card card--stat card--primary">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{dashData.today.izin}</div>
          <div className="stat-label">Izin</div>
        </div>
        <div className="card card--stat card--danger">
          <div className="stat-icon">❌</div>
          <div className="stat-value">{dashData.today.alpa}</div>
          <div className="stat-label">Alpa</div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📊 Trend Kehadiran 7 Hari</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dashData.weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tickFormatter={d => d.slice(8)} stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.85rem' }} />
              <Bar dataKey="hadir" fill="#10b981" radius={[4,4,0,0]} name="Hadir" />
              <Bar dataKey="terlambat" fill="#f59e0b" radius={[4,4,0,0]} name="Terlambat" />
              <Bar dataKey="sakit" fill="#3b82f6" radius={[4,4,0,0]} name="Sakit" />
              <Bar dataKey="izin" fill="#6366f1" radius={[4,4,0,0]} name="Izin" />
              <Bar dataKey="alpa" fill="#ef4444" radius={[4,4,0,0]} name="Alpa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🎯 Distribusi Hari Ini</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><div className="empty-state__icon">📭</div><div className="empty-state__text">Belum ada data hari ini</div></div>
          )}
        </div>
      </div>

      {/* Guru: Student attendance list for their class */}
      {isGuru && dashData.todayStudents && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <h3>📋 Kehadiran {dashData.classInfo?.name} Hari Ini</h3>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr><th>NIS</th><th>Nama</th><th>Status</th><th>Masuk</th><th>Keluar</th></tr>
              </thead>
              <tbody>
                {dashData.todayStudents.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.nis}</td>
                    <td>{s.name}</td>
                    <td>
                      <span className={`badge badge--${s.status.toLowerCase()}`} style={s.status === 'BELUM' ? { background: 'var(--bg-secondary)', color: 'var(--text-muted)' } : {}}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.checkInTime || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.checkOutTime || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/attendance/qr" className="btn btn--primary btn--sm">📱 Buka QR Absensi</a>
            <a href="/attendance/manual" className="btn btn--secondary btn--sm">✏️ Input Manual</a>
          </div>
        </div>
      )}

      {/* Admin/Kepsek: Extra stats */}
      {!isGuru && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <div className="card card--stat card--info"><div className="stat-icon">👨‍🏫</div><div className="stat-value">{dashData.totalTeachers}</div><div className="stat-label">Total Guru</div></div>
          <div className="card card--stat card--primary"><div className="stat-icon">🏫</div><div className="stat-value">{dashData.totalClasses}</div><div className="stat-label">Total Kelas</div></div>
        </div>
      )}
    </div>
  );
}
