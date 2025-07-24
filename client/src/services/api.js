import axios from 'axios'

// Configuration de base d'Axios
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API d'authentification
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  verify: () => api.get('/auth/verify'),
  refresh: () => api.post('/auth/refresh'),
}

// API des produits
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories/list'),
}

// API du stock
export const stockAPI = {
  getMovements: (params) => api.get('/stock/movements', { params }),
  createMovement: (data) => api.post('/stock/movements', data),
  getAlerts: (params) => api.get('/stock/alerts', { params }),
  markAlertAsRead: (id) => api.put(`/stock/alerts/${id}/read`),
  getLowStock: () => api.get('/stock/low-stock'),
}

// API des fournisseurs
export const suppliersAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
}

// API des utilisateurs
export const usersAPI = {
  getAll: () => api.get('/users'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePassword: (data) => api.put('/users/password', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.put(`/users/${id}/deactivate`),
  activate: (id) => api.put(`/users/${id}/activate`),
}

// API du tableau de bord
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getAlerts: () => api.get('/dashboard/alerts'),
  getCharts: (params) => api.get('/dashboard/charts', { params }),
}

export default api