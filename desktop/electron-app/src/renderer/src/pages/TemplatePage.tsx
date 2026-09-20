import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '@/components/ui/Alert'
import { NeoButton } from '@/components/shared/button'
import { mapTemplateSnapshot } from '@/features/event/types'
import type { TemplateSnapshot } from '@/features/event/types'
import { loadTemplateOverlayDataUrl } from '@/features/template/services/composeTemplate'
import { useSessionStore } from '@/store/sessionStore'

function resolveTemplateAsset(path: string | null): string | null {
  if (!path) return null
  if (/^(data:|blob:|https?:)/i.test(path)) return path
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined
  if (!apiUrl) return path
  const base = new URL(apiUrl)
  return new URL(
    `/storage/${path.replace(/^storage\//, '').replace(/^\//, '')}`,
    base.origin
  ).toString()
}

type PaperSizeOption = '2r' | '4r'

export default function TemplatePage(): JSX.Element | null {
  const navigate = useNavigate()
  const configuration = useSessionStore((state) => state.eventConfiguration)
  const setTemplate = useSessionStore((state) => state.setTemplate)
  const syncStatus = useSessionStore((state) => state.syncStatus)
  const syncError = useSessionStore((state) => state.syncError)
  const [assetPreviews, setAssetPreviews] = useState<Record<string, string>>({})
  const [loadingAssets, setLoadingAssets] = useState(false)

  const allTemplates = useMemo(
    () => configuration?.templates ?? (configuration ? [configuration.template] : []),
    [configuration]
  )

  const availableSizes = useMemo(() => {
    const sizes = new Set<PaperSizeOption>(allTemplates.map((t) => t.paper_size as PaperSizeOption))
    const ordered: PaperSizeOption[] = ['4r', '2r']
    return ordered.filter((s) => sizes.has(s))
  }, [allTemplates])

  const [activeSize, setActiveSize] = useState<PaperSizeOption | null>(null)

  useEffect(() => {
    if (!configuration) {
      navigate('/dashboard', { replace: true })
    }
  }, [configuration, navigate])

  useEffect(() => {
    if (availableSizes.length > 0 && !activeSize) {
      setActiveSize(availableSizes[0])
    }
  }, [availableSizes, activeSize])

  const filteredTemplates = useMemo(
    () => allTemplates.filter((item) => item.paper_size === activeSize),
    [allTemplates, activeSize]
  )

  useEffect(() => {
    if (filteredTemplates.length === 0) return
    let active = true
    setLoadingAssets(filteredTemplates.some((item) => Boolean(item.png_url ?? item.png_path)))
    void Promise.all(filteredTemplates.map(async (item) => {
      const source = item.png_url ?? item.png_path
      if (!source) return null
      try { return [String(item.id), await loadTemplateOverlayDataUrl(source)] as const } catch { return null }
    })).then((entries) => {
      if (!active) return
      setAssetPreviews(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry))))
      setLoadingAssets(false)
    })
    return () => { active = false }
  }, [filteredTemplates])

  if (!configuration || !activeSize) return null

  function handleSelect(snapshot: TemplateSnapshot): void {
    setTemplate(mapTemplateSnapshot(snapshot))
    const paymentMode = configuration?.event.payment_mode ?? 'full'
    if (paymentMode === 'disabled') {
      navigate('/customer')
    } else {
      navigate('/payment')
    }
  }

  return (
    <main className="flex h-full flex-col gap-6 bg-(--background) p-5 text-(--foreground) md:px-8 md:py-4">
      <div>
        <h1 className="text-4xl font-black tracking-[-0.04em]">Pilih Template</h1>
        <p className="mt-2 font-semibold text-(--muted-foreground)">
          {configuration.event.event_name}
        </p>
      </div>

      {availableSizes.length > 1 && (
        <div className="flex gap-2">
          {availableSizes.map((size) => (
            <button
              key={size}
              onClick={() => setActiveSize(size)}
              className={`border-4 border-(--border) px-5 py-2 text-sm font-black uppercase tracking-wider shadow-[var(--shadow-neo)] [transition:none] ${
                activeSize === size
                  ? 'bg-(--primary) text-(--foreground)'
                  : 'bg-(--surface) text-(--muted-foreground) hover:bg-(--background)'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 ? (
        <Alert type="warning">Belum ada template {activeSize.toUpperCase()} untuk event ini.</Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6 overflow-auto pb-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((item) => {
            const mapped = mapTemplateSnapshot(item)
            const previewSource = assetPreviews[String(item.id)] ?? resolveTemplateAsset(mapped.previewPath || mapped.thumbnailPath)
            return (
              <article
                key={item.id}
                className="border-4 border-(--border) bg-(--surface) p-4 shadow-(--shadow-neo)"
              >
                <div className="mb-4 flex min-h-56 items-center justify-center border-4 border-(--border) bg-[#202020] p-3">
                  {previewSource ? (
                    <img
                      src={previewSource}
                      alt={`Pratinjau ${mapped.name}`}
                      className="max-h-72 w-full object-contain"
                    />
                  ) : loadingAssets ? <div className="font-bold text-white">Memuat frame...</div> : (
                    <div
                      className="grid w-full max-w-47.5 gap-2 border-2 border-white/50 bg-white/5 p-2"
                      style={{ gridTemplateColumns: mapped.layout === 'strip' ? '1fr' : '1fr 1fr' }}
                    >
                      {Array.from({ length: mapped.slots }).map((_, index) => (
                        <div
                          key={index}
                          className="flex min-h-14 items-center justify-center border-2 border-white/40 bg-(--accent) text-sm font-black text-(--foreground)"
                        >
                          {index + 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <p className="font-black">{mapped.name}</p>
                  <span className="border-2 border-(--border) bg-(--primary) px-2 py-1 text-xs font-black uppercase">
                    {item.paper_size}
                  </span>
                </div>
                <NeoButton
                  onClick={() => handleSelect(item)}
                  className="w-full [transition:none]"
                >
                  Pilih Template <span aria-hidden="true">→</span>
                </NeoButton>
              </article>
            )
          })}
        </div>
      )}
      {syncStatus === 'local-only' && (
        <Alert type="warning">{syncError ?? 'Sesi berjalan dengan penyimpanan lokal.'}</Alert>
      )}
      <NeoButton
        onClick={() => navigate('/welcome')}
        variant="outlined"
        className="mr-auto [transition:none]"
      >
        Batal
      </NeoButton>
    </main>
  )
}
