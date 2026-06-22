import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getMasters: () => api.get('/users/masters'),
};

// Devices API
export const devicesAPI = {
  getAll: (params) => api.get('/devices', { params }),
  getById: (id) => api.get(`/devices/${id}`),
  create: (data) => api.post('/devices', data),
  update: (id, data) => api.put(`/devices/${id}`, data),
  delete: (id) => api.delete(`/devices/${id}`),
  getHistory: (id) => api.get(`/devices/${id}/history`),
};

// Orders API
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  addPart: (id, data) => api.post(`/orders/${id}/parts`, data),
  addRepairType: (id, data) => api.post(`/orders/${id}/repair-types`, data),
  getTimeline: (id) => api.get(`/orders/${id}/timeline`),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
};

// Parts API
export const partsAPI = {
  getAll: (params) => api.get('/parts', { params }),
  getById: (id) => api.get(`/parts/${id}`),
  create: (data) => api.post('/parts', data),
  update: (id, data) => api.put(`/parts/${id}`, data),
  delete: (id) => api.delete(`/parts/${id}`),
  getLowStock: () => api.get('/parts/low-stock'),
};

// Repair types API
export const repairTypesAPI = {
  getAll: () => api.get('/repair-types'),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getOrdersByPeriod: (params) => api.get('/analytics/orders-by-period', { params }),
  getFailureStats: () => api.get('/analytics/failure-stats'),
  getMastersPerformance: () => api.get('/analytics/masters-performance'),
};

// Predictions API
export const predictionsAPI = {
  predictML: (deviceId) => api.post(`/predictions/ml/${deviceId}`),
  predictGemini: (deviceId) => api.post(`/predictions/gemini/${deviceId}`),
  predictCombined: (deviceId) => api.post(`/predictions/combined/${deviceId}`),
  getDevicePredictions: (deviceId) => api.get(`/predictions/device/${deviceId}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};
