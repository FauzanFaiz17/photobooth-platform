import { useCallback, useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'

import Button from '@/components/ui/Button'

import { useWebcam } from '../hooks/useWebcam'
import { useCaptureSequence } from '../hooks/useCaptureSequence'
import type { CapturedShot } from '@/store/sessionStore'
import { loadTemplateOverlayDataUrl } from '@/features/template/services/composeTemplate'
import {
  DEFAULT_CAMERA_SETTINGS,
  getCameraSettings,
  type CameraDeviceSettings
} from '@/features/settings/deviceSettings'

const CAMERA_API_URL = 'http://127.0.0.1:5000'

interface CameraCaptureProps {
  totalShots: number
  countdownSeconds: number
  templateOverlayPath: string | null
  onShotCaptured: (shot: CapturedShot) => void
  onAllShotsDone: () => void
}

export default function CameraCapture({
  totalShots,
  countdownSeconds,
  templateOverlayPath,
  onShotCaptured,
  onAllShotsDone
}: CameraCaptureProps): JSX.Element {
  const { videoRef, status, error, devices, selectDevice, retry } = useWebcam()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const [lastCaptured, setLastCaptured] = useState<CapturedShot | null>(null)
  const [cameraSettings, setCameraSettings] = useState<CameraDeviceSettings | null>(null)
  const [templateOverlay, setTemplateOverlay] = useState<{
    path: string
    dataUrl: string
  } | null>(null)

  useEffect(() => {
    void getCameraSettings().then(async (settings) => {
      setCameraSettings(settings)
      if (settings.source === 'webcam') {
        const available = settings.deviceId
          ? devices.find((device) => device.deviceId === settings.deviceId)
          : null
        if (available) selectDevice(available.deviceId)
        await window.api?.request('/toggle_webcam', 'POST', {
          use_webcam: true,
          device_index: Math.max(
            0,
            devices.findIndex((device) => device.deviceId === available?.deviceId)
          )
        })
      } else {
        await window.api?.request('/toggle_webcam', 'POST', { use_webcam: false, device_index: 0 })
        for (const [property, selected] of [
          ['iso', settings.iso],
          ['aperture', settings.aperture],
          ['shutter', settings.shutter]
        ] as const) {
          if (selected)
            await window.api?.request('/set_property', 'POST', { property, value: selected.value })
        }
      }
      await window.api?.request('/toggle_mirror', 'POST', { mirror: settings.mirror })
    })
  }, [devices, selectDevice])

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

  const captureFrame = useCallback(async (): Promise<string | null> => {
    const settings = cameraSettings ?? DEFAULT_CAMERA_SETTINGS

    if (settings.source === 'canon') {
      const dataUrl = await window.electron.camera.capturePreview()
      const image = new Image()
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Hasil Canon tidak dapat dibaca.'))
        image.src = dataUrl
      })
      const canvas = canvasRef.current
      if (!canvas) return null
      const portrait = settings.orientation === 'portrait'
      canvas.width = portrait ? image.naturalHeight : image.naturalWidth
      canvas.height = portrait ? image.naturalWidth : image.naturalHeight
      const context = canvas.getContext('2d')
      if (!context) return null
      context.translate(canvas.width / 2, canvas.height / 2)
      if (portrait) context.rotate(Math.PI / 2)
      context.scale(settings.mirror ? -1 : 1, 1)
      context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)
      const captured = canvas.toDataURL('image/png')
      setLastCaptured({
        id: `${Date.now()}`,
        dataUrl: captured,
        width: canvas.width,
        height: canvas.height
      })
      return captured
    }

    const video = videoRef.current

    const canvas = canvasRef.current

    if (!video || !canvas || video.videoWidth === 0) {
      return null
    }

    const portrait = settings.orientation === 'portrait'
    canvas.width = portrait ? video.videoHeight : video.videoWidth
    canvas.height = portrait ? video.videoWidth : video.videoHeight

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return null
    }

    ctx.translate(canvas.width / 2, canvas.height / 2)
    if (portrait) ctx.rotate(Math.PI / 2)
    ctx.scale(settings.mirror ? -1 : 1, 1)
    ctx.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2)

    const dataUrl = canvas.toDataURL('image/png')

    setLastCaptured({
      id: `${Date.now()}`,
      dataUrl,
      width: canvas.width,
      height: canvas.height
    })

    return dataUrl
  }, [cameraSettings, videoRef])

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
    onComplete: () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
      onAllShotsDone()
    }
  })

  async function startFullscreenCapture(): Promise<void> {
    if (!document.fullscreenElement && stageRef.current) {
      await stageRef.current.requestFullscreen().catch(() => undefined)
    }
    start()
  }

  function handleContinue(): void {
    if (!lastCaptured) return
    onShotCaptured(lastCaptured)
    setLastCaptured(null)
    if (currentShotIndex + 1 >= totalShots) {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
      window.setTimeout(onAllShotsDone, 0)
      return
    }
    continueAfterReview()
  }
  if (
    !cameraSettings ||
    (cameraSettings.source === 'webcam' && (status === 'requesting' || status === 'idle'))
  ) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />

        <p>Mengaktifkan webcam...</p>
      </div>
    )
  }

  if (
    cameraSettings.source === 'webcam' &&
    (status === 'denied' || status === 'not-found' || status === 'error')
  ) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center text-white">
        <p className="max-w-md">{error}</p>

        <Button onClick={retry}>Coba Lagi</Button>
      </div>
    )
  }

  return (
    <div ref={stageRef} className="camera-stage flex h-full flex-col items-center justify-center gap-4 bg-[#202020] p-4 fullscreen:bg-black md:p-6">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-xl">
        {cameraSettings.source === 'canon' ? (
          <img
            src={`${CAMERA_API_URL}/video_feed`}
            alt="Live preview Canon"
            className={`h-[480px] w-[640px] object-cover ${cameraSettings.mirror ? '-scale-x-100' : ''}`}
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-[480px] w-[640px] object-cover ${cameraSettings.mirror ? '-scale-x-100' : ''}`}
          />
        )}

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

      {stage === 'idle' && (
        <Button onClick={() => void startFullscreenCapture()} className="px-8 py-3 text-lg">
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
