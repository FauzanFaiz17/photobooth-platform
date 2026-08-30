import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useDeviceStore } from '@/store/deviceStore'
import { eventStorage } from '@/features/event/services/eventStorage'
import { useSessionStore } from '@/store/sessionStore'
import { NeoButton } from '@/components/shared/button'

export default function WelcomePage(): JSX.Element {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const device = useDeviceStore((state) => state.device)
  const partnerName = user?.partner?.company_name ?? 'Kolase Photobooth'
  const beginEvent = useSessionStore((state) => state.beginEvent)
  const [home, setHome] = useState<{ title?: string; subtitle?: string; logo?: string } | null>(
    null
  )
  const [savedEvent, setSavedEvent] = useState(false)
  useEffect(() => {
    void Promise.all([window.storage.get('desktop.home-settings'), eventStorage.getSaved()]).then(
      ([settings, event]) => {
        setHome(settings as typeof home)
        setSavedEvent(Boolean(event))
      }
    )
  }, [])
  async function start(): Promise<void> {
    const event = await eventStorage.getSaved()
    if (event) {
      beginEvent(event)
      navigate('/template')
    } else navigate('/dashboard')
  }
  const title = home?.title || `Selamat Datang di ${partnerName}`
  return (
    <main className="flex h-full w-full items-center justify-center bg-[#f4f0e8] px-5 py-8 text-[#111111]">
      <section className="relative grid w-full max-w-5xl overflow-hidden border-4 border-black bg-[#fffdf7] shadow-[12px_12px_0_0_#111111] md:grid-cols-[1.05fr_0.95fr]">
        <div
          className="absolute left-0 top-0 h-4 w-32 border-r-4 border-b-4 border-black bg-[#ffdc3e]"
          aria-hidden="true"
        />
        <div className="flex flex-col justify-between border-b-4 border-black p-7 pt-12 md:border-b-0 md:border-r-4 md:p-10 md:pt-14">
          <div>
            <div className="mb-8 flex h-28 w-28 items-center justify-center overflow-hidden border-4 border-black bg-[#b7eff0] text-5xl font-black shadow-[7px_7px_0_0_#111111]">
              {home?.logo ? (
                <img
                  src={home.logo}
                  alt={`Logo ${partnerName}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                partnerName.charAt(0).toUpperCase()
              )}
            </div>
            <p className="mb-3 max-w-xl text-sm font-bold uppercase tracking-[0.16em] text-[#e34b31]">
              {partnerName}
            </p>
            <h1 className="max-w-2xl text-4xl font-black leading-[0.95] tracking-[-0.04em] sm:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-md text-base font-semibold leading-7 text-black/65">
              {home?.subtitle || device?.device_name || 'Photobooth'}
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3 text-xs font-black uppercase tracking-wider">
            <span className="border-2 border-black bg-[#b7eff0] px-3 py-2">Device ready</span>
            {savedEvent && (
              <span className="border-2 border-black bg-[#ff8db3] px-3 py-2">
                Event siap digunakan
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-between bg-[#ffdc3e] p-7 md:p-10">
          <div>
            <div className="mb-12 flex items-start justify-between gap-4">
              <span className="border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase">
                01 / Start here
              </span>
              <span className="text-4xl font-black leading-none">✳</span>
            </div>
            <p className="max-w-xs text-2xl font-black leading-tight">
              Siapkan sesi foto dan biarkan kamera bekerja.
            </p>
          </div>
          <div className="mt-12 grid gap-4">
            <NeoButton
              onClick={() => void start()}
              className="w-full bg-[#e34b31] px-6 py-4 text-lg text-black shadow-[7px_7px_0_0_#111111] hover:bg-[#cf3d26] [transition:none]"
            >
              Mulai Sesi <span aria-hidden="true">→</span>
            </NeoButton>
            <NeoButton
              onClick={() => navigate('/settings')}
              variant="outlined"
              className="w-full px-6 py-4 text-base shadow-[7px_7px_0_0_#111111] [transition:none]"
            >
              Pengaturan
            </NeoButton>
          </div>
        </div>
      </section>
    </main>
  )
}
