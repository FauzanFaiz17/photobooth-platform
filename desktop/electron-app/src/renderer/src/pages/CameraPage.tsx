import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import CameraCapture from '@/features/camera/components/CameraCapture'
import { getCountdownSeconds } from '@/features/settings/deviceSettings'
import { useSessionStore } from '@/store/sessionStore'

export default function CameraPage(): JSX.Element | null {
  const navigate = useNavigate()

  const template = useSessionStore((state) => state.template)

  const configuration = useSessionStore((state) => state.eventConfiguration)

  const requiredShots = useSessionStore((state) => state.requiredShots)

  const addShot = useSessionStore((state) => state.addShot)

  const resetShots = useSessionStore((state) => state.resetShots)

  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!template || !configuration) {
      navigate('/dashboard', { replace: true })
    }
  }, [configuration, template, navigate])

  useEffect(() => {
    // mulai dengan slate bersih setiap kali masuk halaman kamera
    // (misal user "Ambil Ulang" dari halaman preview)
    resetShots()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!configuration) return

    void getCountdownSeconds(configuration.camera.countdown_seconds).then(setCountdownSeconds)
  }, [configuration])

  if (!template || !configuration || countdownSeconds === null) {
    return null
  }

  return (
    <main className="-m-6 flex h-[calc(100%+3rem)] flex-col bg-[#202020] p-4 text-white md:p-6">
      <header className="mb-4 flex items-center justify-between border-4 border-black bg-(--primary) px-4 py-3 text-(--foreground) shadow-(--shadow-neo)">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em]">04 / Capture</p>
          <h1 className="text-2xl font-black tracking-[-0.03em]">Ambil Foto</h1>
        </div>
        <span className="border-2 border-black bg-(--surface) px-3 py-2 text-xs font-black uppercase">
          {requiredShots} foto
        </span>
      </header>
      <CameraCapture
        totalShots={requiredShots}
        countdownSeconds={countdownSeconds}
        templateOverlayPath={template.overlayPath}
        onShotCaptured={addShot}
        onAllShotsDone={() => navigate('/preview')}
      />
    </main>
  )
}
