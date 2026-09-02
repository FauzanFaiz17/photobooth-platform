import { useCallback, useEffect, useRef, useState } from 'react'

export interface WebcamDevice {
  deviceId: string
  label: string
}

export type WebcamStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'not-found' | 'error'

interface UseWebcamResult {
  videoRef: React.RefObject<HTMLVideoElement | null>
  status: WebcamStatus
  error: string | null
  devices: WebcamDevice[]
  activeDeviceId: string | null
  selectDevice: (deviceId: string) => void
  retry: () => void
  stream: MediaStream | null
}

/**
 * Mengelola akses webcam (bukan kamera Canon/DSLR - itu ditangani lewat
 * cameraAPI/EDSDK di backend lokal FastAPI). Dipakai sebagai pengganti
 * sementara saat kamera DSLR tidak tersedia.
 */
export function useWebcam(): UseWebcamResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [status, setStatus] = useState<WebcamStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<WebcamDevice[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())

      streamRef.current = null
      setStream(null)
    }
  }, [])

  const startStream = useCallback(
    async (deviceId?: string) => {
      setStatus('requesting')

      setError(null)

      stopStream()

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' },
          audio: false
        })

        streamRef.current = stream
        setStream(stream)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        const track = stream.getVideoTracks()[0]

        if (track) {
          setActiveDeviceId(track.getSettings().deviceId ?? null)
        }

        // enumerateDevices baru dapat label lengkap setelah permission diberikan
        const allDevices = await navigator.mediaDevices.enumerateDevices()

        const videoInputs = allDevices
          .filter((d) => d.kind === 'videoinput')
          .map((d, index) => ({
            deviceId: d.deviceId,
            label: d.label || `Kamera ${index + 1}`
          }))

        setDevices(videoInputs)

        setStatus('ready')
      } catch (err) {
        stopStream()

        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setStatus('denied')

            setError('Akses webcam ditolak. Izinkan akses kamera di pengaturan sistem/browser.')

            return
          }

          if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            setStatus('not-found')

            setError('Webcam tidak ditemukan. Pastikan webcam terpasang dengan benar.')

            return
          }
        }

        setStatus('error')

        setError(err instanceof Error ? err.message : 'Gagal mengakses webcam.')
      }
    },
    [stopStream]
  )

  useEffect(() => {
    startStream(activeDeviceId ?? undefined)

    return () => {
      stopStream()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryToken])

  useEffect(() => {
    if (status === 'ready' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [status])
  const selectDevice = useCallback(
    (deviceId: string) => {
      setActiveDeviceId(deviceId)

      startStream(deviceId)
    },
    [startStream]
  )

  const retry = useCallback(() => {
    setRetryToken((token) => token + 1)
  }, [])

  return {
    videoRef,
    status,
    error,
    devices,
    activeDeviceId,
    selectDevice,
    retry,
    stream
  }
}
