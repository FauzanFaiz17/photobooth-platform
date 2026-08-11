import type { JSX } from 'react'
import { useLocation } from 'react-router-dom'

import LoginForm from '@/features/auth/components/LoginForm'

interface LoginLocationState {
  message?: string
}

export default function LoginPage(): JSX.Element {
  const location = useLocation()
  const state = location.state as LoginLocationState | null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <LoginForm initialMessage={state?.message} />
    </div>
  )
}
