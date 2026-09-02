import { useCallback, useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'

import { getApiErrorMessage } from '@/api/axios'
import { completePhotoSession, createPhotoSession, uploadSessionMedia } from '@/api/media'
import { NeoButton } from '@/components/shared/button'
import { getAppSettings, getPrinterSettings } from '@/features/settings/deviceSettings'
import { useSessionStore } from '@/store/sessionStore'

const focusRing =
  'focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-(--danger)'

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
  const galleryUrl = useSessionStore((state) => state.galleryUrl)
  const setGalleryUrl = useSessionStore((state) => state.setGalleryUrl)
  const resetTransaction = useSessionStore((state) => state.resetTransaction)
  const setLocalDirectory = useSessionStore((state) => state.setLocalDirectory)
  const setRemoteSession = useSessionStore((state) => state.setRemoteSession)
  const setSyncStatus = useSessionStore((state) => state.setSyncStatus)
  const setUploadedShotCount = useSessionStore((state) => state.setUploadedShotCount)
  const setComposedImageUploaded = useSessionStore((state) => state.setComposedImageUploaded)
  const setAnimatedGifUploaded = useSessionStore((state) => state.setAnimatedGifUploaded)
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
      !animatedGif
    ) {
      setSyncStatus('failed', 'Data sesi foto tidak lengkap.')
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

  const status = processing
    ? { label: 'Memproses', tone: 'bg-(--accent)' }
    : syncStatus === 'synced'
      ? syncError
        ? { label: 'Tersinkron sebagian', tone: 'bg-(--primary)' }
        : { label: 'Tersinkron', tone: 'bg-(--accent)' }
      : syncStatus === 'local-only'
        ? { label: 'Tersimpan lokal', tone: 'bg-(--secondary)' }
        : { label: 'Gagal disimpan', tone: 'bg-(--danger) text-white' }

  const showQr = !processing && syncStatus === 'synced' && Boolean(qrDataUrl)
  const retryable = !processing && (syncStatus === 'local-only' || syncStatus === 'failed')

  return (
    <main className="grid h-full min-h-[520px] place-items-center">
      <section className="relative grid w-full max-w-5xl overflow-hidden border-4 border-(--border) bg-(--surface) text-(--foreground) shadow-[12px_12px_0_0_var(--border)] md:grid-cols-[1.05fr_0.95fr]">
        <span
          className="absolute left-0 top-0 h-4 w-32 border-b-4 border-r-4 border-(--border) bg-(--primary)"
          aria-hidden="true"
        />

        <div className="flex flex-col justify-between border-b-4 border-(--border) p-7 pt-12 md:border-b-0 md:border-r-4 md:p-10 md:pt-14">
          <div>
            <p
              className={`w-fit border-2 border-(--border) px-3 py-2 text-xs font-black uppercase tracking-wider ${status.tone}`}
            >
              {status.label}
            </p>
            <h1 className="mt-5 text-5xl font-black leading-[0.88] tracking-[-0.04em] text-balance sm:text-6xl">
              {processing ? 'Menyimpan Foto' : 'Sesi Selesai'}
            </h1>

            {processing && (
              <p className="mt-6 max-w-md text-lg font-semibold leading-7 text-(--muted-foreground)">
                Foto sedang disimpan, diunggah, dan dicetak. Mohon tunggu sebentar.
              </p>
            )}

            {!processing && syncStatus === 'synced' && (
              <p className="mt-6 max-w-md text-lg font-semibold leading-7 text-(--muted-foreground)">
                Foto sudah tersinkron ke server.
                {syncError ? ` ${syncError}` : ''}
              </p>
            )}

            {!processing && syncStatus === 'local-only' && (
              <p className="mt-6 max-w-md border-4 border-(--border) bg-(--secondary) p-4 font-bold leading-6 shadow-[var(--shadow-neo)]">
                Foto tersimpan lokal, tetapi belum tersinkron ke server.
                {syncError ? ` ${syncError}` : ''}
              </p>
            )}

            {!processing && syncStatus === 'failed' && (
              <p
                role="alert"
                className="mt-6 max-w-md border-4 border-(--border) bg-(--danger) p-4 font-bold leading-6 text-white shadow-[var(--shadow-neo)]"
              >
                {syncError ?? 'Foto tidak dapat disimpan.'}
              </p>
            )}
          </div>

          {localDirectory && (
            <div className="mt-8 border-2 border-(--border) bg-(--background) p-3">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-(--muted-foreground)">
                Tersimpan di
              </p>
              <p className="mt-1 break-all font-mono text-xs font-semibold">{localDirectory}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between bg-(--primary) p-7 md:p-10">
          <div>
            <div className="mb-8 flex items-start justify-between gap-4">
              <span className="border-2 border-(--border) bg-(--surface) px-3 py-2 text-xs font-black uppercase">
                {showQr ? 'Ambil foto kamu' : 'Selesai'}
              </span>
              <span className="text-4xl font-black leading-none" aria-hidden="true">
                &#10039;
              </span>
            </div>

            {showQr ? (
              <div className="flex flex-col items-center gap-5">
                <img
                  src={qrDataUrl as string}
                  alt="QR kode galeri foto"
                  className="h-56 w-56 border-4 border-(--border) bg-white p-3 shadow-[var(--shadow-neo)] md:h-64 md:w-64"
                />
                <p className="max-w-xs text-center text-xl font-black leading-tight">
                  Pindai QR untuk melihat &amp; mengunduh fotomu.
                </p>
              </div>
            ) : (
              <p className="max-w-xs text-2xl font-black leading-tight">
                {processing
                  ? 'Jangan tutup layar ini sampai proses selesai.'
                  : 'Terima kasih sudah berfoto di booth kami.'}
              </p>
            )}
          </div>

          {!processing && (
            <div className="mt-10 grid gap-4">
              {retryable && (
                <NeoButton
                  onClick={() => void finalizeSession()}
                  className={`w-full bg-(--danger) px-6 py-4 text-lg text-white shadow-[var(--shadow-neo)] [transition:none] hover:bg-[#cf3d26] ${focusRing}`}
                >
                  Coba Sinkronkan Lagi
                </NeoButton>
              )}
              <NeoButton
                variant="outlined"
                onClick={returnToDashboard}
                className={`w-full px-6 py-4 text-base shadow-[var(--shadow-neo)] [transition:none] ${focusRing}`}
              >
                Kembali ke Beranda
              </NeoButton>
              {secondsLeft !== null && (
                <p className="border-2 border-(--border) bg-(--surface) px-4 py-3 text-center text-sm font-black uppercase tracking-wider tabular-nums">
                  Kembali otomatis dalam {secondsLeft} detik
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
