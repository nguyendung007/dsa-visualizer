import { api } from './client.js'

export const aiApi = {
  ask: (question, context) =>
    api.post('/ai/ask', { question, context }),
}