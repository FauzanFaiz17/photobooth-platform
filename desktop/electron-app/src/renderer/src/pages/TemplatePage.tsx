import { useEffect } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '@/components/ui/Alert'
import { NeoButton } from '@/components/shared/button'
import { mapTemplateSnapshot } from '@/features/event/types'
import { useSessionStore } from '@/store/sessionStore'

export default function TemplatePage(): JSX.Element | null {
  const navigate = useNavigate()
  const configuration = useSessionStore((state) => state.eventConfiguration)
  const paperSize = useSessionStore((state) => state.paperSize)
  const setPaperSize = useSessionStore((state) => state.setPaperSize)
  const setTemplate = useSessionStore((state) => state.setTemplate)
  const syncStatus = useSessionStore((state) => state.syncStatus)
  const syncError = useSessionStore((state) => state.syncError)

  useEffect(() => {
    if (!configuration) navigate('/dashboard', { replace: true })
  }, [configuration, navigate])

  if (!configuration || !paperSize) return null

  const templates = (configuration.templates ?? [configuration.template]).filter(
    (item) => item.paper_size === paperSize
  )

  return (
    <main className="flex h-full flex-col gap-6 bg-(--background) p-5 text-(--foreground) md:px-8 md:py-4">
      <div>
        <h1 className="text-4xl font-black tracking-[-0.04em]">Pilih Template</h1>
        <p className="mt-2 font-semibold text-(--muted-foreground)">
          {configuration.event.event_name}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {(['2r', '4r'] as const).map((size) => (
          <NeoButton
            key={size}
            onClick={() => setPaperSize(size)}
            variant={paperSize === size ? 'primary' : 'outlined'}
            className="[transition:none]"
          >
            {size.toUpperCase()}
          </NeoButton>
        ))}
      </div>
      {templates.length === 0 ? (
        <Alert type="warning">Belum ada template {paperSize.toUpperCase()} untuk event ini.</Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6 overflow-auto pb-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((item) => {
            const mapped = mapTemplateSnapshot(item)
            return (
              <article
                key={item.id}
                className="border-4 border-(--border) bg-(--surface) p-4 shadow-(--shadow-neo)"
              >
                <div className="mb-4 flex min-h-56 items-center justify-center border-4 border-(--border) bg-[#202020] p-5">
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
                </div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <p className="font-black">{mapped.name}</p>
                  <span className="border-2 border-(--border) bg-(--primary) px-2 py-1 text-xs font-black uppercase">
                    {paperSize}
                  </span>
                </div>
                <NeoButton
                  onClick={() => {
                    setTemplate(mapped)
                    navigate('/payment')
                  }}
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
        onClick={() => navigate('/dashboard')}
        variant="outlined"
        className="mr-auto [transition:none]"
      >
        Batal
      </NeoButton>
    </main>
  )
}
