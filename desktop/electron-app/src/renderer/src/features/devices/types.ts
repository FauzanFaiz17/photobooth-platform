export interface DeviceFingerprint {
  deviceUuid: string

  windowsUuid: string

  cpuIdentifier: string

  macAddress: string

  appVersion: string
}

export interface Device {
  id: number

  device_key: string

  device_uuid: string

  device_name: string

  status: string

  activation_expires_at?: string | null

  activated_at?: string | null

  app_version?: string | null

  last_sync_at?: string | null

  last_login_at?: string | null

  presence_status?: 'online' | 'stale' | 'offline'

  presence_age_seconds?: number | null
}

export interface DeviceLocalState {
  fingerprint: DeviceFingerprint

  registered: boolean

  lastSync: string | null
}
