import { api } from './client.js'

export const progressApi = {
  // Gọi sau mỗi lần animation chạy xong
  // Ví dụ: progressApi.save('sorting', 'bubbleSort', { array_size: 20, duration_ms: 1200 })
  save: (category, algorithm, extra = {}) =>
    api.post('/progress', { category, algorithm, ...extra }),

  getAll: (category) =>
    api.get('/progress', { params: category ? { category } : {} }),

  getStats: () =>
    api.get('/progress/stats'),

  clearAll: () =>
    api.delete('/progress'),
}