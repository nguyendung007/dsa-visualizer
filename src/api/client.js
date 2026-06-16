import axios from 'axios'

//1. Cấu hình URL gốc (Base URL) và Proxy
export const api = axios.create({
  baseURL: '/api',
})

// 2.Tự gắn JWT vào mọi request nếu đang đăng nhập
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 3.Nếu token hết hạn (401) thì tự logout
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)