import api from '../../../api/axios'

import type { Device, DeviceFingerprint } from '../types'

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export const checkDevice = verifyDevice

export async function verifyDevice(deviceUuid: string): Promise<Device> {
  const response = await api.post<ApiEnvelope<Device>>('/v1/desktop/devices/verify', {
    device_uuid: deviceUuid
  })

  return response.data.data
}

export async function activateDevice(
  activationCode: string,
  fingerprint: DeviceFingerprint
): Promise<Device> {
  const response = await api.post<ApiEnvelope<Device>>('/v1/desktop/devices/activate', {
    activation_code: activationCode,
    device_uuid: fingerprint.deviceUuid,
    windows_uuid: fingerprint.windowsUuid || null,
    cpu_identifier: fingerprint.cpuIdentifier || null,
    mac_address: fingerprint.macAddress || null,
    app_version: fingerprint.appVersion || null
  })

  return response.data.data
}
