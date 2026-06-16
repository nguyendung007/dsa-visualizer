import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import './LoginPage.css'

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const { login, register } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      if (isRegister) await register(email, password)
      else            await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>{isRegister ? 'Đăng ký' : 'Đăng nhập'}</h2>

        {error && <p className="login-error">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="login-input"
        />
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="login-input"

        />

        <button onClick={handleSubmit} disabled={loading} className="login-btn">
          {loading ? 'Đang xử lý...' : isRegister ? 'Đăng ký' : 'Đăng nhập'}
        </button>

        <p className="login-toggle">
          {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
          <span onClick={() => { setIsRegister(!isRegister); setError('') }}>
            {isRegister ? ' Đăng nhập' : ' Đăng ký'}
          </span>
        </p>
      </div>
    </div>
  )
}