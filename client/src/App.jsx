import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import QRGeneratePage from './pages/attendance/QRGeneratePage';
import QRScanPage from './pages/attendance/QRScanPage';
import ManualAttendancePage from './pages/attendance/ManualAttendancePage';
import StudentManagement from './pages/admin/StudentManagement';
import TeacherManagement from './pages/admin/TeacherManagement';
import ClassManagement from './pages/admin/ClassManagement';
import ScheduleManagement from './pages/admin/ScheduleManagement';
import DailyReportPage from './pages/reports/DailyReportPage';
import MonthlyReportPage from './pages/reports/MonthlyReportPage';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance/qr" element={<ProtectedRoute roles={['GURU', 'ADMIN']}><QRGeneratePage /></ProtectedRoute>} />
        <Route path="attendance/scan" element={<ProtectedRoute roles={['SISWA']}><QRScanPage /></ProtectedRoute>} />
        <Route path="attendance/manual" element={<ProtectedRoute roles={['GURU', 'ADMIN']}><ManualAttendancePage /></ProtectedRoute>} />
        <Route path="students" element={<ProtectedRoute roles={['ADMIN']}><StudentManagement /></ProtectedRoute>} />
        <Route path="teachers" element={<ProtectedRoute roles={['ADMIN']}><TeacherManagement /></ProtectedRoute>} />
        <Route path="classes" element={<ProtectedRoute roles={['ADMIN']}><ClassManagement /></ProtectedRoute>} />
        <Route path="schedules" element={<ProtectedRoute roles={['ADMIN']}><ScheduleManagement /></ProtectedRoute>} />
        <Route path="reports/daily" element={<ProtectedRoute roles={['GURU', 'ADMIN', 'KEPALA_SEKOLAH']}><DailyReportPage /></ProtectedRoute>} />
        <Route path="reports/monthly" element={<ProtectedRoute roles={['GURU', 'ADMIN', 'KEPALA_SEKOLAH']}><MonthlyReportPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
