import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceAPI } from '../../services/api';
import '../../components/ui/components.css';
import { MdQrCodeScanner, MdPhotoCamera, MdVideocam, MdCheckCircle, MdCancel } from 'react-icons/md';

export default function QRScanPage() {
  const [token, setToken] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startCamera = async () => {
    setError('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('reader');
      }
      setCameraActive(true);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (loading) return;
          try {
            await scannerRef.current.stop();
            setCameraActive(false);
            await processToken(decodedText);
          } catch (err) {
            console.error("Error stopping scanner", err);
          }
        },
        () => {} // ignore scan failures
      );
    } catch (err) {
      console.error(err);
      setError('Gagal mengakses kamera. Pastikan Anda memberi izin kamera di browser Anda.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        setCameraActive(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
      <div className="page-header"><h1 className="flex items-center gap-2"><MdQrCodeScanner className="inline-block" /> Scan QR Absensi</h1></div>
      <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        
        {/* Scanner Container */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div id="reader" style={{ width: '100%', maxWidth: 300, display: cameraActive ? 'block' : 'none', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', border: cameraActive ? '2px solid var(--primary)' : 'none' }}></div>
          
          {cameraActive && (
             <button className="btn btn--secondary btn--sm" style={{ marginTop: 16 }} onClick={stopCamera}>
               Batalkan Kamera
             </button>
          )}

          {!cameraActive && !result && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}><MdPhotoCamera className="inline-block" /></div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
                Masukkan kode QR yang diberikan guru Anda, atau scan menggunakan kamera.
              </p>
              <button className="btn btn--primary" onClick={startCamera}>
                <MdVideocam className="inline-block" /> Buka Kamera
              </button>
            </div>
          )}
        </div>

        {/* Fallback Manual Input */}
        {!cameraActive && !result && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20, marginTop: 24 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Atau masukkan kode token manual
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
              {loading ? 'Memproses...' : '<MdCheckCircle className="inline-block" /> Submit Manual'}
            </button>
          </div>
        )}

        {result && (
          <div style={{ marginTop: 20, padding: 16, background: 'var(--success-light)', borderRadius: 'var(--radius-md)', color: '#065f46' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}><MdCheckCircle className="inline-block" /></div>
            <strong>{result.message}</strong>
            {result.attendance && <p style={{ fontSize: '0.85rem', marginTop: 4 }}>Status: {result.attendance.status} | Jam: {result.attendance.checkInTime || result.attendance.checkOutTime}</p>}
            <button className="btn btn--primary btn--sm" style={{ marginTop: 16 }} onClick={() => { setResult(null); setToken(''); }}>Kembali</button>
          </div>
        )}
        
        {error && (
          <div style={{ marginTop: 20, padding: 16, background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', color: '#991b1b' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}><MdCancel className="inline-block" /></div>
            <strong>{error}</strong>
            <button className="btn btn--danger btn--sm" style={{ marginTop: 16 }} onClick={() => setError('')}>Tutup</button>
          </div>
        )}
      </div>
    </div>
  );
}
