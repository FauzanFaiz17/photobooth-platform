import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useDeviceStore } from '@/store/deviceStore'
import { eventStorage } from '@/features/event/services/eventStorage'
import { useSessionStore } from '@/store/sessionStore'

export default function WelcomePage(): JSX.Element {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const device = useDeviceStore((state) => state.device)
  const partnerName = user?.partner?.name ?? 'Toko Photobooth'
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
    <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-4xl font-bold text-slate-500">
        {home?.logo ? (
          <img src={home.logo} className="h-full w-full object-cover" />
        ) : (
          partnerName.charAt(0).toUpperCase()
        )}
      </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-800">{title}</h1>
        <p className="mt-2 text-slate-500">
          {home?.subtitle || device?.device_name || 'Photobooth'}
        </p>
        {savedEvent && <p className="mt-1 text-xs text-emerald-600">Event siap digunakan</p>}
      </div>
      <div className="flex gap-3">
        <Button onClick={() => void start()} className="px-10 py-3 text-lg">
          Start
        </Button>
        <Button onClick={() => navigate('/settings')} className="bg-slate-500 hover:bg-slate-600">
          Pengaturan
        </Button>
      </div>
    </div>
  )
}
