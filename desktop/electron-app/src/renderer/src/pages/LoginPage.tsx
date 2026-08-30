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
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-8 text-[var(--foreground)]">
      <div className="w-full max-w-xl border-4 border-[var(--border)] bg-[var(--primary)] p-2 shadow-[12px_12px_0_0_var(--border)]">
        <div className="border-4 border-[var(--border)] bg-[var(--surface)] p-5 md:p-8">
          <div className="mb-6 flex items-center justify-between border-b-4 border-[var(--border)] pb-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--danger)]">
                Kolase Booth
              </p>
              <p className="text-2xl font-black tracking-[-0.04em]">Operator access</p>
            </div>
            <span className="border-2 border-[var(--border)] bg-[var(--accent)] px-2 py-1 text-xs font-black">
              01
            </span>
          </div>
          <LoginForm initialMessage={state?.message} />
        </div>
      </div>
    </main>
  )
}
