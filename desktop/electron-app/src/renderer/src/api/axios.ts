import axios from 'axios'
import { authStorage } from '../features/auth/services/authStorage'
import { useAuthStore } from '../store/authStore'
import { useDeviceStore } from '../store/deviceStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

  timeout: 30000
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const deviceUuid = useDeviceStore.getState().fingerprint?.deviceUuid

  if (deviceUuid) {
    config.headers['X-Device-UUID'] = deviceUuid
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await authStorage.removeToken()
      delete api.defaults.headers.common.Authorization
      useAuthStore.getState().logout()
    }

    return Promise.reject(error)
  }
)

export default api

export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback

  const data = error.response?.data as
    { message?: string; errors?: Record<string, string[]> } | undefined

  if (data?.errors) {
    const firstError = Object.values(data.errors)[0]?.[0]
    if (firstError) return firstError
  }

  return data?.message || error.message || fallback
}
