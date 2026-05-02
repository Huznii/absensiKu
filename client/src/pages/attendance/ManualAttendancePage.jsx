import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI, classAPI, studentAPI } from '../../services/api';
import '../../components/ui/components.css';

const STATUSES = ['HADIR', 'TERLAMBAT', 'SAKIT', 'IZIN', 'ALPA'];

export default function ManualAttendancePage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isExtra, setIsExtra] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    classAPI.getAll().then(r => {
      setClasses(r.data.classes);
      if (user.roleData?.homeroomClassId) setSelectedClass(user.roleData.homeroomClassId);
      else if (r.data.classes.length > 0) setSelectedClass(r.data.classes[0].id);
    });
  }, []);

  // Load students and their existing attendance for today
  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    const today = new Date(Date.now() + 7 * 3600000).toISOString().split('T')[0];
    Promise.all([
      studentAPI.getAll({ classId: selectedClass, limit: 50 }),
      attendanceAPI.getToday({ classId: selectedClass })
    ]).then(([studentsRes, attendanceRes]) => {
      const studentList = studentsRes.data.students;
      setStudents(studentList);

      // Build attendance map: start with default 'HADIR', then overlay saved data
      const initial = {};
      studentList.forEach(s => { initial[s.id] = 'HADIR'; });

      // Override with existing attendance records from the server
      const todayAttendances = attendanceRes.data.attendances || [];
      todayAttendances.forEach(a => {
        if (initial.hasOwnProperty(a.studentId)) {
          initial[a.studentId] = a.status;
        }
      });

      setAttendances(initial);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [selectedClass]);

  const handleSubmit = async () => {
    setSaving(true);
    setMessage('');
    try {
      const today = new Date(Date.now() + 7 * 3600000).toISOString().split('T')[0];
      const attList = Object.entries(attendances).map(([studentId, status]) => ({ studentId, status }));
      await attendanceAPI.bulk({ classId: selectedClass, date: today, attendances: attList, isExtra });
      setMessage(`✅ ${attList.length} absensi berhasil disimpan!`);
    } catch (e) {
      setMessage('❌ ' + (e.response?.data?.error || 'Gagal menyimpan'));
    }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>✏️ Absensi Manual</h1></div>
      <div className="card">
        <div className="filters-bar" style={{ flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <select className="form-input form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={isExtra} onChange={e => setIsExtra(e.target.checked)} />
              Sesi Tambahan
            </label>
          </div>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving || students.length === 0}>
            {saving ? 'Menyimpan...' : '💾 Simpan Semua'}
          </button>
        </div>
        {message && <div style={{ padding: 12, marginBottom: 16, borderRadius: 'var(--radius-md)', background: message.startsWith('✅') ? 'var(--success-light)' : 'var(--danger-light)', color: message.startsWith('✅') ? '#065f46' : '#991b1b', fontWeight: 500 }}>{message}</div>}

        {loading ? <div className="spinner" /> : students.length === 0 ? (
          <div className="empty-state"><div className="empty-state__icon">👥</div><div className="empty-state__text">Tidak ada siswa di kelas ini</div></div>
        ) : (
          <div className="attendance-list">
            {students.map((s, i) => (
              <div className="attendance-item" key={s.id} style={{ animationDelay: `${i * 30}ms` }}>
                <div className="attendance-item__left">
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>{s.user.name[0]}</div>
                  <div>
                    <div className="attendance-item__name">{s.user.name}</div>
                    <div className="attendance-item__nis">NIS: {s.nis}</div>
                  </div>
                </div>
                <div className="status-buttons">
                  {STATUSES.map(st => (
                    <button key={st} className={`status-btn status-btn--${st.toLowerCase()} ${attendances[s.id] === st ? 'status-btn--active' : ''}`} onClick={() => setAttendances(prev => ({ ...prev, [s.id]: st }))}>
                      {st === 'HADIR' ? '✓' : ''} {st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
