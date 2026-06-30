import { api } from './client.js'

export const progressApi = {
  save: (category, algorithm, extra = {}) =>
    api.post('/progress', { category, algorithm, ...extra }),

  getAll: (category) =>
    api.get('/progress', { params: category ? { category } : {} }),

  getStats: () =>
    api.get('/progress/stats'),

  clearAll: () =>
    api.delete('/progress'),
}