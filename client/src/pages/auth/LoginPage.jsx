import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../components/ui/components.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login gagal. Periksa email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo__icon">📚</span>
          <div className="login-logo__title">AbsensiKu</div>
          <div className="login-logo__subtitle">Sistem Absensi Siswa Digital</div>
        </div>
        {error && <div className="login-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="Masukkan email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Masukkan password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Memproses...' : '🔐 Masuk'}
          </button>
        </form>
        <div style={{ marginTop: '20px', padding: '14px', background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: '#94a3b8' }}>
          <strong style={{ color: '#c7d2fe' }}>Demo Accounts:</strong><br />
          Admin: admin@sekolah.id<br />
          Guru: guru@sekolah.id<br />
          Siswa: andi@siswa.sekolah.id<br />
          Kepsek: kepsek@sekolah.id<br />
          Orang Tua: ortu@sekolah.id<br />
          <span style={{ color: '#64748b' }}>Password: [role]123</span>
        </div>
      </div>
    </div>
  );
}
