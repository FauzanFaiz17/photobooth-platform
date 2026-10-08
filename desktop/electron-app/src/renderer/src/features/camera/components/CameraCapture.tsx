import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, JSX } from 'react'

import { NeoButton } from '@/components/shared/button'

import { useWebcam } from '../hooks/useWebcam'
import { useCaptureSequence } from '../hooks/useCaptureSequence'
import { useSessionStore, type CapturedShot } from '@/store/sessionStore'
import { getAppSettings } from '@/features/settings/deviceSettings'
import {
  composeTemplateImage,
  getCanvasSize,
  getFrames,
  loadTemplateFrameOverlayDataUrl
} from '@/features/template/services/composeTemplate'
import type { PhotoTemplate } from '@/features/template/types'
import {
  DEFAULT_CAMERA_SETTINGS,
  getCameraSettings,
  type CameraDeviceSettings,
  type CameraExposureSettings
} from '@/features/settings/deviceSettings'

const CAMERA_API_URL = 'http://127.0.0.1:5000'

interface CameraCaptureProps {
  totalShots: number
  countdownSeconds: number
  templateOverlayPath: string | null
  template: PhotoTemplate
  onShotCaptured: (shot: CapturedShot) => void
  onAllShotsDone: () => void
}

export default function CameraCapture({
  totalShots,
  countdownSeconds,
  templateOverlayPath,
  template,
  onShotCaptured,
  onAllShotsDone
}: CameraCaptureProps): JSX.Element {
  // Webcam renderer hanya dibuka saat sumber kamera memang webcam; saat Canon
  // dipilih stream ini dimatikan supaya perangkat tidak dipakai dua proses
  // (LED webcam padam dan OpenCV/EDSDK bebas membuka kameranya).
  const [cameraSource, setCameraSource] = useState<'canon' | 'webcam' | null>(null)
  const { videoRef, status, error, devices, selectDevice, retry } = useWebcam({
    enabled: cameraSource !== 'canon'
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const [lastCaptured, setLastCaptured] = useState<CapturedShot | null>(null)
  const [reviewImage, setReviewImage] = useState<string | null>(null)
  const [cameraSettings, setCameraSettings] = useState<CameraDeviceSettings | null>(null)
  const [templateOverlay, setTemplateOverlay] = useState<{
    path: string
    dataUrl: string
  } | null>(null)

  const cameraInitializedRef = useRef(false)
  const capturingRef = useRef(false)

  // Nilai properti yang terakhir berhasil dikirim ke kamera, dipakai agar
  // pergantian profil hanya mengirim property yang benar-benar berbeda.
  const appliedExposureRef = useRef<Record<string, number>>({})

  const applyExposure = useCallback(
    async (exposure: CameraExposureSettings, source: 'canon' | 'webcam'): Promise<void> => {
      if (source !== 'canon') return
      const props: Array<[string, number | null]> = [
        ['iso', exposure.iso?.value ?? null],
        ['aperture', exposure.aperture?.value ?? null],
        ['shutter', exposure.shutter?.value ?? null],
        ['white_balance', exposure.whiteBalance?.value ?? null],
        ['picture_style', exposure.pictureStyle?.value ?? null],
        ['exposure', exposure.exposure?.value ?? null],
        ['contrast', exposure.contrast?.value ?? null],
        ['saturation', exposure.saturation?.value ?? null]
      ]
      const next = { ...appliedExposureRef.current }
      for (const [property, value] of props) {
        if (value === null || next[property] === value) continue
        try {
          const result = await window.api?.request('/set_property', 'POST', { property, value })
          if (result && result.status === 'error') continue
          next[property] = value
        } catch {
          // Toleransi: kegagalan switch profil tidak boleh memblokir capture.
        }
      }
      appliedExposureRef.current = next
    },
    []
  )

  const applyProfile = useCallback(
    (profile: 'video' | 'photo'): Promise<void> => {
      const settings = cameraSettings
      if (!settings) return Promise.resolve()
      return applyExposure(profile === 'video' ? settings.video : settings.photo, settings.source)
    },
    [applyExposure, cameraSettings]
  )

  useEffect(() => {
    if (cameraInitializedRef.current) return

    void getCameraSettings().then(async (settings) => {
      setCameraSettings(settings)
      setCameraSource(settings.source)
      if (settings.source === 'webcam') {
        if (settings.deviceId && !devices.some((device) => device.deviceId === settings.deviceId))
          return
        cameraInitializedRef.current = true
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
        // Arahkan cameraAPI menyimpan JPEG asli ke folder sesi yang sama
        // dengan hasil webcam (Pictures/Photobooth/<timestamp>).
        cameraInitializedRef.current = true
        try {
          const appSettings = await getAppSettings()
          const { directory } = await window.session.prepareDirectory(appSettings.storageDirectory)
          await window.electron.camera.setSaveDir(directory)
          useSessionStore.getState().setCameraServiceDirectory(directory)
        } catch (error) {
          console.error('Gagal menyiapkan folder sesi Canon:', error)
        }

        await window.api?.request('/toggle_webcam', 'POST', { use_webcam: false, device_index: 0 })
        // Profil video yang aktif selama idle/countdown; profil foto baru
        // diterapkan tepat sebelum shutter membuka.
        await applyExposure(settings.video, 'canon')
      }
      await window.api?.request('/toggle_mirror', 'POST', { mirror: settings.mirror })
    })
  }, [applyExposure, devices, selectDevice])

  // ---- Rekaman video pendek per shot (webcam atau Canon MJPEG, tanpa audio) ----
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordChunksRef = useRef<Blob[]>([])
  const recordingPromiseRef = useRef<Promise<string | null> | null>(null)
  const recordingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordingStartedRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)
  const mjpegImgRef = useRef<HTMLImageElement | null>(null)
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const startRecording = useCallback((): void => {
    if (recordingStartedRef.current || mediaRecorderRef.current) return
    if (typeof MediaRecorder === 'undefined') {
      recordingPromiseRef.current = null
      return
    }

    const isCanon = cameraSettings?.source === 'canon'

    let stream: MediaStream | null = null

    if (isCanon) {
      // Canon: ambil frame dari MJPEG stream via <img> element,
      // gambar ke canvas tersembunyi, lalu rekam dari canvas stream.
      const img = mjpegImgRef.current
      const canvas = recordingCanvasRef.current
      if (!img || !canvas) {
        recordingPromiseRef.current = null
        return
      }

      canvas.width = img.naturalWidth || 640
      canvas.height = img.naturalHeight || 480
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        recordingPromiseRef.current = null
        return
      }

      let drawing = true
      const drawFrame = (): void => {
        if (!drawing) return
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        } catch {
          // gambar mungkin belum siap
        }
        rafIdRef.current = requestAnimationFrame(drawFrame)
      }
      drawFrame()

      // Simpan flag agar stopRecording bisa menghentikan loop gambar
      ;(window as unknown as Record<string, unknown>).__canonDrawStop = (): void => {
        drawing = false
      }

      stream = canvas.captureStream(30) as unknown as MediaStream
    } else {
      // Webcam: gunakan MediaStream dari <video> element
      const video = videoRef.current
      stream = (video?.srcObject as MediaStream | null) ?? null
    }

    if (!stream) {
      recordingPromiseRef.current = null
      return
    }

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'

      recordChunksRef.current = []
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_500_000
      })

      recorder.ondataavailable = (event): void => {
        if (event.data.size > 0) recordChunksRef.current.push(event.data)
      }

      recordingPromiseRef.current = new Promise<string | null>((resolve) => {
        recorder.onstop = (): void => {
          mediaRecorderRef.current = null
          recordingStartedRef.current = false

          // Hentikan loop gambar Canon jika aktif
          if (rafIdRef.current != null) {
            cancelAnimationFrame(rafIdRef.current)
            rafIdRef.current = null
          }
          const stopDraw = (window as unknown as Record<string, unknown>).__canonDrawStop as
            (() => void) | undefined
          if (stopDraw) {
            stopDraw()
            delete (window as unknown as Record<string, unknown>).__canonDrawStop
          }

          if (recordChunksRef.current.length === 0) {
            resolve(null)
            return
          }

          const blob = new Blob(recordChunksRef.current, { type: 'video/webm' })
          const reader = new FileReader()
          reader.onloadend = (): void =>
            resolve(typeof reader.result === 'string' ? reader.result : null)
          reader.onerror = (): void => resolve(null)
          reader.readAsDataURL(blob)
        }
      })

      recorder.start()
      mediaRecorderRef.current = recorder
      recordingStartedRef.current = true
      console.log(`[Recording] startRecording called, countdownSeconds=${countdownSeconds}`)
    } catch {
      recordingPromiseRef.current = null
    }
  }, [countdownSeconds, videoRef, cameraSettings])

  const stopRecording = useCallback((): void => {
    console.log(
      `[Recording] stopRecording called, mediaRecorder state=${mediaRecorderRef.current?.state}`
    )
    if (recordingStopTimerRef.current) {
      clearTimeout(recordingStopTimerRef.current)
      recordingStopTimerRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    const stopDraw = (window as unknown as Record<string, unknown>).__canonDrawStop as
      (() => void) | undefined
    if (stopDraw) {
      stopDraw()
      delete (window as unknown as Record<string, unknown>).__canonDrawStop
    }
    if (!mediaRecorderRef.current) recordingStartedRef.current = false
  }, [])

  const activeTemplateOverlay =
    templateOverlay?.path === templateOverlayPath ? templateOverlay.dataUrl : null

  const captureFrame = useCallback(
    async (shotIndex: number): Promise<string | null> => {
      if (capturingRef.current) return null
      capturingRef.current = true
      console.log(`[Recording] captureFrame called at shotIndex=${shotIndex}`)
      const settings = cameraSettings ?? DEFAULT_CAMERA_SETTINGS

      try {
        if (settings.source === 'canon') {
          // Lighting menyala tepat saat shot: beralih ke profil foto dulu
          // supaya eksposur kamera cocok dengan kondisi terang.
          await applyExposure(settings.photo, 'canon')
          // Ambil JPEG asli dari file yang ditulis cameraAPI di folder sesi,
          // lalu render sekali ke canvas hanya untuk preview/komposisi.
          const capture = await window.electron.camera.captureCanon({
            filename: `capture-${String(shotIndex + 1).padStart(2, '0')}.jpg`
          })
          const image = new Image()
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error('Hasil Canon tidak dapat dibaca.'))
            image.src = capture.dataUrl
          })
          const originalWidth = image.naturalWidth
          const originalHeight = image.naturalHeight
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
          // Tahan frame terakhir ~350ms agar video memiliki hold pada shot terakhir
          await new Promise<void>((resolve) => window.setTimeout(resolve, 350))
          stopRecording()
          const videoDataUrl = await Promise.race([
            recordingPromiseRef.current ?? Promise.resolve(null),
            new Promise<string | null>((resolve) => window.setTimeout(() => resolve(null), 1200))
          ])
          const shot: CapturedShot = {
            id: `${Date.now()}`,
            dataUrl: captured,
            width: canvas.width,
            height: canvas.height,
            videoDataUrl: videoDataUrl ?? undefined,
            mirror: settings.mirror,
            originalDataUrl: capture.dataUrl,
            originalWidth,
            originalHeight,
            savedPath: capture.filePath ?? undefined
          }
          setLastCaptured(shot)
          const priorShots = useSessionStore.getState().shots
          void composeTemplateImage({
            shots: [...priorShots, shot],
            jsonLayout: template.jsonLayout,
            layout: template.layout,
            overlayPath: template.overlayPath,
            frameIndex: undefined
          })
            .then((composed) => setReviewImage(composed.dataUrl))
            .catch(() => setReviewImage(captured))
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

        // Tahan frame terakhir ~350ms agar video memiliki hold pada shot terakhir
        await new Promise<void>((resolve) => window.setTimeout(resolve, 350))
        stopRecording()
        const videoDataUrl = await (recordingPromiseRef.current ?? Promise.resolve(null))

        const shot = {
          id: `${Date.now()}`,
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          videoDataUrl: videoDataUrl ?? undefined,
          mirror: settings.mirror
        }
        setLastCaptured(shot)
        const priorShots = useSessionStore.getState().shots
        void composeTemplateImage({
          shots: [...priorShots, shot],
          jsonLayout: template.jsonLayout,
          layout: template.layout,
          overlayPath: template.overlayPath,
          frameIndex: undefined
        })
          .then((composed) => setReviewImage(composed.dataUrl))
          .catch(() => setReviewImage(dataUrl))

        return dataUrl
      } finally {
        // Rekaman sudah berhenti (stopRecording dipanggil di jalur atas);
        // kembali ke profil video supaya countdown berikutnya benar.
        if (settings.source === 'canon') await applyExposure(settings.video, 'canon')
        capturingRef.current = false
      }
    },
    [applyExposure, cameraSettings, template, videoRef, stopRecording]
  )

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

  // Rasio kotak preview = rasio slot foto (frame aktif di template).
  // Dengan begitu template tampil dengan proporsinya sendiri (tidak "ditarik"
  // mengikuti kamera), lalu kamera di-fit ke dalam kotak itu; bagian yang tidak
  // terisi kamera dibiarkan hitam.
  const previewAspect = useMemo(() => {
    const canvasSize = getCanvasSize(template.jsonLayout)
    const frames = getFrames(
      template.jsonLayout,
      Math.max(currentShotIndex + 1, 1),
      canvasSize,
      template.layout
    )
    const frame = frames[currentShotIndex]

    if (frame && frame.width > 0 && frame.height > 0) return frame.width / frame.height

    return cameraSettings?.source === 'webcam' ? 4 / 3 : 3 / 2
  }, [cameraSettings?.source, currentShotIndex, template.jsonLayout, template.layout])

  useEffect(() => {
    let active = true
    if (!templateOverlayPath) return undefined

    // Overlay dirender pada rasio yang sama dengan kotak preview sehingga
    // frame template mengisi tepat area itu tanpa distorsi dan tanpa sisa.
    const overlayWidth = 1200
    const overlayHeight = Math.max(1, Math.round(overlayWidth / previewAspect))

    void loadTemplateFrameOverlayDataUrl(
      templateOverlayPath,
      template.jsonLayout,
      template.layout,
      currentShotIndex,
      overlayWidth,
      overlayHeight
    )
      .then((dataUrl) => {
        if (active) setTemplateOverlay({ path: templateOverlayPath, dataUrl })
      })
      .catch(() => undefined)

    return (): void => {
      active = false
    }
  }, [currentShotIndex, previewAspect, template.jsonLayout, template.layout, templateOverlayPath])

  // Rekam mulai saat countdown dimulai (termasuk saat retake).
  useEffect(() => {
    console.log(
      `[Recording] effect check: stage=${stage}, countdown=${countdown}, countdownSeconds=${countdownSeconds}`
    )
    if (stage === 'countdown' && countdown === countdownSeconds) {
      console.log(`[Recording] TRIGGER startRecording at countdown=${countdown}`)
      void applyProfile('video')
      startRecording()
    }
  }, [applyProfile, countdown, countdownSeconds, stage, startRecording])

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
    setReviewImage(null)
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

        <NeoButton onClick={retry} variant="secondary">
          Coba Lagi
        </NeoButton>
      </div>
    )
  }

  const rotatedShot = cameraSettings.orientation === 'portrait'
  const mirroredShot = cameraSettings.mirror

  return (
    <div
      ref={stageRef}
      className="camera-stage flex h-full flex-col items-center justify-center gap-4 bg-[#202020] p-4 fullscreen:bg-black md:p-6"
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-black shadow-xl ${stage === 'review' ? 'hidden' : ''}`}
        style={
          {
            '--preview-aspect': String(previewAspect),
            '--preview-ratio': String(previewAspect)
          } as CSSProperties
        }
      >
        {/*
          Lapisan kamera meniru persis cara composeTemplateImage menaruh foto
          ke slot: (rotate sesuai orientation → mirror → object-cover tengah).
          Dengan begitu bagian yang akan terpotong di template juga terpotong
          di preview, sehingga customer bisa menyesuaikan posisi berdiri.
        */}
        <div
          className="absolute"
          style={
            {
              left: '50%',
              top: '50%',
              width: rotatedShot ? 'calc(100% / var(--preview-ratio))' : '100%',
              height: rotatedShot ? 'calc(100% * var(--preview-ratio))' : '100%',
              transform: rotatedShot
                ? 'translate(-50%, -50%) rotate(90deg)'
                : 'translate(-50%, -50%)'
            } as CSSProperties
          }
        >
          {cameraSettings.source === 'canon' ? (
            <img
              ref={mjpegImgRef}
              src={`${CAMERA_API_URL}/video_feed`}
              crossOrigin="anonymous"
              alt="Live preview Canon"
              className={`h-full w-full object-cover ${mirroredShot ? '-scale-x-100' : ''}`}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${mirroredShot ? '-scale-x-100' : ''}`}
            />
          )}
        </div>

        {stage === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center ">
            {activeTemplateOverlay && (
              <img
                src={activeTemplateOverlay}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-fill"
              />
            )}
            <span className="relative text-8xl font-bold text-white drop-shadow-lg">
              {countdown}
            </span>
          </div>
        )}

        {stage === 'flash' && <div className="absolute inset-0 animate-pulse bg-white/80" />}

        <div className="absolute left-4 top-4 rounded-full bg-[--primary]/50 px-3 py-1 text-sm text-white">
          Foto {Math.min(currentShotIndex + 1, totalShots)} / {totalShots}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <canvas
        ref={recordingCanvasRef}
        className="pointer-events-none absolute left-[-9999px] top-0 h-px w-px opacity-0"
      />

      {stage === 'review' && lastCaptured && (
        <div className="w-full max-w-5xl grid grid-cols-4 items-center gap-4 text-white ">
          <div className="col-span-3 text-center">
            <p className="mb-2 font-black">Foto asli</p>
            <img
              src={lastCaptured.dataUrl}
              className="max-h-[65vh] w-full rounded-lg object-contain"
            />
          </div>
          <div className="col-span-1 text-center">
            <p className="mb-2 font-black">Dengan template</p>
            <img
              src={reviewImage ?? lastCaptured.dataUrl}
              className="max-h-[65vh] w-full rounded-lg object-contain"
            />
          </div>
          <p>Foto {currentShotIndex + 1}: sudah sesuai?</p>
          <div className="flex gap-3">
            <NeoButton onClick={retakeCurrent} variant="outlined">
              Ulangi
            </NeoButton>
            <NeoButton onClick={handleContinue}>Lanjutkan</NeoButton>
          </div>
        </div>
      )}

      {stage === 'idle' && (
        <NeoButton onClick={() => void startFullscreenCapture()} className="px-8 py-3 text-lg">
          Mulai Ambil Foto
        </NeoButton>
      )}

      {stage === 'done' && <p className="text-white">Selesai! Menyiapkan preview...</p>}

      {isActive && stage !== 'countdown' && stage !== 'flash' && stage !== 'review' && (
        <p className="text-sm text-gray-300">Bersiap untuk foto berikutnya...</p>
      )}
    </div>
  )
}
