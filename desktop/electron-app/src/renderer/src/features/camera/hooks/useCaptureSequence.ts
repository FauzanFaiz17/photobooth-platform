import { useCallback, useEffect, useRef, useState } from 'react'

export type CaptureStage = 'idle' | 'countdown' | 'flash' | 'review' | 'done'

interface UseCaptureSequenceOptions {
  totalShots: number
  countdownSeconds: number
  reviewPauseMs?: number
  onCapture: (shotIndex: number) => string | null | Promise<string | null>
  onComplete?: () => void
}

interface UseCaptureSequenceResult {
  stage: CaptureStage
  countdown: number
  currentShotIndex: number
  start: () => void
  continueAfterReview: () => void
  retakeCurrent: () => void
  isActive: boolean
}

/**
 * Mengatur alur: idle -> countdown (3..1) -> flash + capture -> jeda review
 * -> ulangi sampai totalShots tercapai -> done.
 *
 * runCountdownTick disimpan lewat ref (bukan useCallback yang memanggil
 * dirinya sendiri) supaya tidak ada masalah "use before define" dan supaya
 * closure-nya selalu memakai nilai onCapture/onComplete/dst yang terbaru.
 */
export function useCaptureSequence({
  totalShots,
  countdownSeconds,
  reviewPauseMs = 900,
  onCapture,
  onComplete
}: UseCaptureSequenceOptions): UseCaptureSequenceResult {
  const [stage, setStage] = useState<CaptureStage>('idle')
  const [countdown, setCountdown] = useState(countdownSeconds)
  const [currentShotIndex, setCurrentShotIndex] = useState(0)
  const currentShotIndexRef = useRef(0)

  useEffect(() => {
    currentShotIndexRef.current = currentShotIndex
  }, [currentShotIndex])

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const tickRef = useRef<(secondsLeft: number) => void>(() => {})

  const clearPendingTimeout = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const captureInProgressRef = useRef(false)

  useEffect(() => {
    tickRef.current = (secondsLeft: number): void => {
      console.log(`[Countdown] tick: secondsLeft=${secondsLeft}`)
      setCountdown(secondsLeft)

      if (secondsLeft <= 0) {
        setStage('flash')

        if (captureInProgressRef.current) return
        captureInProgressRef.current = true

        void Promise.resolve(onCapture(currentShotIndexRef.current))
          .then((captured) => {
            captureInProgressRef.current = false
            if (!captured) {
              setStage('idle')
              return
            }

            timeoutRef.current = setTimeout(() => {
              setStage('review')
            }, 350)
          })
          .catch(() => {
            captureInProgressRef.current = false
            setStage('idle')
          })

        return
      }

      timeoutRef.current = setTimeout(() => {
        tickRef.current(secondsLeft - 1)
      }, 1000)
    }
  }, [countdownSeconds, onCapture, onComplete, reviewPauseMs, totalShots])

  const start = useCallback((): void => {
    clearPendingTimeout()
    captureInProgressRef.current = false

    // Lanjutkan dari shot berikutnya yang belum diambil. Memanggil start() lagi
    // (mis. setelah capture gagal dan stage kembali ke idle) tidak boleh
    // mengembalikan urutan ke foto pertama.
    setCurrentShotIndex((currentIndex) => {
      setStage('countdown')
      timeoutRef.current = setTimeout(() => {
        tickRef.current(countdownSeconds)
      }, 0)
      return Math.min(currentIndex, Math.max(0, totalShots - 1))
    })
  }, [clearPendingTimeout, countdownSeconds, totalShots])

  const continueAfterReview = useCallback((): void => {
    setCurrentShotIndex((currentIndex) => {
      const nextIndex = currentIndex + 1

      if (nextIndex >= totalShots) {
        setStage('done')

        onComplete?.()
      } else {
        setStage('countdown')

        tickRef.current(countdownSeconds)
      }

      return nextIndex
    })
  }, [countdownSeconds, onComplete, totalShots])

  const retakeCurrent = useCallback((): void => {
    setStage('countdown')

    tickRef.current(countdownSeconds)
  }, [countdownSeconds])
  useEffect(() => {
    return (): void => {
      clearPendingTimeout()
    }
  }, [clearPendingTimeout])

  return {
    stage,
    countdown,
    currentShotIndex,
    start,
    continueAfterReview,
    retakeCurrent,
    isActive: stage !== 'idle' && stage !== 'done'
  }
}
