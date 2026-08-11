import { Navigate, Outlet } from 'react-router-dom'

import { useDeviceStore } from '@/store/deviceStore'

export function RegisteredDeviceRoute(): React.JSX.Element {
  const fingerprint = useDeviceStore((state) => state.fingerprint)
  const registered = useDeviceStore((state) => state.registered)

  if (!fingerprint) {
    return <Navigate to="/" replace />
  }

  if (!registered) {
    return <Navigate to="/activate-device" replace />
  }

  return <Outlet />
}

export function UnregisteredDeviceRoute(): React.JSX.Element {
  const fingerprint = useDeviceStore((state) => state.fingerprint)
  const registered = useDeviceStore((state) => state.registered)

  if (!fingerprint) {
    return <Navigate to="/" replace />
  }

  if (registered) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
