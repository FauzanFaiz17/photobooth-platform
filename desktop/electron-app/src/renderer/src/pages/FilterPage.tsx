import { useCallback, useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { NeoButton } from '@/components/shared/button'
import Alert from '@/components/ui/Alert'
import { mapFilterSnapshot } from '@/features/event/types'
import { composeTemplateImage } from '@/features/template/services/composeTemplate'
import { useSessionStore } from '@/store/sessionStore'

export default function FilterPage(): JSX.Element | null {
  const navigate = useNavigate()
  const configuration = useSessionStore((state) => state.eventConfiguration)
  const template = useSessionStore((state) => state.template)
  const shots = useSessionStore((state) => state.shots)
  const composedImage = useSessionStore((state) => state.composedImage)
  const filter = useSessionStore((state) => state.filter)
  const setFilter = useSessionStore((state) => state.setFilter)
  const setPrintImage = useSessionStore((state) => state.setPrintImage)
  const stopSessionTimer = useSessionStore((state) => state.stopSessionTimer)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filters = useMemo(
    () =>
      (configuration?.filters ?? (configuration ? [configuration.filter] : [])).map(
        mapFilterSnapshot
      ),
    [configuration]
  )

  useEffect(() => {
    if (!configuration || !template || shots.length === 0 || !composedImage) {
      navigate('/preview', { replace: true })
    }
  }, [composedImage, configuration, navigate, shots.length, template])

  const confirmFilter = useCallback(async (): Promise<void> => {
    if (!template || !filter || shots.length === 0) return

    setProcessing(true)
    setError(null)

    try {
      const image = await composeTemplateImage({
        shots,
        jsonLayout: template.jsonLayout,
        layout: template.layout,
        overlayPath: template.overlayPath,
        cssFilter: filter.cssFilter
      })
      setPrintImage(image)
      stopSessionTimer()
      navigate('/finish')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Hasil khusus print tidak dapat dibuat.')
    } finally {
      setProcessing(false)
    }
  }, [filter, navigate, setPrintImage, shots, stopSessionTimer, template])

  if (!configuration || !template || shots.length === 0 || !composedImage || !filter) {
    return null
  }

  return (
    <main className="flex h-full flex-col gap-5 bg-(--background) p-5 text-(--foreground) md:p-8">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-(--danger)">
          Filter sebelum print
        </p>
        <h1 className="text-4xl font-black">Pilih Filter Print</h1>
        <p className="mt-2 font-semibold text-(--muted-foreground)">
          Foto lokal dan galeri tetap disimpan tanpa filter.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-auto md:grid-cols-[0.8fr_1.2fr]">
        <div className="grid content-start gap-3">
        {filters.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setFilter(item)}
            className={`border-4 border-(--border) p-4 text-left shadow-(--shadow-neo) [transition:none] ${filter.id === item.id ? 'bg-(--primary)' : 'bg-(--surface)'}`}
          >
            <div className="aspect-video overflow-hidden border-4 border-(--border) bg-white"><img src={shots[0]?.dataUrl ?? composedImage.dataUrl} alt={`Foto dengan filter ${item.name}`} className="h-full w-full object-contain" style={{ filter: item.cssFilter }} /></div>
            <p className="mt-3 font-black">{item.name}</p>
          </button>
        ))}
        </div>
        <div className="flex min-h-0 flex-col border-4 border-(--border) bg-(--surface) p-4 shadow-(--shadow-neo)">
          <p className="mb-3 font-black uppercase tracking-wider">Preview template</p>
          <div className="grid min-h-0 flex-1 place-items-center bg-white p-3"><img src={composedImage.dataUrl} alt="Preview template dengan filter" className="max-h-full max-w-full object-contain" style={{ filter: filter.cssFilter }} /></div>
          <p className="mt-3 text-sm font-bold">Filter aktif: {filter.name}</p>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="flex justify-between gap-3">
        <NeoButton onClick={() => navigate('/preview')} variant="outlined">
          Kembali
        </NeoButton>
        <NeoButton onClick={() => void confirmFilter()} disabled={processing}>
          {processing ? 'Menyiapkan...' : 'Konfirmasi Filter'}
        </NeoButton>
      </div>
    </main>
  )
}
