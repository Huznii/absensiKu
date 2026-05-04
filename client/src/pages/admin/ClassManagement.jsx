import { useState, useEffect } from 'react';
import { classAPI } from '../../services/api';
import '../../components/ui/components.css';
import { MdBusiness, MdEditDocument, MdSave } from 'react-icons/md';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', grade: 'X', major: '', academicYear: '2025/2026' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try { const r = await classAPI.getAll(); setClasses(r.data.classes); } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: '', grade: 'X', major: '', academicYear: '2025/2026' }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, grade: c.grade, major: c.major || '', academicYear: c.academicYear }); setShowModal(true); };
  const handleSave = async () => {
    try {
      if (editing) await classAPI.update(editing.id, form);
      else await classAPI.create(form);
      setShowModal(false); loadData();
    } catch (e) { alert(e.response?.data?.error || 'Gagal menyimpan'); }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await classAPI.delete(deleteTarget.id); loadData(); } catch (e) { alert(e.response?.data?.error || 'Gagal menghapus'); }
    setDeleteTarget(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1 className="flex items-center gap-2"><MdBusiness className="inline-block" /> Data Kelas</h1><button className="btn btn--primary" onClick={openAdd}>+ Tambah Kelas</button></div>
      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="spinner" /> : (
          <div className="table-container"><table className="table"><thead><tr><th>Nama</th><th>Tingkat</th><th>Jurusan</th><th>Tahun Ajaran</th><th>Siswa</th><th>Wali Kelas</th><th>Aksi</th></tr></thead><tbody>
            {classes.map(c => (
              <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.grade}</td><td>{c.major || '-'}</td><td>{c.academicYear}</td><td><span className="badge badge--hadir">{c._count?.students || 0}</span></td><td>{c.homeroomTeacher?.user?.name || '-'}</td><td><div style={{ display: 'flex', gap: 4 }}><button className="btn btn--secondary btn--sm" onClick={() => openEdit(c)}><MdEditDocument className="inline-block" /></button><button className="btn btn--danger btn--sm" onClick={() => setDeleteTarget(c)}>🗑️</button></div></td></tr>
            ))}
          </tbody></table></div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal__header"><h3 className="modal__title">{editing ? '<MdEditDocument className="inline-block" /> Edit Kelas' : '+ Tambah Kelas'}</h3><button className="modal__close" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="form-group"><label className="form-label">Nama Kelas</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="X IPA 1" /></div>
          <div className="form-group"><label className="form-label">Tingkat</label><select className="form-input form-select" value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}><option>X</option><option>XI</option><option>XII</option></select></div>
          <div className="form-group"><label className="form-label">Jurusan</label><input className="form-input" value={form.major} onChange={e => setForm({ ...form, major: e.target.value })} placeholder="IPA / IPS / Bahasa" /></div>
          <div className="form-group"><label className="form-label">Tahun Ajaran</label><input className="form-input" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })} /></div>
          <div className="modal__footer"><button className="btn btn--secondary" onClick={() => setShowModal(false)}>Batal</button><button className="btn btn--primary" onClick={handleSave}><MdSave className="inline-block" /> Simpan</button></div>
        </div></div>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ marginBottom: 8 }}>Hapus Kelas?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20 }}>
              Yakin ingin menghapus kelas <strong>{deleteTarget.name}</strong>?
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
