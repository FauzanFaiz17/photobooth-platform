import { useCallback, useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'

import Button from '@/components/ui/Button'

import { useWebcam } from '../hooks/useWebcam'
import { useCaptureSequence } from '../hooks/useCaptureSequence'
import type { CapturedShot } from '@/store/sessionStore'
import { loadTemplateOverlayDataUrl } from '@/features/template/services/composeTemplate'

interface CameraCaptureProps {
  totalShots: number
  countdownSeconds: number
  cssFilter: string
  templateOverlayPath: string | null
  onShotCaptured: (shot: CapturedShot) => void
  onAllShotsDone: () => void
}

export default function CameraCapture({
  totalShots,
  countdownSeconds,
  cssFilter,
  templateOverlayPath,
  onShotCaptured,
  onAllShotsDone
}: CameraCaptureProps): JSX.Element {
  const { videoRef, status, error, devices, activeDeviceId, selectDevice, retry } = useWebcam()

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [lastCaptured, setLastCaptured] = useState<CapturedShot | null>(null)
  const [templateOverlay, setTemplateOverlay] = useState<{
    path: string
    dataUrl: string
  } | null>(null)

  useEffect(() => {
    let active = true

    if (!templateOverlayPath) {
      return undefined
    }

    void loadTemplateOverlayDataUrl(templateOverlayPath)
      .then((dataUrl) => {
        if (active) setTemplateOverlay({ path: templateOverlayPath, dataUrl })
      })
      .catch(() => {
        // Countdown tetap dapat berjalan tanpa overlay jika asset gagal dimuat.
      })

    return (): void => {
      active = false
    }
  }, [templateOverlayPath])

  const activeTemplateOverlay =
    templateOverlay?.path === templateOverlayPath ? templateOverlay.dataUrl : null

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current

    const canvas = canvasRef.current

    if (!video || !canvas || video.videoWidth === 0) {
      return null
    }

    canvas.width = video.videoWidth

    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return null
    }

    // efek mirror supaya hasil foto sama seperti yang dilihat user di preview
    ctx.filter = cssFilter

    ctx.translate(canvas.width, 0)

    ctx.scale(-1, 1)

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const dataUrl = canvas.toDataURL('image/png')

    setLastCaptured({
      id: `${Date.now()}`,
      dataUrl,
      width: canvas.width,
      height: canvas.height
    })

    return dataUrl
  }, [cssFilter, videoRef])

  const {
    stage,
    countdown,
    currentShotIndex,
    start,
    continueAfterReview,
    retakeCurrent,
    isActive
  } = useCaptureSequence({
    totalShots,
    countdownSeconds,
    onCapture: captureFrame,
    onComplete: onAllShotsDone
  })

  function handleContinue(): void {
    if (!lastCaptured) return
    onShotCaptured(lastCaptured)
    setLastCaptured(null)
    if (currentShotIndex + 1 >= totalShots) {
      window.setTimeout(onAllShotsDone, 0)
      return
    }
    continueAfterReview()
  }
  if (status === 'requesting' || status === 'idle') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />

        <p>Mengaktifkan webcam...</p>
      </div>
    )
  }

  if (status === 'denied' || status === 'not-found' || status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center text-white">
        <p className="max-w-md">{error}</p>

        <Button onClick={retry}>Coba Lagi</Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-[480px] w-[640px] -scale-x-100 object-cover"
          style={{ filter: cssFilter }}
        />

        {stage === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            {activeTemplateOverlay && (
              <img
                src={activeTemplateOverlay}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              />
            )}
            <span className="relative text-8xl font-bold text-white drop-shadow-lg">
              {countdown}
            </span>
          </div>
        )}

        {stage === 'flash' && <div className="absolute inset-0 animate-pulse bg-white/80" />}

        <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          Foto {Math.min(currentShotIndex + 1, totalShots)} / {totalShots}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {stage === 'review' && lastCaptured && (
        <div className="flex flex-col items-center gap-3 text-white">
          <img src={lastCaptured.dataUrl} className="h-48 rounded-lg" />
          <p>Foto {currentShotIndex + 1}: sudah sesuai?</p>
          <div className="flex gap-3">
            <Button onClick={retakeCurrent} className="bg-slate-500">
              Ulangi
            </Button>
            <Button onClick={handleContinue}>Lanjutkan</Button>
          </div>
        </div>
      )}

      {devices.length > 1 && stage === 'idle' && (
        <select
          value={activeDeviceId ?? ''}
          onChange={(e) => selectDevice(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      )}

      {stage === 'idle' && (
        <Button onClick={start} className="px-8 py-3 text-lg">
          Mulai Ambil Foto
        </Button>
      )}

      {stage === 'done' && <p className="text-white">Selesai! Menyiapkan preview...</p>}

      {isActive && stage !== 'countdown' && stage !== 'flash' && stage !== 'review' && (
        <p className="text-sm text-gray-300">Bersiap untuk foto berikutnya...</p>
      )}
    </div>
  )
}
