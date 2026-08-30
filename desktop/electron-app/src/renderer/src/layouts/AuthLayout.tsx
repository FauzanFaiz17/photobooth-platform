import { Outlet } from 'react-router-dom'
import type { JSX } from 'react'

export default function AuthLayout(): JSX.Element {
  return (
    <div className="min-h-screen bg-[var(--background)] p-5 text-[var(--foreground)] md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl items-center justify-center border-4 border-[var(--border)] bg-[var(--surface)] p-3 shadow-[12px_12px_0_0_var(--border)] md:min-h-[calc(100vh-4rem)] md:p-6">
        <Outlet />
      </div>
    </div>
  )
}
