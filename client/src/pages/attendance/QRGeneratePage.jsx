import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI, classAPI } from '../../services/api';
import '../../components/ui/components.css';
import { MdQrCodeScanner, MdCheckCircle, MdCancel, MdRefresh, MdPlayArrow, MdAssignment } from 'react-icons/md';

export default function QRGeneratePage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [type, setType] = useState('CHECK_IN');
  const [qrData, setQrData] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isExtra, setIsExtra] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef(null);
  const fullscreenRef = useRef(null);
  const classRef = useRef(selectedClass);
  const typeRef = useRef(type);
  const autoRefreshRef = useRef(autoRefresh);
  const isExtraRef = useRef(isExtra);

  // Keep refs in sync
  useEffect(() => { classRef.current = selectedClass; }, [selectedClass]);
  useEffect(() => { typeRef.current = type; }, [type]);
  useEffect(() => { autoRefreshRef.current = autoRefresh; }, [autoRefresh]);
  useEffect(() => { isExtraRef.current = isExtra; }, [isExtra]);

  useEffect(() => {
    classAPI.getAll().then(r => {
      setClasses(r.data.classes);
      const defaultClass = user.roleData?.homeroomClassId || (r.data.classes.length > 0 ? r.data.classes[0].id : '');
      setSelectedClass(defaultClass);
      classRef.current = defaultClass;
    });
    return () => clearInterval(timerRef.current);
  }, []);

  const generateQR = async (classIdOverride) => {
    const classId = classIdOverride || classRef.current;
    const currentType = typeRef.current;
    const currentIsExtra = isExtraRef.current;
    if (!classId) return;
    setError('');
    try {
      const { data } = await attendanceAPI.generateQR({ classId, type: currentType, isExtra: currentIsExtra });
      setQrData(data.session);
      setCountdown(30);
      setCopied(false);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (autoRefreshRef.current) {
              generateQR();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) {
      setError(e.response?.data?.error || 'Gagal generate QR. Coba lagi.');
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      fullscreenRef.current?.requestFullscreen?.() ||
      fullscreenRef.current?.webkitRequestFullscreen?.();
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const copyToken = () => {
    if (qrData?.token) {
      navigator.clipboard.writeText(qrData.token).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      });
    }
  };

  const className = classes.find(c => c.id === selectedClass)?.name || '';
  const timerPercent = (countdown / 30) * 100;
  const timerColor = countdown <= 5 ? 'var(--danger)' : countdown <= 10 ? 'var(--warning)' : 'var(--success)';

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="flex items-center gap-2"><MdQrCodeScanner className="inline-block" /> QR Absensi</h1>
        {qrData && (
          <button className="btn btn--secondary" onClick={toggleFullscreen}>
            {isFullscreen ? '✕ Keluar Fullscreen' : '🖥️ Mode Proyektor'}
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="card" style={{ maxWidth: 560, margin: '0 auto', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Kelas</label>
            <select className="form-input form-select" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tipe Absensi</label>
            <select className="form-input form-select" value={type} onChange={e => setType(e.target.value)}>
              <option value="CHECK_IN"><MdCheckCircle className="text-green-500 inline" /> Masuk</option>
              <option value="CHECK_OUT"><MdCancel className="text-red-500 inline" /> Keluar</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              checked={isExtra} 
              onChange={e => setIsExtra(e.target.checked)} 
              style={{ width: 16, height: 16 }}
            />
            Ini adalah Sesi Tambahan (Kelas Pengganti / Ekstrakurikuler di luar jadwal reguler)
          </label>
        </div>
        <button className="btn btn--primary btn--block btn--lg flex items-center justify-center gap-2" onClick={() => generateQR(selectedClass)}>
          {qrData ? <><MdRefresh size={20} /> Generate Ulang</> : <><MdPlayArrow size={20} /> Mulai Generate QR</>}
        </button>
        {error && (
          <div style={{ marginTop: 12, padding: 10, background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', color: '#991b1b', fontSize: '0.85rem', fontWeight: 500 }}>
            <MdCancel className="inline-block" /> {error}
          </div>
        )}
      </div>

      {/* QR Display */}
      {qrData && (
        <div ref={fullscreenRef} className={`card ${isFullscreen ? 'qr-fullscreen' : ''}`} style={{ maxWidth: isFullscreen ? '100%' : 560, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: isFullscreen ? '40px 20px' : '20px 0' }}>
            {/* Header Info */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                background: type === 'CHECK_IN' ? 'var(--success-light)' : 'var(--danger-light)',
                color: type === 'CHECK_IN' ? '#065f46' : '#991b1b',
                fontWeight: 700,
                fontSize: isFullscreen ? '1.3rem' : '0.9rem',
                marginBottom: 8
              }}>
                {type === 'CHECK_IN' ? <><MdCheckCircle className="text-green-500 inline" /> ABSENSI MASUK</> : <><MdCancel className="text-red-500 inline" /> ABSENSI KELUAR</>}
              </div>
              <h2 style={{ fontSize: isFullscreen ? '2.5rem' : '1.3rem', marginTop: 8 }}>
                {className}
              </h2>
            </div>

            {/* QR Code */}
            <div style={{
              display: 'inline-block',
              padding: isFullscreen ? 24 : 16,
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              marginBottom: 20
            }}>
              <img
                src={qrData.qrCode}
                alt="QR Code"
                style={{
                  display: 'block',
                  width: isFullscreen ? 'min(50vh, 400px)' : 260,
                  height: isFullscreen ? 'min(50vh, 400px)' : 260
                }}
              />
            </div>

            {/* Timer */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                width: isFullscreen ? 300 : 200,
                height: 8,
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-full)',
                margin: '0 auto 8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${timerPercent}%`,
                  height: '100%',
                  background: timerColor,
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 1s linear, background 0.3s'
                }} />
              </div>
              <p style={{
                fontSize: isFullscreen ? '1.5rem' : '1rem',
                fontWeight: 700,
                color: timerColor
              }}>
                {countdown > 0 ? `⏱️ ${countdown} detik` : <><MdRefresh className="inline-block" /> Refreshing...</>}
              </p>
              <p style={{
                fontSize: isFullscreen ? '1rem' : '0.8rem',
                color: 'var(--text-muted)',
                marginTop: 4
              }}>
                QR berubah otomatis setiap 30 detik untuk keamanan
              </p>
            </div>

            {/* Instruction for students */}
            <div style={{
              padding: isFullscreen ? '16px 24px' : '12px 16px',
              background: 'var(--primary-50)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              fontSize: isFullscreen ? '1.1rem' : '0.85rem',
              color: 'var(--primary-dark)'
            }}>
              <MdQrCodeScanner className="inline-block" /> Siswa: Buka <strong>AbsensiKu</strong> → <strong>Scan QR</strong> → Arahkan kamera ke QR ini
            </div>

            {/* Action buttons (hidden in fullscreen) */}
            {!isFullscreen && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn--secondary btn--sm" onClick={toggleFullscreen}>
                  🖥️ Tampilkan Fullscreen (Proyektor)
                </button>
                <button className="btn btn--secondary btn--sm" onClick={copyToken}>
                  {copied ? <><MdCheckCircle className="inline-block" /> Token Disalin!</> : <><MdAssignment className="inline-block" /> Salin Token</>}
                </button>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} />
                  Auto-refresh
                </label>
              </div>
            )}

            {/* Copied token message */}
            {copied && !isFullscreen && (
              <div style={{
                marginTop: 12,
                padding: '10px 16px',
                background: 'var(--success-light)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: '#065f46'
              }}>
                <MdCheckCircle className="inline-block" /> Token telah disalin! Bagikan ke siswa yang tidak bisa scan kamera.
                <br />
                <span style={{ color: '#047857', fontWeight: 600 }}>
                  ⚠️ Token hanya berlaku {countdown} detik lagi.
                </span>
              </div>
            )}

            {/* Fullscreen exit button */}
            {isFullscreen && (
              <button
                onClick={toggleFullscreen}
                style={{
                  position: 'fixed',
                  top: 20,
                  right: 20,
                  padding: '8px 16px',
                  background: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  zIndex: 10
                }}
              >
                ✕ Keluar Fullscreen
              </button>
            )}
          </div>
        </div>
      )}

      {/* Best Practice Info */}
      {!qrData && (
        <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
          <h3 style={{ marginBottom: 12 }}>💡 Cara Penggunaan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>1️⃣</span>
              <div>
                <strong>Pilih kelas dan tipe absensi</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>
                  Pilih kelas yang sedang Anda ajar dan tipe (masuk/keluar)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>2️⃣</span>
              <div>
                <strong>Tampilkan QR di proyektor</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>
                  Klik "Mode Proyektor" untuk fullscreen. QR otomatis berubah tiap 30 detik.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.5rem' }}>3️⃣</span>
              <div>
                <strong>Siswa scan dari HP</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 2 }}>
                  Siswa buka AbsensiKu → Scan QR → Absensi otomatis tercatat
                </p>
              </div>
            </div>
            <div style={{ padding: 12, background: 'var(--warning-light)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#92400e' }}>
              🔒 <strong>Keamanan:</strong> QR berubah setiap 30 detik sehingga screenshot/foto QR tidak bisa digunakan untuk titip absen. Siswa harus scan langsung di kelas.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
