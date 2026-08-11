import { useCallback, useEffect, useRef, useState } from 'react'

export type CaptureStage = 'idle' | 'countdown' | 'flash' | 'review' | 'done'

interface UseCaptureSequenceOptions {
  totalShots: number
  countdownSeconds?: number
  reviewPauseMs?: number
  onCapture: () => string | null
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
  countdownSeconds = 3,
  reviewPauseMs = 900,
  onCapture,
  onComplete
}: UseCaptureSequenceOptions): UseCaptureSequenceResult {
  const [stage, setStage] = useState<CaptureStage>('idle')
  const [countdown, setCountdown] = useState(countdownSeconds)
  const [currentShotIndex, setCurrentShotIndex] = useState(0)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const tickRef = useRef<(secondsLeft: number) => void>(() => {})

  const clearPendingTimeout = useCallback((): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    tickRef.current = (secondsLeft: number): void => {
      setCountdown(secondsLeft)

      if (secondsLeft <= 0) {
        setStage('flash')

        const captured = onCapture()

        if (!captured) {
          setStage('idle')
          return
        }

        timeoutRef.current = setTimeout(() => {
          setStage('review')

          // Tunggu keputusan pengguna (ulangi atau lanjutkan).
        }, 250)

        return
      }

      timeoutRef.current = setTimeout(() => {
        tickRef.current(secondsLeft - 1)
      }, 1000)
    }
  }, [countdownSeconds, onCapture, onComplete, reviewPauseMs, totalShots])

  const start = useCallback((): void => {
    clearPendingTimeout()

    setCurrentShotIndex(0)

    setStage('countdown')

    tickRef.current(countdownSeconds)
  }, [clearPendingTimeout, countdownSeconds])

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
