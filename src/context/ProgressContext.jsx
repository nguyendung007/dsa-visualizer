import { createContext, useContext, useState, useCallback } from 'react'
import { progressApi } from '../api/progress.js'

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [toast, setToast] = useState({ message: '', type: '' })

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
  }, [])

  const saveProgress = useCallback(async (category, algorithm, extra = {}) => {
    try {
      await progressApi.save(category, algorithm, extra)
      setToast({ message: `✓ Đã lưu: ${algorithm}`, type: 'success' })
    } catch (err) {
      console.error('Save progress error:', err)
      setToast({ message: '✗ Lỗi lưu lịch sử', type: 'error' })
    }
  }, [])

  return (
    <ProgressContext.Provider value={{ saveProgress, showToast, toast }}>
      {children}
    </ProgressContext.Provider>
  )
}

export const useProgress = () => useContext(ProgressContext)