import { create } from 'zustand'

import type { Device, DeviceFingerprint } from '@/features/devices/types'

interface DeviceState {
  fingerprint: DeviceFingerprint | null

  device: Device | null

  registered: boolean

  setFingerprint: (value: DeviceFingerprint) => void

  setDevice: (device: Device) => void

  reset: () => void
}

export const useDeviceStore = create<DeviceState>((set) => ({
  fingerprint: null,

  device: null,

  registered: false,

  setFingerprint: (fingerprint) =>
    set({
      fingerprint
    }),

  setDevice: (device) =>
    set({
      device,

      registered: true
    }),

  reset: () =>
    set({
      fingerprint: null,

      device: null,

      registered: false
    })
}))
