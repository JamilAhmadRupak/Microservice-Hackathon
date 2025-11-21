import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => apiClient.post('/api/users/register', data),
  login: (data) => apiClient.post('/api/users/login', data),
  getProfile: () => apiClient.get('/api/users/profile'),
  getDonations: () => apiClient.get('/api/pledges/user/donations'),
};

// Campaign API
export const campaignAPI = {
  getAll: (params) => apiClient.get('/api/campaigns', { params }),
  getById: (id) => apiClient.get(`/api/campaigns/${id}`),
  create: (data) => apiClient.post('/api/campaigns', data),
  update: (id, data) => apiClient.put(`/api/campaigns/${id}`, data),
};

// Pledge API
export const pledgeAPI = {
  create: (data, idempotencyKey) => 
    apiClient.post('/api/pledges', data, {
      headers: { 'X-Idempotency-Key': idempotencyKey }
    }),
  getById: (id) => apiClient.get(`/api/pledges/${id}`),
  getByCampaign: (campaignId, params) => 
    apiClient.get(`/api/pledges/campaign/${campaignId}`, { params }),
};

// Payment API
export const paymentAPI = {
  getTransaction: (pledgeId) => apiClient.get(`/api/payments/transaction/${pledgeId}`),
  capturePayment: (paymentIntentId) => 
    apiClient.post(`/api/payments/capture/${paymentIntentId}`),
  getCheckout: (paymentIntentId) => 
    apiClient.get(`/api/payments/checkout/${paymentIntentId}`),
};

// Admin API
export const adminAPI = {
  getAllCampaigns: (params) => apiClient.get('/api/admin/campaigns', { params }),
  verifyCampaign: (id, data) => apiClient.put(`/api/admin/campaigns/${id}/verify`, data),
  getTransactions: (params) => apiClient.get('/api/admin/transactions', { params }),
  getDashboard: () => apiClient.get('/api/admin/dashboard'),
  getAllPledges: (params) => apiClient.get('/api/admin/pledges', { params }),
  approvePledge: (id) => apiClient.put(`/api/admin/pledges/${id}/approve`),
  rejectPledge: (id, reason) => apiClient.put(`/api/admin/pledges/${id}/reject`, { reason }),
};

export default apiClient;
