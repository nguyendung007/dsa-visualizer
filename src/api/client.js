import axios from 'axios'

const ENABLE_AUTO_LOGOUT = false 

export const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && ENABLE_AUTO_LOGOUT) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    if (err.response?.status === 401) {
      console.warn('🔴 401 Error:', err.config.url)
    }
    
    return Promise.reject(err)
  }
)