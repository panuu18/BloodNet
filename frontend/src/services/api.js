import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRoute = requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password') ||
      requestUrl.includes('/auth/donor-rules');

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  getDonorRules: () => api.get('/auth/donor-rules'),
  getProfile: () => api.get('/auth/profile'),
};

export const userAPI = {
  getProfile: () => api.get('/auth/profile'),
  getDonationHistory: () => api.get('/users/donation-history'),
  updateAvailability: (isAvailable) => api.put('/users/availability', { isAvailable }),
  updateProfile: (formData) => api.put('/users/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  }),
  searchDonors: (params) => api.get('/users/search', { params }),
  getNotifications: (params) => api.get('/users/notifications', { params }),
  markNotificationRead: (notificationId) => api.put(`/users/notifications/${notificationId}/read`),
  markAllNotificationsRead: () => api.put('/users/notifications/read-all'),
  getNearbyDonationCamps: (params) => api.get('/users/donation-camps', { params }),
  getNearbyBloodStocks: (params) => api.get('/users/blood-stocks', { params }),
  registerForDonationCamp: (campId) => api.post(`/users/donation-camps/${campId}/register`),
};

export const requestAPI = {
  createRequest: (data) => api.post('/requests/create', data),
  getMyRequests: () => api.get('/requests/my'),
  getNearbyRequests: (params) => api.get('/requests/nearby', { params }),
  respondToRequest: (requestId, data) => api.put(`/requests/${requestId}/respond`, data),
  getRequestDetails: (requestId) => api.get(`/requests/${requestId}`),
  deleteRequest: (requestId) => api.delete(`/requests/${requestId}`),
};

export const hospitalAPI = {
  getNearbyHospitals: (params) => api.get('/hospitals/nearby', { params }),
  getHospitalInventory: () => api.get('/hospitals/inventory'),
  updateInventory: (data) => api.put('/hospitals/inventory', data),
  getAllBloodRequests: () => api.get('/hospitals/requests'),
  getHospitalStats: () => api.get('/hospitals/stats'),
  getRequestHistory: () => api.get('/hospitals/history'),
  createDonationCamp: (data) => api.post('/hospitals/camps', data),
  updateHospitalProfile: (data) => api.put('/hospitals/profile', data),
  generateExcelReport: () => api.get('/hospitals/report/excel', { responseType: 'blob' }),
  getInventoryReport: (params) => api.get('/hospitals/report/inventory', { params }),
};

export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (notificationId) => api.put(`/notifications/${notificationId}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  getNotificationStats: () => api.get('/notifications/stats'),
};

export const certificateAPI = {
  generateCertificate: (donationId) => api.post(`/certificates/generate/${donationId}`),
  getMyCertificates: () => api.get('/certificates/my-certificates'),
  getCertificate: (certificateId) => api.get(`/certificates/${certificateId}`),
  shareCertificate: (certificateId) => api.post(`/certificates/${certificateId}/share`),
  downloadCertificate: (certificateId) => api.get(`/certificates/${certificateId}/download`, { responseType: 'blob' }),
};


export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getMetrics: () => api.get('/admin/metrics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserStats: () => api.get('/admin/users/stats'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`),
  deactivateUser: (id) => api.post(`/admin/users/${id}/deactivate`),
  getRequests: (params) => api.get('/admin/requests', { params }),
  getRequestStats: () => api.get('/admin/requests/stats'),
  updateRequestStatus: (id, data) => api.put(`/admin/requests/${id}/status`, data),
  deleteRequest: (id) => api.delete(`/admin/requests/${id}`),
  getEmergencyRequests: () => api.get('/admin/requests/emergency'),
  getHospitals: () => api.get('/admin/hospitals'),
  updateHospital: (id, data) => api.put(`/admin/hospitals/${id}`, data),
  deleteHospital: (id) => api.delete(`/admin/hospitals/${id}`),
  getAlerts: (params) => api.get('/admin/alerts', { params }),
  createAlert: (data) => api.post('/admin/alerts', data),
  resolveAlert: (id) => api.post(`/admin/alerts/${id}/resolve`),
  deleteAlert: (id) => api.delete(`/admin/alerts/${id}`),
  getAuditTrail: () => api.get('/admin/audit/trail'),
  getSecurityLogs: () => api.get('/admin/security/logs'),
  emergencyBroadcast: (data) => api.post('/admin/emergency/broadcast', data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getDashboardAnalytics: () => api.get('/admin/analytics/dashboard'),
};

export default api;
