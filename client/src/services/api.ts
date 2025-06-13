import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    console.log('API Request - Token from localStorage:', token)
    
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`
      console.log('API Request - Authorization header set')
    } else {
      console.log('API Request - No valid token found')
      delete config.headers.Authorization
    }
    return config
  },
  (error) => {
    console.error('API Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response success:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Error:', error.response || error)
    
    // Log detailed error information
    if (error.response) {
      console.error('Error Status:', error.response.status)
      console.error('Error Data:', error.response.data)
      console.error('Error Headers:', error.response.headers)
    }
    
    if (error.response?.status === 401) {
      console.log('401 error detected, clearing auth data')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) => {
    console.log('API - Login request:', credentials.email)
    return api.post('/login', credentials)
  },
  logout: () => api.post('/logout'),
  me: () => {
    console.log('API - Getting current user')
    return api.get('/user')
  },
}

// Users API
export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: number) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.put(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
  getRoles: () => api.get('/user-roles'),
}

// Roles API
export const rolesAPI = {
  getAll: (params?: any) => api.get('/roles', { params }),
  getById: (id: number) => api.get(`/roles/${id}`),
  create: (data: any) => api.post('/roles', data),
  update: (id: number, data: any) => api.put(`/roles/${id}`, data),
  delete: (id: number) => api.delete(`/roles/${id}`),
}

// Products API
export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  adjustStock: (id: number, data: any) => api.post(`/products/${id}/adjust-stock`, data),
  getLowStock: () => api.get('/products/reports/low-stock'),
}

// Categories API
export const categoriesAPI = {
  getAll: (params?: any) => api.get('/categories', { params }),
  getById: (id: number) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
}

// Transactions API
export const transactionsAPI = {
  getAll: (params?: any) => api.get('/transactions', { params }),
  getById: (id: number) => api.get(`/transactions/${id}`),
  create: (data: any) => api.post('/transactions', data),
  getDailySales: (date?: string) => api.get('/transactions/reports/daily', { params: { date } }),
  getMonthlySales: (month?: number, year?: number) => api.get('/transactions/reports/monthly', { params: { month, year } }),
}

// Discounts API
export const discountsAPI = {
  getAll: (params?: any) => api.get('/discounts', { params }),
  getActive: () => api.get('/discounts/active/list'),
  getById: (id: number) => api.get(`/discounts/${id}`),
  create: (data: any) => api.post('/discounts', data),
  update: (id: number, data: any) => api.put(`/discounts/${id}`, data),
  delete: (id: number) => api.delete(`/discounts/${id}`),
}

// Feedback API
export const feedbackAPI = {
  getAll: (params?: any) => api.get('/feedback', { params }),
  create: (data: any) => api.post('/feedback', data),
  getAnalytics: (params?: any) => api.get('/feedback/analytics/summary', { params }),
}

export default api