import { useState, useEffect } from 'react';
import { reportAPI, classAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import '../../components/ui/components.css';

export default function MonthlyReportPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([reportAPI.monthly({ month, year, classId }), classAPI.getAll()]);
      setData(rRes.data); setClasses(cRes.data.classes);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, [month, year, classId]);

  const chartData = data?.byDate ? Object.entries(data.byDate).map(([date, vals]) => ({ date: date.slice(8), ...vals })) : [];

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>📈 Laporan Bulanan</h1></div>
      <div className="filters-bar">
        <select className="form-input form-select" value={month} onChange={e => setMonth(+e.target.value)}>
          {['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="form-input form-select" value={year} onChange={e => setYear(+e.target.value)}>
          {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="form-input form-select" value={classId} onChange={e => setClassId(e.target.value)}><option value="">Semua Kelas</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>
      {loading ? <div className="spinner" /> : data && (
        <>
          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 16 }}>📊 Grafik Kehadiran Harian</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="hadir" fill="#10b981" name="Hadir" radius={[2,2,0,0]} />
                  <Bar dataKey="terlambat" fill="#f59e0b" name="Terlambat" radius={[2,2,0,0]} />
                  <Bar dataKey="sakit" fill="#3b82f6" name="Sakit" radius={[2,2,0,0]} />
                  <Bar dataKey="izin" fill="#6366f1" name="Izin" radius={[2,2,0,0]} />
                  <Bar dataKey="alpa" fill="#ef4444" name="Alpa" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container"><table className="table"><thead><tr><th>Nama</th><th>Kelas</th><th>Hadir</th><th>Terlambat</th><th>Sakit</th><th>Izin</th><th>Alpa</th><th>%</th></tr></thead><tbody>
              {data.byStudent?.map((s, i) => {
                const pct = s.total > 0 ? Math.round(((s.hadir + s.terlambat) / s.total) * 100) : 0;
                return (
                  <tr key={i}><td>{s.name}</td><td>{s.className || '-'}</td><td><span className="badge badge--hadir">{s.hadir}</span></td><td><span className="badge badge--terlambat">{s.terlambat}</span></td><td><span className="badge badge--sakit">{s.sakit}</span></td><td><span className="badge badge--izin">{s.izin}</span></td><td><span className="badge badge--alpa">{s.alpa}</span></td><td><strong style={{ color: pct >= 80 ? 'var(--success)' : 'var(--danger)' }}>{pct}%</strong></td></tr>
                );
              })}
            </tbody></table></div>
          </div>
        </>
      )}
    </div>
  );
}
