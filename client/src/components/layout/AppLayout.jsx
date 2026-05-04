import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MdDarkMode, MdLightMode } from 'react-icons/md';
import Sidebar from './Sidebar';
import './Layout.css';

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function getDateStr() {
  const d = new Date();
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="main-content">
        <header className="header">
          <div className="header__left">
            <button className="header__menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <span className="header__title" style={{ letterSpacing: '1px' }}>PRESENSIO</span>
          </div>
          <div className="header__right">
            <span className="header__date">{getDateStr()}</span>
            <button className="header__theme-btn" onClick={toggleTheme} title="Toggle tema">
              {theme === 'light' ? <MdDarkMode size={20} /> : <MdLightMode size={20} />}
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
