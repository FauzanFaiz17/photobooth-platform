import { useCallback, useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '@/api/axios'
import { completePhotoSession, createPhotoSession, uploadSessionMedia } from '@/api/media'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import { useSessionStore } from '@/store/sessionStore'

const AUTO_REDIRECT_SECONDS = 10

export default function FinishPage(): JSX.Element {
  const navigate = useNavigate()
  const eventConfiguration = useSessionStore((state) => state.eventConfiguration)
  const shots = useSessionStore((state) => state.shots)
  const syncStatus = useSessionStore((state) => state.syncStatus)
  const syncError = useSessionStore((state) => state.syncError)
  const localDirectory = useSessionStore((state) => state.localDirectory)
  const composedImage = useSessionStore((state) => state.composedImage)
  const reset = useSessionStore((state) => state.reset)
  const setLocalDirectory = useSessionStore((state) => state.setLocalDirectory)
  const setRemoteSession = useSessionStore((state) => state.setRemoteSession)
  const setSyncStatus = useSessionStore((state) => state.setSyncStatus)
  const setUploadedShotCount = useSessionStore((state) => state.setUploadedShotCount)
  const setComposedImageUploaded = useSessionStore((state) => state.setComposedImageUploaded)
  const [secondsLeft, setSecondsLeft] = useState(AUTO_REDIRECT_SECONDS)
  const [processing, setProcessing] = useState(true)
  const startedRef = useRef(false)

  const finalizeSession = useCallback(async (): Promise<void> => {
    if (!eventConfiguration || shots.length === 0 || !composedImage) {
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
        const saved = await window.session.saveWebcamShots(
          shots.map((shot) => shot.dataUrl),
          composedImage.dataUrl
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
          type: 'edited',
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

      await completePhotoSession(sessionId)
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
    setLocalDirectory,
    setRemoteSession,
    setSyncStatus,
    setUploadedShotCount,
    setComposedImageUploaded,
    shots
  ])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void finalizeSession()
  }, [finalizeSession])

  useEffect(() => {
    if (processing) return

    const interval = window.setInterval(() => {
      setSecondsLeft((previous) => {
        if (previous <= 1) {
          window.clearInterval(interval)
          reset()
          navigate('/dashboard', { replace: true })
          return 0
        }

        return previous - 1
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [navigate, processing, reset])

  function returnToDashboard(): void {
    reset()
    navigate('/dashboard', { replace: true })
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
          <p className="text-sm text-slate-400">Kembali otomatis dalam {secondsLeft} detik</p>
        </div>
      )}
    </div>
  )
}
