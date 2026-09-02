import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/store/authStore'

export default function GuestRoute() {
  const authenticated = useAuthStore((state) => state.authenticated)

  if (authenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
