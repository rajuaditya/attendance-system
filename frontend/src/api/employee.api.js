import api from './axios';

export const employeeApi = {
  list: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (payload) => api.post('/employees', payload),
  update: (id, payload) => api.put(`/employees/${id}`, payload),
  remove: (id) => api.delete(`/employees/${id}`),
  toggleStatus: (id) => api.patch(`/employees/${id}/status`),
  getQrCode: (id) => api.get(`/employees/${id}/qrcode`),
  rotateQrCode: (id) => api.post(`/employees/${id}/qrcode/rotate`),
  uploadPhoto: (id, formData) =>
    api.post(`/employees/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const metaApi = {
  departments: () => api.get('/meta/departments'),
  designations: () => api.get('/meta/designations'),
  createDepartment: (payload) => api.post('/meta/departments', payload),
  createDesignation: (payload) => api.post('/meta/designations', payload),
};
