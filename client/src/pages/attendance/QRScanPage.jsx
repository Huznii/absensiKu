import { useState } from 'react';
import { attendanceAPI } from '../../services/api';
import '../../components/ui/components.css';

export default function QRScanPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let parsedToken = token;
      try { const parsed = JSON.parse(token); parsedToken = parsed.token; } catch {}
      const { data } = await attendanceAPI.scanQR({ token: parsedToken });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Scan gagal');
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>📱 Scan QR Absensi</h1></div>
      <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>📷</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
          Masukkan kode QR yang diberikan guru Anda, atau scan QR code dari kamera.
        </p>
        <div className="form-group">
          <input className="form-input" placeholder="Paste QR token dari guru..." value={token} onChange={e => setToken(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleScan()} />
        </div>
        <button className="btn btn--primary btn--block" onClick={handleScan} disabled={loading}>
          {loading ? 'Memproses...' : '✅ Submit Absensi'}
        </button>

        {result && (
          <div style={{ marginTop: 20, padding: 16, background: 'var(--success-light)', borderRadius: 'var(--radius-md)', color: '#065f46' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
            <strong>{result.message}</strong>
            {result.attendance && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Status: {result.attendance.status} | Jam: {result.attendance.checkInTime || result.attendance.checkOutTime}</p>}
          </div>
        )}
        {error && (
          <div style={{ marginTop: 20, padding: 16, background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', color: '#991b1b' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>❌</div>
            <strong>{error}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
