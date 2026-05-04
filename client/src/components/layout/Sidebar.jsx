import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  MdDashboard, 
  MdQrCodeScanner, 
  MdEditDocument, 
  MdSchool, 
  MdGroup, 
  MdClass, 
  MdCalendarMonth, 
  MdAssignment, 
  MdInsertChartOutlined,
  MdLogout
} from 'react-icons/md';
import './Layout.css';

const menuItems = {
  ADMIN: [
    { path: '/dashboard', icon: <MdDashboard size={20} />, label: 'Dashboard' },
    { path: '/attendance/qr', icon: <MdQrCodeScanner size={20} />, label: 'QR Absensi' },
    { path: '/attendance/manual', icon: <MdEditDocument size={20} />, label: 'Absensi Manual' },
    { path: '/students', icon: <MdSchool size={20} />, label: 'Data Siswa' },
    { path: '/teachers', icon: <MdGroup size={20} />, label: 'Data Guru' },
    { path: '/classes', icon: <MdClass size={20} />, label: 'Data Kelas' },
    { path: '/schedules', icon: <MdCalendarMonth size={20} />, label: 'Jadwal' },
    { path: '/reports/daily', icon: <MdAssignment size={20} />, label: 'Laporan Harian' },
    { path: '/reports/monthly', icon: <MdInsertChartOutlined size={20} />, label: 'Laporan Bulanan' },
  ],
  GURU: [
    { path: '/dashboard', icon: <MdDashboard size={20} />, label: 'Dashboard' },
    { path: '/attendance/qr', icon: <MdQrCodeScanner size={20} />, label: 'QR Absensi' },
    { path: '/attendance/manual', icon: <MdEditDocument size={20} />, label: 'Absensi Manual' },
    { path: '/reports/daily', icon: <MdAssignment size={20} />, label: 'Laporan Harian' },
    { path: '/reports/monthly', icon: <MdInsertChartOutlined size={20} />, label: 'Laporan Bulanan' },
  ],
  SISWA: [
    { path: '/dashboard', icon: <MdDashboard size={20} />, label: 'Dashboard' },
    { path: '/attendance/scan', icon: <MdQrCodeScanner size={20} />, label: 'Scan QR' },
  ],
  KEPALA_SEKOLAH: [
    { path: '/dashboard', icon: <MdDashboard size={20} />, label: 'Dashboard' },
    { path: '/reports/daily', icon: <MdAssignment size={20} />, label: 'Laporan Harian' },
    { path: '/reports/monthly', icon: <MdInsertChartOutlined size={20} />, label: 'Laporan Bulanan' },
  ],
  ORANG_TUA: [
    { path: '/dashboard', icon: <MdDashboard size={20} />, label: 'Dashboard' },
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
            <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <span className="sidebar__logo-text" style={{ letterSpacing: '1px' }}>PRESENSIO</span>
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
              <span className="sidebar__link-icon flex items-center justify-center">{item.icon}</span>
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
          <button className="sidebar__logout flex items-center justify-center gap-2" onClick={logout}>
            <MdLogout size={20} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
