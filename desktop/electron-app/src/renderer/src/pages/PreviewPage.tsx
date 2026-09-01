import { useCallback, useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { createSessionGif } from '@/features/gif/services/createSessionGif'
import { composeTemplateImage } from '@/features/template/services/composeTemplate'

import { useSessionStore } from '@/store/sessionStore'

export default function PreviewPage(): JSX.Element | null {
  const navigate = useNavigate()

  const template = useSessionStore((state) => state.template)

  const configuration = useSessionStore((state) => state.eventConfiguration)

  const shots = useSessionStore((state) => state.shots)

  const resetShots = useSessionStore((state) => state.resetShots)
  const composedImage = useSessionStore((state) => state.composedImage)
  const setComposedImage = useSessionStore((state) => state.setComposedImage)
  const animatedGif = useSessionStore((state) => state.animatedGif)
  const setAnimatedGif = useSessionStore((state) => state.setAnimatedGif)
  const [composing, setComposing] = useState(false)
  const [compositionError, setCompositionError] = useState<string | null>(null)

  const compose = useCallback(async (): Promise<void> => {
    if (!template || shots.length === 0) return

    setComposing(true)
    setCompositionError(null)

    try {
      const [composedResult, gifResult] = await Promise.all([
        composeTemplateImage({
          shots,
          jsonLayout: template.jsonLayout,
          layout: template.layout,
          overlayPath: template.overlayPath
        }),
        createSessionGif(shots)
      ])
      setComposedImage(composedResult)
      setAnimatedGif(gifResult)
    } catch (error) {
      setComposedImage(null)
      setAnimatedGif(null)
      setCompositionError(
        error instanceof Error ? error.message : 'Hasil final tidak dapat dibuat.'
      )
    } finally {
      setComposing(false)
    }
  }, [setAnimatedGif, setComposedImage, shots, template])

  useEffect(() => {
    if (!configuration || !template || shots.length === 0) {
      navigate('/camera', { replace: true })
    }
  }, [configuration, template, shots.length, navigate])

  useEffect(() => {
    if ((!composedImage || !animatedGif) && template && shots.length > 0) {
      const timeout = window.setTimeout(() => void compose(), 0)
      return () => window.clearTimeout(timeout)
    }

    return undefined
  }, [animatedGif, compose, composedImage, shots.length, template])

  function handleRetake(): void {
    resetShots()

    navigate('/camera')
  }

  function handleConfirm(): void {
    navigate('/filter')
  }

  if (!configuration || !template || shots.length === 0) {
    return null
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Preview Hasil Foto</h1>

        <p className="text-slate-500">Template: {template.name}</p>

        <p className="text-sm text-slate-400">{configuration.event.event_name}</p>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden">
        {composing && (
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p>Menyusun foto ke dalam template...</p>
          </div>
        )}

        {!composing && compositionError && (
          <div className="flex max-w-lg flex-col gap-4">
            <Alert type="error">{compositionError}</Alert>
            <Button onClick={() => void compose()}>Coba Buat Lagi</Button>
          </div>
        )}

        {!composing && composedImage && animatedGif && (
          <div className="grid h-full w-full grid-cols-2 gap-6 overflow-hidden">
            <div className="flex min-w-0 flex-col items-center gap-2 overflow-hidden">
              <p className="text-sm font-medium text-slate-600">Hasil Template</p>
              <img
                src={composedImage.dataUrl}
                alt="Hasil akhir dengan template"
                className="min-h-0 max-h-full max-w-full border border-slate-200 bg-white object-contain shadow-lg"
              />
            </div>
            <div className="flex min-w-0 flex-col items-center gap-2 overflow-hidden">
              <p className="text-sm font-medium text-slate-600">GIF</p>
              <img
                src={animatedGif.dataUrl}
                alt="Animasi seluruh hasil foto"
                className="min-h-0 max-h-full max-w-full border border-slate-200 bg-white object-contain shadow-lg"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto flex gap-4">
        <Button onClick={handleRetake} className="bg-slate-500 hover:bg-slate-600">
          Ambil Ulang
        </Button>

        <Button onClick={handleConfirm} disabled={!composedImage || !animatedGif || composing}>
          Pilih Filter Print
        </Button>
      </div>
    </div>
  )
}
