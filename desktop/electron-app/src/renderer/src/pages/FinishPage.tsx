import { useCallback, useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'

import { getApiErrorMessage } from '@/api/axios'
import { completePhotoSession, createPhotoSession, uploadSessionMedia } from '@/api/media'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { getAppSettings, getPrinterSettings } from '@/features/settings/deviceSettings'
import { useSessionStore } from '@/store/sessionStore'

export default function FinishPage(): JSX.Element {
  const navigate = useNavigate()
  const eventConfiguration = useSessionStore((state) => state.eventConfiguration)
  const shots = useSessionStore((state) => state.shots)
  const syncStatus = useSessionStore((state) => state.syncStatus)
  const syncError = useSessionStore((state) => state.syncError)
  const localDirectory = useSessionStore((state) => state.localDirectory)
  const composedImage = useSessionStore((state) => state.composedImage)
  const printImage = useSessionStore((state) => state.printImage)
  const paperSize = useSessionStore((state) => state.paperSize)
  const quantity = useSessionStore((state) => state.quantity)
  const animatedGif = useSessionStore((state) => state.animatedGif)
  const composedVideo = useSessionStore((state) => state.composedVideo)
  const composedVideoUploaded = useSessionStore((state) => state.composedVideoUploaded)
  const galleryUrl = useSessionStore((state) => state.galleryUrl)
  const setGalleryUrl = useSessionStore((state) => state.setGalleryUrl)
  const resetTransaction = useSessionStore((state) => state.resetTransaction)
  const setLocalDirectory = useSessionStore((state) => state.setLocalDirectory)
  const setRemoteSession = useSessionStore((state) => state.setRemoteSession)
  const setSyncStatus = useSessionStore((state) => state.setSyncStatus)
  const setUploadedShotCount = useSessionStore((state) => state.setUploadedShotCount)
  const setComposedImageUploaded = useSessionStore((state) => state.setComposedImageUploaded)
  const setAnimatedGifUploaded = useSessionStore((state) => state.setAnimatedGifUploaded)
  const setComposedVideoUploaded = useSessionStore((state) => state.setComposedVideoUploaded)
  const setPrintedLocally = useSessionStore((state) => state.setPrintedLocally)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [qrTimerSeconds, setQrTimerSeconds] = useState<number | null>(null)
  const [processing, setProcessing] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const startedRef = useRef(false)

  const finalizeSession = useCallback(async (): Promise<void> => {
    if (
      !eventConfiguration ||
      shots.length === 0 ||
      !composedImage ||
      !printImage ||
      !paperSize ||
      !animatedGif ||
      !composedVideo
    ) {
      setSyncStatus('failed', 'Video template belum berhasil dibuat. Silakan coba lagi.')
      setProcessing(false)
      return
    }

    setProcessing(true)
    setSyncStatus('syncing')

    let localSaveError: string | null = null
    let currentDirectory = useSessionStore.getState().localDirectory

    if (!currentDirectory) {
      try {
        const appSettings = await getAppSettings()
        const saved = await window.session.saveWebcamShots(
          shots.map((shot) => shot.dataUrl),
          composedImage.dataUrl,
          animatedGif.dataUrl,
          composedVideo?.dataUrl,
          appSettings.storageDirectory
        )
        currentDirectory = saved.directory
        setLocalDirectory(saved.directory)
      } catch (error) {
        localSaveError = getApiErrorMessage(
          error,
          'Foto tidak dapat disimpan ke penyimpanan lokal.'
        )
      }

    }

    try {
      let sessionId = useSessionStore.getState().remoteSessionId

      if (!sessionId) {
        const session = await createPhotoSession(eventConfiguration.event.id)
        sessionId = session.id
        setRemoteSession(session.id)
      }

      const firstPendingIndex = useSessionStore.getState().uploadedShotCount

      for (let index = firstPendingIndex; index < shots.length; index += 1) {
        const shot = shots[index]

        await uploadSessionMedia(sessionId, {
          type: 'original',
          filename: `capture-${String(index + 1).padStart(2, '0')}.png`,
          mime_type: 'image/png',
          data_url: shot.dataUrl,
          width: shot.width,
          height: shot.height
        })

        setUploadedShotCount(index + 1)
      }


      if (!useSessionStore.getState().composedImageUploaded) {
        await uploadSessionMedia(sessionId, {
          type: 'template',
          filename: 'final-composite.png',
          mime_type: 'image/png',
          data_url: composedImage.dataUrl,
          width: composedImage.width,
          height: composedImage.height
        })
        setComposedImageUploaded(true)
      }

      if (!useSessionStore.getState().animatedGifUploaded) {
        await uploadSessionMedia(sessionId, {
          type: 'gif',
          filename: 'session-animation.gif',
          mime_type: 'image/gif',
          data_url: animatedGif.dataUrl,
          width: animatedGif.width,
          height: animatedGif.height,
          duration_seconds: animatedGif.durationSeconds
        })
        setAnimatedGifUploaded(true)
      }

      if (composedVideo && !composedVideoUploaded) {
        await uploadSessionMedia(sessionId, { type: 'video', filename: 'template-video.webm', mime_type: 'video/webm', data_url: composedVideo.dataUrl, width: composedVideo.width, height: composedVideo.height, duration_seconds: composedVideo.durationSeconds })
        setComposedVideoUploaded(true)
      }

      let printAccepted = useSessionStore.getState().printedLocally
      if (!printAccepted) {
        const printer = await getPrinterSettings()
        if (!printer) {
          throw new Error('Printer belum dipilih. Buka Settings lalu jalankan Test Printer.')
        }

        await window.electron.printer.printImage({
          dataUrl: printImage.dataUrl,
          deviceName: printer.deviceName,
          copies: Math.max(1, quantity),
          paperSize,
          orientation: eventConfiguration.printer.orientation
        })
        printAccepted = true
        setPrintedLocally(true)
      }

      await completePhotoSession(sessionId, printAccepted).then((session) => {
        setGalleryUrl(session.gallery?.url ?? null)
      })
      setSyncStatus('synced', localSaveError)
    } catch (error) {
      const message = getApiErrorMessage(error, 'Foto belum dapat disinkronkan ke server.')

      if (currentDirectory) {
        setSyncStatus('local-only', message)
      } else {
        setSyncStatus('failed', localSaveError ? `${localSaveError} ${message}` : message)
      }
    } finally {
      setProcessing(false)
    }
  }, [
    eventConfiguration,
    composedImage,
    printImage,
    paperSize,
    quantity,
    animatedGif,
    setLocalDirectory,
    setRemoteSession,
    setSyncStatus,
    setUploadedShotCount,
    setComposedImageUploaded,
    setAnimatedGifUploaded,
    composedVideo,
    composedVideoUploaded,
    setComposedVideoUploaded,
    setPrintedLocally,
    setGalleryUrl,
    shots
  ])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void finalizeSession()
  }, [finalizeSession])

  useEffect(() => {
    void getAppSettings().then((settings) => setQrTimerSeconds(settings.qrTimerSeconds))
  }, [])

  useEffect(() => {
    if (!galleryUrl) return

    let cancelled = false

    QRCode.toDataURL(galleryUrl, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M'
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [galleryUrl])

  useEffect(() => {
    if (processing || !qrDataUrl || qrTimerSeconds === null) return

    const initializeTimer = window.setTimeout(() => setSecondsLeft(qrTimerSeconds), 0)

    const interval = window.setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, (previous ?? qrTimerSeconds) - 1))
    }, 1000)

    const timeout = window.setTimeout(() => {
      window.clearInterval(interval)
      resetTransaction()
      navigate('/welcome', { replace: true })
    }, qrTimerSeconds * 1000)

    return () => {
      window.clearTimeout(initializeTimer)
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [navigate, processing, qrDataUrl, qrTimerSeconds, resetTransaction])

  function returnToDashboard(): void {
    resetTransaction()
    navigate('/welcome', { replace: true })
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
      <h1 className="text-3xl font-bold text-slate-800">
        {processing ? 'Menyimpan Foto' : 'Sesi Selesai'}
      </h1>

      {processing && (
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      )}

      {!processing && syncStatus === 'synced' && (
        <Alert type={syncError ? 'warning' : 'success'}>
          Foto sudah tersinkron ke server.
          {syncError ? ` ${syncError}` : ''}
        </Alert>
      )}

      {!processing && syncStatus === 'synced' && qrDataUrl && (
        <div className="flex flex-col items-center gap-2">
          <img
            src={qrDataUrl}
            alt="QR kode galeri foto"
            className="h-48 w-48 rounded-lg border border-slate-200 bg-white p-2"
          />
          <p className="max-w-xs text-sm text-slate-600">
            Scan QR untuk melihat &amp; mengunduh foto Anda
          </p>
        </div>
      )}

      {!processing && syncStatus === 'local-only' && (
        <Alert type="warning">
          Foto tersimpan lokal, tetapi belum tersinkron ke server.
          {syncError ? ` ${syncError}` : ''}
        </Alert>
      )}

      {!processing && syncStatus === 'failed' && (
        <Alert type="error">{syncError ?? 'Foto tidak dapat disimpan.'}</Alert>
      )}

      {localDirectory && (
        <p className="max-w-xl break-all text-sm text-slate-500">{localDirectory}</p>
      )}

      {!processing && (syncStatus === 'local-only' || syncStatus === 'failed') && (
        <Button onClick={() => void finalizeSession()}>Coba Sinkronkan Lagi</Button>
      )}

      {!processing && (
        <div className="flex flex-col gap-2">
          <Button onClick={returnToDashboard} className="bg-slate-600 hover:bg-slate-700">
            Kembali ke Beranda
          </Button>
          {secondsLeft !== null && (
            <p className="text-sm text-slate-400">Kembali otomatis dalam {secondsLeft} detik</p>
          )}
        </div>
      )}
    </div>
  )
}
