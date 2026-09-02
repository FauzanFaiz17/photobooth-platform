import api from '@/api/axios'

import { authStorage } from '@/features/auth/services/authStorage'

import { profile } from '@/features/auth/api/auth'

import { useAuthStore } from '@/store/authStore'

export async function restoreSession() {
  const token = await authStorage.getToken()

  if (!token) {
    console.log('No saved session.')

    return
  }

  try {
    api.defaults.headers.common.Authorization = `Bearer ${token}`

    const response = await profile()

    useAuthStore.getState().login(token, response.data)

    console.log('Session Restored.')
  } catch (error) {
    console.log('Session Expired.')

    await authStorage.removeToken()

    useAuthStore.getState().logout()
  }
}
