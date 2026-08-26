import api from './axios'

export async function checkInternetConnection(): Promise<void> {
  if (!navigator.onLine) throw new Error('Internet tidak terhubung.')
  await api.get('/v1/health', { timeout: 8000 })
}
