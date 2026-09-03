import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { NeoButton } from '@/components/shared/button'
import { eventStorage } from '@/features/event/services/eventStorage'
import { useAuthStore } from '@/store/authStore'
import { useSessionStore } from '@/store/sessionStore'

const focusRing =
  'focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-(--danger)'

export default function WelcomePage(): JSX.Element {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const beginEvent = useSessionStore((state) => state.beginEvent)
  const [home, setHome] = useState<{ title?: string; subtitle?: string; logo?: string } | null>(
    null
  )
  const partnerName = user?.partner?.company_name ?? 'Kolase Photobooth'

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
    <main className="grid h-full min-h-[520px] place-items-center">
      <section className="relative grid w-full max-w-5xl overflow-hidden border-4 border-(--border) bg-(--surface) text-(--foreground) shadow-[12px_12px_0_0_var(--border)] md:grid-cols-[1.05fr_0.95fr]">
        <span
          className="absolute left-0 top-0 h-4 w-32 border-b-4 border-r-4 border-(--border) bg-(--primary)"
          aria-hidden="true"
        />

        <div className="flex flex-col justify-between border-b-4 border-(--border) p-7 pt-12 md:border-b-0 md:border-r-4 md:p-10 md:pt-14">
          <div>
            {home?.logo && (
              <img
                src={home.logo}
                alt=""
                className="mb-8 h-28 w-28 border-4 border-(--border) bg-(--accent) object-cover shadow-[var(--shadow-neo)]"
              />
            )}
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-(--danger)">
              {partnerName}
            </p>
            <h1 className="mt-3 text-5xl font-black leading-[0.88] tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
              {home?.title || 'Selamat Datang'}
            </h1>
            {home?.subtitle && (
              <p className="mt-6 max-w-md text-lg font-semibold leading-7 text-(--muted-foreground)">
                {home.subtitle}
              </p>
            )}
          </div>

          <p className="mt-10 w-fit border-2 border-(--border) bg-(--accent) px-3 py-2 text-xs font-black uppercase tracking-wider">
            Booth siap
          </p>
        </div>

        <div className="flex flex-col justify-between bg-(--primary) p-7 md:p-10">
          <div>
            <div className="mb-12 flex items-start justify-between gap-4">
              <span className="border-2 border-(--border) bg-(--surface) px-3 py-2 text-xs font-black uppercase">
                01 / Mulai di sini
              </span>
              <span className="text-4xl font-black leading-none" aria-hidden="true">
                ✳
              </span>
            </div>
            <p className="max-w-xs text-2xl font-black leading-tight">
              Siapkan sesi foto dan biarkan kamera bekerja.
            </p>
          </div>

          <div className="mt-12 grid gap-4">
            <NeoButton
              onClick={() => void start()}
              className={`w-full bg-(--danger) px-6 py-5 text-xl text-(--foreground) shadow-[var(--shadow-neo)] [transition:none] hover:bg-[#cf3d26] ${focusRing}`}
            >
              Mulai Sesi <span aria-hidden="true">&rarr;</span>
            </NeoButton>
            <NeoButton
              variant="outlined"
              onClick={() => navigate('/settings')}
              className={`w-full px-6 py-4 text-base shadow-[var(--shadow-neo)] [transition:none] ${focusRing}`}
            >
              Pengaturan
            </NeoButton>
          </div>
        </div>
      </section>
    </main>
  )
}
