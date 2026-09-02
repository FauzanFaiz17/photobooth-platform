import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { NeoButton } from '@/components/shared/button'
import { eventStorage } from '@/features/event/services/eventStorage'
import { useAuthStore } from '@/store/authStore'
import { useSessionStore } from '@/store/sessionStore'

export default function WelcomePage(): JSX.Element {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const partnerName = user?.partner?.company_name ?? 'Kolase Photobooth'
  const beginEvent = useSessionStore((state) => state.beginEvent)
  const [home, setHome] = useState<{ title?: string; subtitle?: string; logo?: string } | null>(
    null
  )
  useEffect(() => {
    void window.storage.get('desktop.home-settings').then((settings) => {
      setHome(settings as typeof home)
    })
  }, [])

  async function start(): Promise<void> {
    const event = await eventStorage.getSaved()
    if (event) {
      beginEvent(event)
      navigate('/template')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <main className="relative -m-5 flex h-[calc(100%+2.5rem)] min-h-[520px] flex-col overflow-hidden bg-(--background) md:-m-8 md:h-[calc(100%+4rem)]">
      <div className="absolute left-5 top-5 flex max-w-lg items-center gap-4 text-white drop-shadow-lg md:left-8 md:top-8">
        {home?.logo && (
          <img
            src={home.logo}
            alt="Logo"
            className="h-16 w-16 border-4 border-white object-cover"
          />
        )}
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em]">{partnerName}</p>
          <h1 className="text-2xl font-black md:text-4xl">{home?.title || 'Selamat Datang'}</h1>
          {home?.subtitle && <p className="mt-1 font-bold">{home.subtitle}</p>}
        </div>
      </div>

      <div className="absolute inset-0 grid place-items-center">
        <button
          type="button"
          onClick={() => void start()}
          className="grid h-48 w-48 place-items-center rounded-full border-4 border-white bg-black/25 text-3xl font-black uppercase text-white shadow-[0_0_0_12px_rgba(255,255,255,0.12)] backdrop-blur-[2px] transition hover:bg-black/40 focus:outline-none focus:ring-4 focus:ring-white/70"
        >
          Mulai
        </button>
      </div>

      <NeoButton
        variant="outlined"
        onClick={() => navigate('/settings')}
        className="absolute bottom-6 right-6 bg-white/80 backdrop-blur-sm"
      >
        Pengaturan
      </NeoButton>
    </main>
  )
}
