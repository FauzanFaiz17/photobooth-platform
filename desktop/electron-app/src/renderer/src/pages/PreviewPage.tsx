import { useCallback, useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { createSessionGif } from '@/features/gif/services/createSessionGif'
import { composeTemplateImage } from '@/features/template/services/composeTemplate'
import { composeTemplateVideo } from '@/features/template/services/composeTemplateVideo'

import { useSessionStore } from '@/store/sessionStore'
import { NeoButton } from '@/components/shared/button'

const focusRing =
  'focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-(--danger)'

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
  const composedVideo = useSessionStore((state) => state.composedVideo)
  const setComposedVideo = useSessionStore((state) => state.setComposedVideo)
  const [composing, setComposing] = useState(false)
  const [compositionError, setCompositionError] = useState<string | null>(null)

  const compose = useCallback(async (): Promise<void> => {
    if (!template || shots.length === 0) return

    setComposing(true)
    setCompositionError(null)

    try {
      const [composedResult, gifResult, videoResult] = await Promise.all([
        composeTemplateImage({
          shots,
          jsonLayout: template.jsonLayout,
          layout: template.layout,
          overlayPath: template.overlayPath
        }),
        createSessionGif(shots),
        composeTemplateVideo({
          shots,
          jsonLayout: template.jsonLayout,
          layout: template.layout,
          overlayPath: template.overlayPath,
          shotDurationSeconds: configuration?.camera.countdown_seconds
        })
      ])
      setComposedImage(composedResult)
      setAnimatedGif(gifResult)
      setComposedVideo(videoResult)
    } catch (error) {
      setComposedImage(null)
      setAnimatedGif(null)
      setComposedVideo(null)
      setCompositionError(
        error instanceof Error ? error.message : 'Hasil final tidak dapat dibuat.'
      )
    } finally {
      setComposing(false)
    }
  }, [setAnimatedGif, setComposedImage, setComposedVideo, shots, template])

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

  const ready = !composing && Boolean(composedImage) && Boolean(animatedGif)

  return (
    <main className="flex h-full min-h-0 flex-col bg-(--background) text-(--foreground)">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b-4 border-(--border) px-5 pb-5 pt-4 md:px-8">
        <div className="min-w-0">
          <p className="w-fit border-2 border-(--border) bg-(--accent) px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.2em]">
            {composing ? 'Menyusun' : compositionError ? 'Gagal disusun' : 'Siap dicetak'}
          </p>
          <h1 className="mt-4 text-5xl font-black leading-[0.85] tracking-[-0.04em] sm:text-6xl">
            Preview Hasil
          </h1>
        </div>

        <dl className="flex flex-wrap gap-3">
          <div className="border-4 border-(--border) bg-(--surface) px-4 py-2 shadow-[6px_6px_0_0_var(--border)]">
            <dt className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-(--muted-foreground)">
              Template
            </dt>
            <dd className="mt-0.5 max-w-56 truncate font-black">{template.name}</dd>
          </div>
          <div className="border-4 border-(--border) bg-(--surface) px-4 py-2 shadow-[6px_6px_0_0_var(--border)]">
            <dt className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-(--muted-foreground)">
              Event
            </dt>
            <dd className="mt-0.5 max-w-56 truncate font-black">
              {configuration.event.event_name}
            </dd>
          </div>
        </dl>
      </header>

      <section className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-5 md:p-7">
        {composing && (
          <div className="w-full max-w-2xl border-4 border-(--border) bg-(--primary) p-8 shadow-[12px_12px_0_0_var(--border)] md:p-10">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.2em]">Mohon tunggu</p>
            <p className="mt-4 text-4xl font-black leading-[0.9] tracking-[-0.03em] text-balance sm:text-5xl">
              Foto sedang disusun ke dalam template
            </p>
            <div className="mt-8 flex gap-1.5" aria-hidden="true">
              {Array.from({ length: 9 }).map((_, index) => (
                <span
                  key={index}
                  className="h-4 flex-1 border-2 border-(--border) bg-(--surface)"
                />
              ))}
            </div>
          </div>
        )}

        {!composing && compositionError && (
          <div className="w-full max-w-2xl border-4 border-(--border) bg-(--surface) p-8 shadow-[12px_12px_0_0_var(--border)] md:p-10">
            <p className="w-fit border-2 border-(--border) bg-(--danger) px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.2em] text-white">
              Gagal
            </p>
            <p
              role="alert"
              className="mt-5 text-2xl font-black leading-[1.1] tracking-[-0.02em] text-balance"
            >
              {compositionError}
            </p>
            <NeoButton
              onClick={() => void compose()}
              className={`mt-8 [transition:none] ${focusRing}`}
            >
              Coba Buat Lagi
            </NeoButton>
          </div>
        )}

        {ready && composedImage && animatedGif && (
          <div className="grid h-full min-h-0 w-full grid-cols-1 gap-6 md:grid-cols-[1.15fr_0.85fr]">
            <figure className="flex min-h-0 flex-col border-4 border-(--border) bg-(--surface) shadow-[10px_10px_0_0_var(--border)]">
              <figcaption className="flex items-center justify-between gap-3 border-b-4 border-(--border) bg-(--primary) px-4 py-3">
                <span className="text-sm font-black uppercase tracking-[0.16em]">Hasil Cetak</span>
                <span className="border-2 border-(--border) bg-(--surface) px-2 py-1 text-[0.6rem] font-black">
                  01
                </span>
              </figcaption>
              <div className="grid min-h-0 flex-1 place-items-center bg-(--background) p-4">
                <img
                  src={composedImage.dataUrl}
                  alt="Hasil akhir dengan template"
                  className="max-h-full min-h-0 max-w-full border-2 border-(--border) bg-white object-contain"
                />
              </div>
            </figure>

            <figure className="flex min-h-0 flex-col border-4 border-(--border) bg-(--surface) shadow-[10px_10px_0_0_var(--border)]">
              <figcaption className="flex items-center justify-between gap-3 border-b-4 border-(--border) bg-(--accent) px-4 py-3">
                <span className="text-sm font-black uppercase tracking-[0.16em]">
                  {composedVideo ? 'Video Template' : 'Animasi'}
                </span>
                <span className="border-2 border-(--border) bg-(--surface) px-2 py-1 text-[0.6rem] font-black">
                  02
                </span>
              </figcaption>
              <div className="grid min-h-0 flex-1 place-items-center bg-(--background) p-4">
                {composedVideo ? (
                  <video
                    src={composedVideo.dataUrl}
                    controls
                    autoPlay
                    loop
                    className="max-h-full min-h-0 max-w-full border-2 border-(--border) bg-white object-contain"
                  />
                ) : (
                  <img
                    src={animatedGif.dataUrl}
                    alt="Animasi seluruh hasil foto"
                    className="max-h-full min-h-0 max-w-full border-2 border-(--border) bg-white object-contain"
                  />
                )}
              </div>
            </figure>
          </div>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t-4 border-(--border) bg-(--surface) px-5 py-4 md:px-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-(--muted-foreground)">
          {shots.length} foto diambil
        </p>

        <div className="flex flex-wrap gap-3">
          <NeoButton
            variant="outlined"
            onClick={handleRetake}
            className={`[transition:none] ${focusRing}`}
          >
            Ambil Ulang
          </NeoButton>

          <NeoButton
            onClick={handleConfirm}
            disabled={!ready}
            className={`px-8 text-lg disabled:cursor-not-allowed disabled:opacity-45 [transition:none] ${focusRing}`}
          >
            Pilih Filter Print <span aria-hidden="true">→</span>
          </NeoButton>
        </div>
      </footer>
    </main>
  )
}
