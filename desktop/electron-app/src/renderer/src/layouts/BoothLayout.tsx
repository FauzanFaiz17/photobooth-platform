import { Outlet } from 'react-router-dom'
import type { JSX } from 'react'

import { useDeviceStore } from '@/store/deviceStore'
import { useSessionStore } from '@/store/sessionStore'

export default function BoothLayout(): JSX.Element {
  const device = useDeviceStore((state) => state.device)
  const configuration = useSessionStore((state) => state.eventConfiguration)

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between bg-slate-900 px-5 py-3 text-white">
        <div className="font-semibold">Photobooth</div>
        <div className="text-right text-sm">
          <p>{configuration?.event.event_name ?? device?.device_name}</p>
          <p className="text-slate-400">
            {configuration?.event.booth.name ?? 'Booth belum dipilih'}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-gray-100 p-6">
        <Outlet />
      </main>

      <footer className="flex items-center justify-between border-t bg-white px-5 py-2 text-xs text-gray-600">
        <span>{device?.device_name ?? 'Perangkat belum dimuat'}</span>
        <span className="font-medium text-emerald-700">
          {device?.status === 'active' ? 'Perangkat aktif' : 'Perangkat offline'}
        </span>
      </footer>
    </div>
  )
}
