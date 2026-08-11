import axios from 'axios'

import api from '@/api/axios'
import { authStorage } from '@/features/auth/services/authStorage'
import { bootstrap } from '@/services/bootstrapService'
import { useAuthStore } from '@/store/authStore'
import { useDeviceStore } from '@/store/deviceStore'

export interface BootstrapRestoreResult {
  loaded: boolean
  loginMessage?: string
}

export async function restoreBootstrap(): Promise<BootstrapRestoreResult> {
  try {
    const response = await bootstrap()
    if (!response.success) return { loaded: false }
    if (response.data.device) useDeviceStore.getState().setDevice(response.data.device)
    return { loaded: true }
  } catch (error) {
    if (!shouldClearStoredSession(error)) throw error
    await authStorage.removeToken()
    delete api.defaults.headers.common.Authorization
    useAuthStore.getState().logout()
    return {
      loaded: false,
      loginMessage:
        axios.isAxiosError(error) && error.response?.status === 403
          ? 'Sesi operator sebelumnya tidak cocok dengan partner device ini. Silakan login dengan akun operator yang sesuai.'
          : 'Sesi login telah berakhir. Silakan login kembali.'
    }
  }
}

function shouldClearStoredSession(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false
  if (error.response?.status === 401) return true
  const message = (error.response?.data as { message?: string } | undefined)?.message
  return error.response?.status === 403 && message === 'The device does not belong to this user.'
}
