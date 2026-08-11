import { useEffect } from 'react'

import { heartbeatDevice } from '@/features/devices/api/device'
import { useAuthStore } from '@/store/authStore'
import { useDeviceStore } from '@/store/deviceStore'

const HEARTBEAT_INTERVAL_MS = 60_000

export function useDeviceHeartbeat(): void {
  const authenticated = useAuthStore((state) => state.authenticated)
  const fingerprint = useDeviceStore((state) => state.fingerprint)
  const registered = useDeviceStore((state) => state.registered)
  const setDevice = useDeviceStore((state) => state.setDevice)

  useEffect(() => {
    if (!authenticated || !registered || !fingerprint) return

    const sendHeartbeat = async (): Promise<void> => {
      try {
        const device = await heartbeatDevice(fingerprint.appVersion)
        setDevice(device)
      } catch {
        // Heartbeat failures must not interrupt an active offline booth session.
      }
    }

    void sendHeartbeat()
    const interval = window.setInterval(() => void sendHeartbeat(), HEARTBEAT_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [authenticated, fingerprint, registered, setDevice])
}
