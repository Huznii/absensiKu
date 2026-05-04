import { useState, useEffect } from 'react';
import { teacherAPI, classAPI, authAPI } from '../../services/api';
import '../../components/ui/components.css';
import { MdPersonOutline, MdEditDocument, MdSave } from 'react-icons/md';

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nip: '', name: '', email: '', password: '', phone: '', homeroomClassId: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tRes, cRes] = await Promise.all([teacherAPI.getAll({ search }), classAPI.getAll()]);
      setTeachers(tRes.data.teachers);
      setClasses(cRes.data.classes);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [search]);

  const openAdd = () => { setEditing(null); setForm({ nip: '', name: '', email: '', password: '', phone: '', homeroomClassId: '' }); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setForm({ nip: t.nip, name: t.user.name, email: t.user.email, password: '', phone: t.user.phone || '', homeroomClassId: t.homeroomClassId || '' }); setShowModal(true); };

  const handleSave = async () => {
    try {
      if (editing) await teacherAPI.update(editing.id, form);
      else await teacherAPI.create(form);
      setShowModal(false); loadData();
    } catch (e) { alert(e.response?.data?.error || 'Gagal menyimpan'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await teacherAPI.delete(deleteTarget.id); loadData(); } catch (e) { alert(e.response?.data?.error || 'Gagal menghapus'); }
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
      <div className="page-header"><h1 className="flex items-center gap-2"><MdPersonOutline className="inline-block" /> Data Guru</h1><button className="btn btn--primary" onClick={openAdd}>+ Tambah Guru</button></div>
      <div className="filters-bar"><input className="form-input" placeholder="🔍 Cari nama atau NIP..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : teachers.length === 0 ? (
          <div className="empty-state"><div className="empty-state__icon"><MdPersonOutline className="inline-block" /></div><div className="empty-state__text">Tidak ada data guru</div></div>
        ) : (
          <div className="table-container"><table className="table"><thead><tr><th>NIP</th><th>Nama</th><th>Wali Kelas</th><th>Email</th><th>Aksi</th></tr></thead><tbody>
            {teachers.map(t => (
              <tr key={t.id}>
                <td><strong>{t.nip}</strong></td>
                <td>{t.user.name}</td>
                <td>{t.homeroomClass ? <span className="badge badge--hadir">{t.homeroomClass.name}</span> : '-'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t.user.email}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn--secondary btn--sm" onClick={() => openEdit(t)} title="Edit"><MdEditDocument className="inline-block" /></button>
                    <button className="btn btn--sm" onClick={() => { setResetTarget(t); setNewPassword(''); setResetMsg(''); }} title="Reset Password" style={{ background: 'linear-gradient(135deg, var(--warning), #d97706)', color: '#fff' }}>🔑</button>
                    <button className="btn btn--danger btn--sm" onClick={() => setDeleteTarget(t)} title="Hapus">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal__header"><h3 className="modal__title">{editing ? '<MdEditDocument className="inline-block" /> Edit Guru' : '+ Tambah Guru'}</h3><button className="modal__close" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="form-group"><label className="form-label">NIP</label><input className="form-input" value={form.nip} onChange={e => setForm({ ...form, nip: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Nama</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          {!editing && <div className="form-group"><label className="form-label">Password</label><input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>}
          <div className="form-group"><label className="form-label">Wali Kelas</label><select className="form-input form-select" value={form.homeroomClassId} onChange={e => setForm({ ...form, homeroomClassId: e.target.value })}><option value="">Tidak ada</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="modal__footer"><button className="btn btn--secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn--primary" onClick={handleSave}><MdSave className="inline-block" /> Simpan</button></div>
        </div></div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ marginBottom: 8 }}>Hapus Guru?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
              Yakin ingin menghapus <strong>{deleteTarget.user?.name}</strong> (NIP: {deleteTarget.nip})?
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
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>NIP: {resetTarget.nip} · {resetTarget.user?.email}</p>
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
