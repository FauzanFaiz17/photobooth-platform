import axios from 'axios'

import { verifyDevice } from '@/features/devices/api/device'
import { useDeviceStore } from '@/store/deviceStore'

export async function restoreDeviceRegistration(): Promise<boolean> {
  const fingerprint = useDeviceStore.getState().fingerprint

  if (!fingerprint) return false

  try {
    const device = await verifyDevice(fingerprint.deviceUuid)
    useDeviceStore.getState().setDevice(device)
    return true
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false
    }

    throw error
  }
}
