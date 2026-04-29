import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const menuItems = {
  ADMIN: [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/attendance/qr', icon: '📱', label: 'QR Absensi' },
    { path: '/attendance/manual', icon: '✏️', label: 'Absensi Manual' },
    { path: '/students', icon: '🎓', label: 'Data Siswa' },
    { path: '/teachers', icon: '👨‍🏫', label: 'Data Guru' },
    { path: '/classes', icon: '🏫', label: 'Data Kelas' },
    { path: '/schedules', icon: '📅', label: 'Jadwal' },
    { path: '/reports/daily', icon: '📋', label: 'Laporan Harian' },
    { path: '/reports/monthly', icon: '📈', label: 'Laporan Bulanan' },
  ],
  GURU: [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/attendance/qr', icon: '📱', label: 'QR Absensi' },
    { path: '/attendance/manual', icon: '✏️', label: 'Absensi Manual' },
    { path: '/reports/daily', icon: '📋', label: 'Laporan Harian' },
    { path: '/reports/monthly', icon: '📈', label: 'Laporan Bulanan' },
  ],
  SISWA: [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/attendance/scan', icon: '📱', label: 'Scan QR' },
  ],
  KEPALA_SEKOLAH: [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/reports/daily', icon: '📋', label: 'Laporan Harian' },
    { path: '/reports/monthly', icon: '📈', label: 'Laporan Bulanan' },
  ],
  ORANG_TUA: [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  ],
};

export default function Sidebar({ isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const items = menuItems[user?.role] || [];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="sidebar__logo-icon">📚</div>
            <span className="sidebar__logo-text">AbsensiKu</span>
          </div>
          <button className="sidebar__close" onClick={onToggle}>✕</button>
        </div>

        <nav className="sidebar__nav">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              onClick={() => window.innerWidth < 768 && onToggle()}
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              <span className="sidebar__link-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">{user?.name?.[0] || 'U'}</div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{user?.name}</div>
              <div className="sidebar__user-role">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button className="sidebar__logout" onClick={logout}>🚪 Keluar</button>
        </div>
      </aside>
    </>
  );
}
