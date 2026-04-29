import { useState, useEffect } from 'react';
import { scheduleAPI, classAPI } from '../../services/api';
import '../../components/ui/components.css';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filterClass, setFilterClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ classId: '', dayOfWeek: '1', checkInTime: '07:00', checkOutTime: '14:00' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([scheduleAPI.getAll({ classId: filterClass }), classAPI.getAll()]);
      setSchedules(sRes.data.schedules); setClasses(cRes.data.classes);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, [filterClass]);

  const handleSave = async () => {
    try { await scheduleAPI.create(form); setShowModal(false); loadData(); } catch (e) { alert('Gagal menyimpan'); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await scheduleAPI.delete(deleteTarget.id); loadData(); } catch (e) { alert('Gagal menghapus'); }
    setDeleteTarget(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>📅 Jadwal</h1><button className="btn btn--primary" onClick={() => { setForm({ classId: classes[0]?.id || '', dayOfWeek: '1', checkInTime: '07:00', checkOutTime: '14:00' }); setShowModal(true); }}>+ Tambah Jadwal</button></div>
      <div className="filters-bar"><select className="form-input form-select" value={filterClass} onChange={e => setFilterClass(e.target.value)}><option value="">Semua Kelas</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : (
          <div className="table-container"><table className="table"><thead><tr><th>Kelas</th><th>Hari</th><th>Jam Masuk</th><th>Jam Keluar</th><th>Aksi</th></tr></thead><tbody>
            {schedules.map(s => (
              <tr key={s.id}><td>{s.class?.name}</td><td>{DAYS[s.dayOfWeek]}</td><td>{s.checkInTime}</td><td>{s.checkOutTime}</td><td><button className="btn btn--danger btn--sm" onClick={() => setDeleteTarget(s)}>🗑️</button></td></tr>
            ))}
          </tbody></table></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal__header"><h3 className="modal__title">+ Tambah Jadwal</h3><button className="modal__close" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="form-group"><label className="form-label">Kelas</label><select className="form-input form-select" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Hari</label><select className="form-input form-select" value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: e.target.value })}>{DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Jam Masuk</label><input className="form-input" type="time" value={form.checkInTime} onChange={e => setForm({ ...form, checkInTime: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Jam Keluar</label><input className="form-input" type="time" value={form.checkOutTime} onChange={e => setForm({ ...form, checkOutTime: e.target.value })} /></div>
          <div className="modal__footer"><button className="btn btn--secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn--primary" onClick={handleSave}>💾 Simpan</button></div>
        </div></div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ marginBottom: 8 }}>Hapus Jadwal?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
              Yakin ingin menghapus jadwal <strong>{deleteTarget.class?.name} - {DAYS[deleteTarget.dayOfWeek]}</strong>?
            </p>
            <div className="modal__footer" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 0 }}>
              <button className="btn btn--secondary" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn btn--danger" onClick={confirmDelete}>🗑️ Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
