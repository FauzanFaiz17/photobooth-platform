import { useEffect } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import CameraCapture from '@/features/camera/components/CameraCapture'
import { useSessionStore } from '@/store/sessionStore'

export default function CameraPage(): JSX.Element | null {
  const navigate = useNavigate()

  const template = useSessionStore((state) => state.template)

  const configuration = useSessionStore((state) => state.eventConfiguration)

  const filter = useSessionStore((state) => state.filter)

  const requiredShots = useSessionStore((state) => state.requiredShots)

  const addShot = useSessionStore((state) => state.addShot)

  const resetShots = useSessionStore((state) => state.resetShots)

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

  if (!template || !configuration) {
    return null
  }

  return (
    <div className="-m-6 flex h-[calc(100%+3rem)] flex-col bg-slate-900">
      <CameraCapture
        totalShots={requiredShots}
        countdownSeconds={configuration.camera.countdown_seconds}
        cssFilter={filter?.cssFilter ?? 'none'}
        templateOverlayPath={template.overlayPath}
        onShotCaptured={addShot}
        onAllShotsDone={() => navigate('/preview')}
      />
    </div>
  )
}
