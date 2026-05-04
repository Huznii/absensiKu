import { useState, useEffect } from 'react';
import { studentAPI, classAPI, authAPI } from '../../services/api';
import '../../components/ui/components.css';
import { MdSchool, MdEditDocument, MdSave } from 'react-icons/md';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nis: '', name: '', email: '', password: '', phone: '', classId: '', address: '' });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        studentAPI.getAll({ search, classId: filterClass, page, limit: 15 }),
        classAPI.getAll()
      ]);
      setStudents(sRes.data.students);
      setPagination(sRes.data.pagination);
      setClasses(cRes.data.classes);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [search, filterClass]);

  const openAdd = () => { setEditing(null); setForm({ nis: '', name: '', email: '', password: '', phone: '', classId: '', address: '' }); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ nis: s.nis, name: s.user.name, email: s.user.email, password: '', phone: s.user.phone || '', classId: s.classId || '', address: s.address || '' }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editing) {
        await studentAPI.update(editing.id, form);
      } else {
        await studentAPI.create(form);
      }
      setShowModal(false);
      loadData();
    } catch (e) { alert(e.response?.data?.error || 'Gagal menyimpan'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await studentAPI.delete(deleteTarget.id); loadData(); } catch (e) { alert(e.response?.data?.error || 'Gagal menghapus'); }
    setDeleteTarget(null);
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword) return;
    setResetMsg('');
    try {
      const { data } = await authAPI.resetPassword({ userId: resetTarget.user.id, newPassword });
      setResetMsg(data.message);
      setNewPassword('');
      setTimeout(() => { setResetTarget(null); setResetMsg(''); }, 2000);
    } catch (e) {
      setResetMsg(e.response?.data?.error || 'Gagal reset password');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="flex items-center gap-2"><MdSchool className="inline-block" /> Data Siswa</h1>
        <button className="btn btn--primary" onClick={openAdd}>+ Tambah Siswa</button>
      </div>
      <div className="filters-bar">
        <input className="form-input" placeholder="🔍 Cari nama atau NIS..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input form-select" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">Semua Kelas</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : students.length === 0 ? (
          <div className="empty-state"><div className="empty-state__icon"><MdSchool className="inline-block" /></div><div className="empty-state__text">Tidak ada data siswa</div></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>NIS</th><th>Nama</th><th>Kelas</th><th>Email</th><th>Aksi</th></tr></thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.nis}</strong></td>
                    <td>{s.user.name}</td>
                    <td><span className="badge badge--hadir">{s.class?.name || '-'}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.user.email}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn--secondary btn--sm" onClick={() => openEdit(s)} title="Edit"><MdEditDocument className="inline-block" /></button>
                        <button className="btn btn--sm" onClick={() => { setResetTarget(s); setNewPassword(''); setResetMsg(''); }} title="Reset Password" style={{ background: 'linear-gradient(135deg, var(--warning), #d97706)', color: '#fff' }}>🔑</button>
                        <button className="btn btn--danger btn--sm" onClick={() => setDeleteTarget(s)} title="Hapus">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            {Array.from({ length: pagination.totalPages }, (_, i) => (
              <button key={i} className={`btn btn--sm ${pagination.page === i + 1 ? 'btn--primary' : 'btn--secondary'}`} onClick={() => loadData(i + 1)}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">{editing ? '<MdEditDocument className="inline-block" /> Edit Siswa' : '+ Tambah Siswa'}</h3>
              <button className="modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-group"><label className="form-label">NIS</label><input className="form-input" value={form.nis} onChange={e => setForm({ ...form, nis: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Nama</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            {!editing && <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>}
            <div className="form-group"><label className="form-label">Kelas</label><select className="form-input form-select" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}><option value="">Pilih Kelas</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">No. HP</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setShowModal(false)}>Batal</button>
              <button className="btn btn--primary" onClick={handleSave}><MdSave className="inline-block" /> Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ marginBottom: 8 }}>Hapus Siswa?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
              Yakin ingin menghapus <strong>{deleteTarget.user?.name}</strong> (NIS: {deleteTarget.nis})? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="modal__footer" style={{ justifyContent: 'center', borderTop: 'none', paddingTop: 0 }}>
              <button className="btn btn--secondary" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn btn--danger" onClick={confirmDelete}>🗑️ Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="modal-overlay" onClick={() => setResetTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal__header">
              <h3 className="modal__title">🔑 Reset Password</h3>
              <button className="modal__close" onClick={() => setResetTarget(null)}>✕</button>
            </div>
            <div style={{ padding: '12px 0 4px', marginBottom: 16, borderBottom: '1px solid var(--border-light)' }}>
              <p style={{ fontWeight: 600, fontSize: '1rem' }}>{resetTarget.user?.name}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>NIS: {resetTarget.nis} · {resetTarget.user?.email}</p>
            </div>
            {resetMsg && (
              <div style={{ padding: 10, marginBottom: 12, borderRadius: 'var(--radius-md)', background: resetMsg.includes('berhasil') ? 'var(--success-light)' : 'var(--danger-light)', color: resetMsg.includes('berhasil') ? '#065f46' : '#991b1b', fontWeight: 500, fontSize: '0.85rem' }}>
                {resetMsg}
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Password Baru</label>
              <input className="form-input" type="password" placeholder="Minimal 6 karakter" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              ⚠️ Password lama tidak dapat dilihat. Set password baru untuk user ini, lalu informasikan ke yang bersangkutan.
            </p>
            <div className="modal__footer">
              <button className="btn btn--secondary" onClick={() => setResetTarget(null)}>Batal</button>
              <button className="btn btn--primary" onClick={handleResetPassword} disabled={newPassword.length < 6}>🔑 Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
