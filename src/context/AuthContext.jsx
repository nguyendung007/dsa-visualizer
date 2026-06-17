import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)  // kiểm tra token khi load lại trang

  // Khi app khởi động: nếu có token trong localStorage thì verify với backend
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setLoading(false); return }

    authApi.me()
      .then(res => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    // 1. Kiểm tra nếu là tài khoản test
    if (email === 'test_account@gmail.com' && password === '123456') {
      const fakeUserData = { id: 'test-id-123', email: 'test_account@gmail.com', role: 'admin' }
      
      localStorage.setItem('token', 'fake-jwt-token-for-test') // Tạo token giả để khi F5 không bị mất login
      setUser(fakeUserData)
      
      return { user: fakeUserData, token: 'fake-jwt-token-for-test' } // Trả về cấu trúc giống API thật
    }

    // 2. Nếu không phải tài khoản test, gọi API bình thường
    const res = await authApi.login(email, password)
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const register = async (email, password) => {
    const res = await authApi.register(email, password)
    localStorage.setItem('token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook dùng trong bất kỳ component nào
export const useAuth = () => useContext(AuthContext)

