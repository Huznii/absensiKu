import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { attendanceAPI } from '../../services/api';
import '../../components/ui/components.css';

export default function QRScanPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    }, false);

    scanner.render(onScanSuccess, onScanFailure);

    async function onScanSuccess(decodedText) {
      // Avoid multiple scans while processing
      if (loading) return;
      
      try {
        scanner.clear(); // Stop scanning after success
        await processToken(decodedText);
      } catch (err) {
        console.error("Error clearing scanner", err);
      }
    }

    function onScanFailure(error) {
      // Silently ignore failures to find QR code in frame
    }

    return () => {
      scanner.clear().catch(e => console.error("Scanner cleanup failed", e));
    };
  }, []);

  const processToken = async (scannedToken) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      let parsedToken = scannedToken;
      try {
        const parsed = JSON.parse(scannedToken);
        parsedToken = parsed.token || scannedToken;
      } catch {
        // Not a JSON string, use as is
      }
      const { data } = await attendanceAPI.scanQR({ token: parsedToken });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Scan gagal. Pastikan QR code valid dan belum kedaluwarsa.');
    }
    setLoading(false);
  };

  const handleManualSubmit = () => {
    if (!token.trim()) return;
    processToken(token);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header"><h1>📱 Scan QR Absensi</h1></div>
      <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        
        {/* Scanner Container */}
        <div id="reader" style={{ width: '100%', marginBottom: 20 }}></div>

        {!result && !error && (
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Arahkan kamera ke QR Code yang ditampilkan guru Anda.
          </p>
        )}

        {/* Fallback Manual Input */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 20 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            Atau masukkan kode manual jika kamera tidak berfungsi
          </p>
          <div className="form-group">
            <input 
              className="form-input" 
              placeholder="Paste QR token dari guru..." 
              value={token} 
              onChange={e => setToken(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleManualSubmit()} 
            />
          </div>
          <button className="btn btn--secondary btn--block" onClick={handleManualSubmit} disabled={loading}>
            {loading ? 'Memproses...' : 'Submit Manual'}
          </button>
        </div>

        {result && (
          <div style={{ marginTop: 20, padding: 16, background: 'var(--success-light)', borderRadius: 'var(--radius-md)', color: '#065f46' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
            <strong>{result.message}</strong>
            {result.attendance && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Status: {result.attendance.status} | Jam: {result.attendance.checkInTime || result.attendance.checkOutTime}</p>}
            <button className="btn btn--primary btn--sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>Scan Lagi</button>
          </div>
        )}
        
        {error && (
          <div style={{ marginTop: 20, padding: 16, background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', color: '#991b1b' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>❌</div>
            <strong>{error}</strong>
            <button className="btn btn--danger btn--sm" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>Coba Lagi</button>
          </div>
        )}
      </div>
    </div>
  );
}
