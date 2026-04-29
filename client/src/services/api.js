import axios from 'axios';

const API_BASE = 'https://absensiku-production.up.railway.app/api/v1';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Attendance
export const attendanceAPI = {
  generateQR: (data) => api.post('/attendance/qr/generate', data),
  scanQR: (data) => api.post('/attendance/qr/scan', data),
  manual: (data) => api.post('/attendance/manual', data),
  bulk: (data) => api.post('/attendance/bulk', data),
  getToday: (params) => api.get('/attendance/today', { params }),
  getHistory: (studentId, params) => api.get(`/attendance/history/${studentId}`, { params }),
};

// Students
export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

// Teachers
export const teacherAPI = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
};

// Classes
export const classAPI = {
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
};

// Schedules
export const scheduleAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

// Reports
export const reportAPI = {
  daily: (params) => api.get('/reports/daily', { params }),
  monthly: (params) => api.get('/reports/monthly', { params }),
  student: (id) => api.get(`/reports/student/${id}`),
  dashboard: () => api.get('/reports/dashboard'),
};

// Parent
export const parentAPI = {
  getChildren: () => api.get('/parent/children'),
  getChildAttendance: (childId) => api.get(`/parent/children/${childId}/attendance`),
};

export default api;
