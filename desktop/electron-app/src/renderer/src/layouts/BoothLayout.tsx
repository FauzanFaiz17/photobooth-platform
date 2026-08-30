/* eslint-disable prettier/prettier */
import { Outlet } from 'react-router-dom'
import { useEffect, useState, type JSX } from 'react'

import { useDeviceStore } from '@/store/deviceStore'
import { useSessionStore } from '@/store/sessionStore'
import { eventStorage } from '@/features/event/services/eventStorage'
import { useAuthStore } from '@/store/authStore'

export default function BoothLayout(): JSX.Element {
  const device = useDeviceStore((state) => state.device)
  const configuration = useSessionStore((state) => state.eventConfiguration)
  const user = useAuthStore((state) => state.user)
  const partnerName = user?.partner?.company_name ?? 'Kolase Photobooth'
  const [home, setHome] = useState<{ logo?: string } | null>(null)

  useEffect(() => {
    void Promise.all([window.storage.get('desktop.home-settings'), eventStorage.getSaved()]).then(
      ([settings]) => {
        setHome(settings as typeof home)
      }
    )
  }, [])

  return (
    <div className="flex h-screen flex-col bg-(--background) text-(--foreground)">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-(--border) bg-(--primary) px-5 py-4 shadow-[0_4px_0_0_var(--border)] md:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center border-4 border-(--border) bg-(--surface) text-xl font-black p-1">
            <img src={home?.logo} alt="logo" className='' />
          </span>
          <div>
            <p className="text-lg font-black tracking-[-0.03em]">{partnerName}</p>
          </div>
        </div>
        <div className="border-2 border-(--border) bg-(--surface) px-3 py-2 text-right text-sm shadow-[3px_3px_0_0_var(--border)]">
          <p className="font-black">{configuration?.event.event_name ?? device?.device_name}</p>
          <p className="font-semibold text-(--muted-foreground)">
            {configuration?.event.booth.name ?? 'Booth belum dipilih'}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-(--background) p-5 md:p-8">
        <Outlet />
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t-4 border-(--border) bg-(--surface) px-5 py-3 text-xs font-bold md:px-8">
        <span className="uppercase tracking-wider text-(--muted-foreground)">
          {device?.device_name ?? 'Perangkat belum dimuat'}
        </span>
        <span
          className={`border-2 border-(--border) px-3 py-1 font-black uppercase ${device?.status === 'active' ? 'bg-[var(--accent)]' : 'bg-[var(--secondary)]'}`}
        >
          {device?.status === 'active' ? 'Perangkat aktif' : 'Perangkat offline'}
        </span>
      </footer>
    </div>
  )
}
