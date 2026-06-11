import { useState, useEffect } from 'react'

export default function Toast({ message, type = 'success', duration = 3000 }) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!message) return
    setIsVisible(true)
    const timer = setTimeout(() => setIsVisible(false), duration)
    return () => clearTimeout(timer)
  }, [message, duration])

  if (!isVisible || !message) return null

  const bgColor = {
    success: 'rgba(16, 185, 129, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    warning: 'rgba(245, 158, 11, 0.1)',
  }[type]

  const borderColor = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
  }[type]

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: bgColor,
      border: `2px solid ${borderColor}`,
      borderRadius: '8px',
      padding: '16px 20px',
      color: borderColor,
      fontSize: '14px',
      fontWeight: 'bold',
      fontFamily: "'JetBrains Mono', monospace",
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 9999,
      animation: 'slideIn 0.3s ease-out, slideOut 0.3s ease-out 2.7s forwards',
    }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span>{message}</span>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
