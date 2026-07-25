import api from './axios';

export const attendanceApi = {
  today: () => api.get('/attendance/today'),
  myHistory: (params) => api.get('/attendance/history', { params }),
  all: (params) => api.get('/attendance', { params }),
  manualMark: (payload) => api.post('/attendance/manual', payload),
  requestLeave: (payload) => api.post('/attendance/leave', payload),
  listLeaves: (params) => api.get('/attendance/leave', { params }),
  decideLeave: (id, decision) => api.patch(`/attendance/leave/${id}/decision`, { decision }),
};

export const qrApi = {
  scan: (payload, scanType) => api.post('/qr/scan', { payload, scanType }),
  scanLogs: (params) => api.get('/qr/scan-logs', { params }),
};

export const dashboardApi = {
  admin: () => api.get('/dashboard/admin'),
  adminCalendar: (year, month) => api.get('/dashboard/admin/calendar', { params: { year, month } }),
  employee: () => api.get('/dashboard/employee'),
};

export const reportApi = {
  get: (params) => api.get('/reports', { params }),
  employee: (id, params) => api.get(`/reports/employee/${id}`, { params }),
  exportExcelUrl: (params) => `/api/reports/export/excel?${new URLSearchParams(params).toString()}`,
  exportPdfUrl: (params) => `/api/reports/export/pdf?${new URLSearchParams(params).toString()}`,
};
