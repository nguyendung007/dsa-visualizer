import { useEffect, useState } from 'react'
import { progressApi } from '../../../api/progress.js'
import LoadingSpinner from '../../components/LoadingSpinner.jsx'
import './ProgressPage.css'

export default function ProgressPage() {
  const [stats,   setStats]   = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null)

  useEffect(() => {
    Promise.all([progressApi.getStats(), progressApi.getAll()])
      .then(([statsRes, historyRes]) => {
        setStats(statsRes.data)
        setHistory(historyRes.data)
      })
      .catch(err => console.error('Error loading progress:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleClear = async () => {
    if (!confirm('Xoá toàn bộ lịch sử?')) return
    try {
      await progressApi.clearAll()
      setStats({ total: 0, byCategory: [], topAlgorithms: [] })
      setHistory([])
    } catch (err) {
      console.error('Error clearing history:', err)
    }
  }

  const filteredHistory = filter 
    ? history.filter(item => item.category === filter)
    : history

  if (loading) return <LoadingSpinner message="Đang tải lịch sử..." />

  return (
    <div className="progress-page">
      <div className="progress-header">
        <h2>Lịch sử học tập</h2>
        {history.length > 0 && (
          <button onClick={handleClear} className="clear-btn">Xoá tất cả</button>
        )}
      </div>

      {/* Tổng số lần chạy */}
      <div className="stat-total">
        Tổng số lần chạy: <strong>{stats?.total ?? 0}</strong>
      </div>

      {/* Theo category */}
      {stats?.byCategory?.length > 0 && (
        <div className="stat-section">
          <h3>Theo chủ đề</h3>
          <div className="stat-grid">
            {stats.byCategory.map(r => (
              <div key={r.category} className="stat-card">
                <span className="stat-name">{r.category}</span>
                <span className="stat-count">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top thuật toán */}
      {stats?.topAlgorithms?.length > 0 && (
        <div className="stat-section">
          <h3>Thuật toán chạy nhiều nhất</h3>
          <div className="stat-grid">
            {stats.topAlgorithms.map((r, i) => (
              <div key={i} className="stat-card">
                <span className="stat-name">{r.algorithm}</span>
                <span className="stat-count">{r.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lịch sử gần đây */}
      {filteredHistory.length > 0 ? (
        <div className="stat-section">
          <h3>⏱️ Gần đây {filter && `(${filter})`}</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Thuật toán</th>
                  <th>Chủ đề</th>
                  <th>Kích thước</th>
                  <th>Thời gian</th>
                  <th>Lúc</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.slice(0, 100).map(r => (
                  <tr key={r.id} style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}>
                    <td style={{ fontWeight: 'bold', color: '#58a6ff' }}>{r.algorithm}</td>
                    <td style={{ color: '#79c0ff' }}>{r.category}</td>
                    <td style={{ color: '#d0d4da' }}>{r.array_size ? r.array_size + ' phần tử' : '—'}</td>
                    <td style={{ color: '#d0d4da' }}>{r.duration_ms ? (r.duration_ms / 1000).toFixed(2) + 's' : '—'}</td>
                    <td style={{ color: '#999', fontSize: '12px' }}>
                      {new Date(r.ran_at).toLocaleString('vi-VN', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="empty-msg">Chưa có lịch sử {filter ? `cho chủ đề ${filter}` : ''}. Hãy chạy thử một thuật toán!</p>
      )}
    </div>
  )
}