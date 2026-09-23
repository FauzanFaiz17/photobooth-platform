import { useCallback, useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'

import { getApiErrorMessage } from '@/api/axios'
import {
  completePhotoSession,
  createPhotoSession,
  uploadSessionMedia,
  recordPrintJob
} from '@/api/media'
import { NeoButton } from '@/components/shared/button'
import {
  getAppSettings,
  getPrinterSettings,
  getDeviceNameForPaperSize
} from '@/features/settings/deviceSettings'
import { composeTemplateImage, getQrLayout } from '@/features/template/services/composeTemplate'
import { createSessionGif } from '@/features/gif/services/createSessionGif'
import { useSessionStore } from '@/store/sessionStore'
import { useDeviceStore } from '@/store/deviceStore'

const focusRing =
  'focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-(--danger)'

async function applyPrinterTransform(
  dataUrl: string,
  scale: number,
  horizontal: number,
  vertical: number
): Promise<string> {
  const image = new Image()
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Gambar print tidak dapat dibaca.'))
    image.src = dataUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d')
  if (!context) return dataUrl
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.translate((horizontal / 100) * canvas.width, (vertical / 100) * canvas.height)
  context.translate(canvas.width / 2, canvas.height / 2)
  context.scale(scale / 100, scale / 100)
  context.drawImage(image, -canvas.width / 2, -canvas.height / 2)
  return canvas.toDataURL('image/png')
}

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
  const [autoPrint, setAutoPrint] = useState(true)
  const [manualQuantity, setManualQuantity] = useState(1)
  const [manualPrinting, setManualPrinting] = useState(false)
  const [manualPrintError, setManualPrintError] = useState<string | null>(null)
  const startedRef = useRef(false)
  const composingRef = useRef(false)

  const template = useSessionStore((state) => state.template)
  const filter = useSessionStore((state) => state.filter)
  const setComposedImage = useSessionStore((state) => state.setComposedImage)
  const setAnimatedGif = useSessionStore((state) => state.setAnimatedGif)
  const setPrintImage = useSessionStore((state) => state.setPrintImage)

  useEffect(() => {
    if (composingRef.current) return
    if (composedImage && printImage && animatedGif) return
    if (!template || shots.length === 0) return

    composingRef.current = true

    const gifEnabled = eventConfiguration?.event.gif_enabled ?? true

    void Promise.all([
      composeTemplateImage({
        shots,
        jsonLayout: template.jsonLayout,
        layout: template.layout,
        overlayPath: template.overlayPath
      }),
      gifEnabled ? createSessionGif(shots, eventConfiguration?.gif_template?.png_url) : Promise.resolve(null),
      filter
        ? composeTemplateImage({
            shots,
            jsonLayout: template.jsonLayout,
            layout: template.layout,
            overlayPath: template.overlayPath,
            cssFilter: filter.cssFilter
          })
        : null
    ])
      .then(([composed, gif, filtered]) => {
        if (!composedImage && composed) setComposedImage(composed)
        if (!animatedGif && gif) setAnimatedGif(gif)
        if (!printImage) setPrintImage(filtered ?? composed)
      })
      .catch(() => {})
  }, [
    composedImage,
    printImage,
    animatedGif,
    template,
    shots,
    filter,
    eventConfiguration,
    setComposedImage,
    setAnimatedGif,
    setPrintImage
  ])

  const finalizeSession = useCallback(async (): Promise<void> => {
    const gifEnabled = eventConfiguration?.event.gif_enabled ?? true
    const videoEnabled = eventConfiguration?.event.video_enabled ?? true
    const hasGif = gifEnabled ? Boolean(animatedGif) : true

    if (
      !eventConfiguration ||
      shots.length === 0 ||
      !composedImage ||
      !printImage ||
      !paperSize ||
      !hasGif
    ) {
      setSyncStatus('failed', 'Template belum berhasil dibuat. Silakan coba lagi.')
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
        const cameraServiceDirectory = useSessionStore.getState().cameraServiceDirectory
        const saved = await window.session.saveWebcamShots(
          shots.map((shot) => ({
            dataUrl: shot.dataUrl,
            savedPath: shot.savedPath ?? null
          })),
          composedImage.dataUrl,
          gifEnabled ? animatedGif?.dataUrl : undefined,
          videoEnabled ? composedVideo?.dataUrl : undefined,
          cameraServiceDirectory ?? appSettings.storageDirectory,
          { exactDirectory: Boolean(cameraServiceDirectory) }
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
      let earlyGalleryUrl = useSessionStore.getState().galleryUrl

      if (!sessionId) {
        const session = await createPhotoSession(eventConfiguration.event.id)
        sessionId = session.id
        setRemoteSession(session.id)
        if (session.gallery?.url && !earlyGalleryUrl) {
          earlyGalleryUrl = session.gallery.url
          setGalleryUrl(session.gallery.url)
        }
      }

      const firstPendingIndex = useSessionStore.getState().uploadedShotCount

      for (let index = firstPendingIndex; index < shots.length; index += 1) {
        const shot = shots[index]

        if (shot.originalDataUrl) {
          // Unggah JPEG asli dari kamera Canon tanpa re-render canvas.
          await uploadSessionMedia(sessionId, {
            type: 'original',
            filename: `capture-${String(index + 1).padStart(2, '0')}.jpg`,
            mime_type: 'image/jpeg',
            data_url: shot.originalDataUrl,
            width: shot.originalWidth ?? shot.width,
            height: shot.originalHeight ?? shot.height
          })
        } else {
          await uploadSessionMedia(sessionId, {
            type: 'original',
            filename: `capture-${String(index + 1).padStart(2, '0')}.png`,
            mime_type: 'image/png',
            data_url: shot.dataUrl,
            width: shot.width,
            height: shot.height
          })
        }

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

      if (gifEnabled && !useSessionStore.getState().animatedGifUploaded && animatedGif) {
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

      if (videoEnabled && composedVideo && !composedVideoUploaded) {
        await uploadSessionMedia(sessionId, {
          type: 'video',
          filename: 'template-video.webm',
          mime_type: 'video/webm',
          data_url: composedVideo.dataUrl,
          width: composedVideo.width,
          height: composedVideo.height,
          duration_seconds: composedVideo.durationSeconds
        })
        setComposedVideoUploaded(true)
      }

      // QR pada hasil cetak: gallery URL harus sudah ada sejak createPhotoSession.
      const qrLayout = template ? getQrLayout(template.jsonLayout) : null
      let printDataUrl = useSessionStore.getState().printImage?.dataUrl ?? printImage.dataUrl
      let printWidth = useSessionStore.getState().printImage?.width ?? printImage.width
      let printHeight = useSessionStore.getState().printImage?.height ?? printImage.height

      if (qrLayout) {
        if (!earlyGalleryUrl) {
          setSyncStatus(
            'failed',
            'URL gallery belum tersedia untuk QR cetak. Coba sinkronkan lagi.'
          )
          setProcessing(false)
          return
        }

        const qrDataUrl = await QRCode.toDataURL(earlyGalleryUrl, {
          width: 512,
          margin: 1,
          errorCorrectionLevel: 'M'
        })
        const recomposed = await composeTemplateImage({
          shots,
          jsonLayout: template!.jsonLayout,
          layout: template!.layout,
          overlayPath: template!.overlayPath,
          cssFilter: filter?.cssFilter ?? 'none',
          qrDataUrl
        })
        printDataUrl = recomposed.dataUrl
        printWidth = recomposed.width
        printHeight = recomposed.height
        setPrintImage(recomposed)
      }

      let printAccepted = useSessionStore.getState().printedLocally
      let printWarning: string | null = null
      if (!printAccepted) {
        const printer = await getPrinterSettings()
        if (!printer) {
          printWarning = 'Printer belum dipilih; sesi tetap disimpan ke gallery.'
        } else if (printer.autoPrint) {
          try {
            const transformedPrintDataUrl = await applyPrinterTransform(
              printDataUrl,
              printer.scale,
              printer.horizontalPosition,
              printer.verticalPosition
            )
            await window.electron.printer.printImage({
              dataUrl: transformedPrintDataUrl,
              deviceName: getDeviceNameForPaperSize(printer, paperSize),
              copies: Math.max(1, quantity),
              orientation: eventConfiguration.printer.orientation
            })
            printAccepted = true
            setPrintedLocally(true)
            const deviceUuid = useDeviceStore.getState().fingerprint?.deviceUuid
            if (deviceUuid) {
              try {
                await recordPrintJob({
                  device_uuid: deviceUuid,
                  photo_session_id: sessionId,
                  paper_size: paperSize,
                  copies: Math.max(1, quantity)
                })
              } catch (recordError) {
                console.error('[print] Gagal mencatat print_jobs:', recordError)
                printWarning = getApiErrorMessage(
                  recordError,
                  'Print berhasil, tetapi riwayat ke server gagal dicatat.'
                )
              }
            } else {
              printWarning =
                'Print berhasil, tetapi device UUID tidak tersedia untuk mencatat riwayat.'
            }
          } catch (error) {
            printWarning = getApiErrorMessage(
              error,
              'Printer tidak dapat digunakan; sesi tetap disimpan ke gallery.'
            )
          }
        }
      }

      await completePhotoSession(sessionId, printAccepted).then((session) => {
        if (session.gallery?.url) {
          setGalleryUrl(session.gallery.url)
        }
      })
      setSyncStatus('synced', [localSaveError, printWarning].filter(Boolean).join(' ') || null)
      // Simpan print image yang sudah ber-QR agar handleManualPrint ikut konsisten.
      if (qrLayout) {
        setPrintImage({ dataUrl: printDataUrl, width: printWidth, height: printHeight })
      }
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
    setPrintImage,
    shots,
    template,
    filter
  ])

  useEffect(() => {
    if (startedRef.current) return
    const gifEnabled = eventConfiguration?.event.gif_enabled ?? true
    const hasGif = gifEnabled ? Boolean(animatedGif) : true
    if (!composedImage || !printImage || !hasGif) return
    startedRef.current = true
    void finalizeSession()
  }, [composedImage, printImage, animatedGif, eventConfiguration, finalizeSession])

  useEffect(() => {
    void getAppSettings().then((settings) => setQrTimerSeconds(settings.qrTimerSeconds))
  }, [])

  useEffect(() => {
    void getPrinterSettings().then((printer) => {
      if (printer) {
        setAutoPrint(printer.autoPrint)
        setManualQuantity(Math.max(1, quantity))
      }
    })
  }, [quantity])

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

  async function handleManualPrint(): Promise<void> {
    const currentPrintImage = useSessionStore.getState().printImage
    if (!currentPrintImage || !paperSize || !eventConfiguration) return
    const printer = await getPrinterSettings()
    if (!printer) return

    setManualPrinting(true)
    setManualPrintError(null)
    try {
      const printDataUrl = await applyPrinterTransform(
        currentPrintImage.dataUrl,
        printer.scale,
        printer.horizontalPosition,
        printer.verticalPosition
      )
      await window.electron.printer.printImage({
        dataUrl: printDataUrl,
        deviceName: getDeviceNameForPaperSize(printer, paperSize),
        copies: Math.max(1, manualQuantity),
        orientation: eventConfiguration.printer.orientation
      })
      setPrintedLocally(true)
      const deviceUuid = useDeviceStore.getState().fingerprint?.deviceUuid
      if (deviceUuid) {
        try {
          await recordPrintJob({
            device_uuid: deviceUuid,
            photo_session_id: useSessionStore.getState().remoteSessionId,
            paper_size: paperSize,
            copies: Math.max(1, manualQuantity)
          })
        } catch (recordError) {
          console.error('[print] Gagal mencatat print_jobs:', recordError)
          setManualPrintError(
            getApiErrorMessage(
              recordError,
              'Print berhasil, tetapi riwayat ke server gagal dicatat.'
            )
          )
        }
      } else {
        setManualPrintError(
          'Print berhasil, tetapi device UUID tidak tersedia untuk mencatat riwayat.'
        )
      }
    } catch (error) {
      setManualPrintError(error instanceof Error ? error.message : 'Print gagal.')
    } finally {
      setManualPrinting(false)
    }
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
                Foto sedang disimpan dan diunggah. Mohon tunggu sebentar.
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
                {!autoPrint && !useSessionStore.getState().printedLocally && (
                  <>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => setManualQuantity((q) => Math.max(1, q - 1))}
                        className="flex h-10 w-10 items-center justify-center border-2 border-(--border) bg-(--surface) text-xl font-bold shadow-[var(--shadow-neo)] [transition:none] hover:bg-(--background)"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-lg font-black tabular-nums">
                        {manualQuantity}
                      </span>
                      <button
                        onClick={() => setManualQuantity((q) => Math.min(20, q + 1))}
                        className="flex h-10 w-10 items-center justify-center border-2 border-(--border) bg-(--surface) text-xl font-bold shadow-[var(--shadow-neo)] [transition:none] hover:bg-(--background)"
                      >
                        +
                      </button>
                      <NeoButton
                        onClick={() => void handleManualPrint()}
                        disabled={manualPrinting}
                        className={`ml-2 px-5 py-2 shadow-[var(--shadow-neo)] [transition:none] ${focusRing}`}
                      >
                        {manualPrinting ? 'Mencetak...' : 'Cetak'}
                      </NeoButton>
                    </div>
                    {manualPrintError && (
                      <p className="mt-2 max-w-xs text-center text-sm font-bold text-red-200">
                        {manualPrintError}
                      </p>
                    )}
                  </>
                )}
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
