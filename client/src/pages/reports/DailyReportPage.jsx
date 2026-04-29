import { useState, useEffect } from 'react';
import { reportAPI, classAPI } from '../../services/api';
import '../../components/ui/components.css';

export default function DailyReportPage() {
  const [data, setData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [date, setDate] = useState(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date()));
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([reportAPI.daily({ date, classId }), classAPI.getAll()]);
      setData(rRes.data); setClasses(cRes.data.classes);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, [date, classId]);

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>📋 Laporan Harian</h1></div>
      <div className="filters-bar">
        <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <select className="form-input form-select" value={classId} onChange={e => setClassId(e.target.value)}><option value="">Semua Kelas</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      {loading ? <div className="spinner" /> : data && (
        <>
          <div className="stats-grid">
            <div className="card card--stat card--success"><div className="stat-value">{data.summary.hadir}</div><div className="stat-label">Hadir</div></div>
            <div className="card card--stat card--warning"><div className="stat-value">{data.summary.terlambat}</div><div className="stat-label">Terlambat</div></div>
            <div className="card card--stat card--info"><div className="stat-value">{data.summary.sakit}</div><div className="stat-label">Sakit</div></div>
            <div className="card card--stat card--primary"><div className="stat-value">{data.summary.izin}</div><div className="stat-label">Izin</div></div>
            <div className="card card--stat card--danger"><div className="stat-value">{data.summary.alpa}</div><div className="stat-label">Alpa</div></div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {data.attendances.length === 0 ? (
              <div className="empty-state"><div className="empty-state__icon">📭</div><div className="empty-state__text">Tidak ada data absensi</div></div>
            ) : (
              <div className="table-container"><table className="table"><thead><tr><th>Nama</th><th>Kelas</th><th>Masuk</th><th>Keluar</th><th>Status</th><th>Metode</th></tr></thead><tbody>
                {data.attendances.map(a => (
                  <tr key={a.id}><td>{a.student?.user?.name}</td><td>{a.class?.name}</td><td>{a.checkInTime || '-'}</td><td>{a.checkOutTime || '-'}</td><td><span className={`badge badge--${a.status.toLowerCase()}`}>{a.status}</span></td><td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.method}</td></tr>
                ))}
              </tbody></table></div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
