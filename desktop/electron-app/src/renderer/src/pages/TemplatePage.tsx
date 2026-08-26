import { useEffect } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
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
    <div className="flex h-full flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pilih Template</h1>
        <p className="text-slate-500">{configuration.event.event_name}</p>
      </div>
      <div className="flex gap-3">
        {(['2r', '4r'] as const).map((size) => (
          <Button key={size} onClick={() => setPaperSize(size)} className={paperSize === size ? '' : 'bg-slate-400 hover:bg-slate-500'}>{size.toUpperCase()}</Button>
        ))}
      </div>
      {templates.length === 0 ? (
        <Alert type="warning">Belum ada template {paperSize.toUpperCase()} untuk event ini.</Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4 overflow-auto pb-2 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((item) => {
            const mapped = mapTemplateSnapshot(item)
            return (
              <div key={item.id} className="border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-3 flex min-h-52 items-center justify-center bg-slate-800 p-4">
                  <div className="grid w-full max-w-[190px] gap-1" style={{ gridTemplateColumns: mapped.layout === 'strip' ? '1fr' : '1fr 1fr' }}>
                    {Array.from({ length: mapped.slots }).map((_, index) => <div key={index} className="flex min-h-14 items-center justify-center border border-white/30 bg-white/10 text-xs text-white/70">{index + 1}</div>)}
                  </div>
                </div>
                <p className="mb-3 font-semibold text-slate-800">{mapped.name}</p>
                <Button onClick={() => { setTemplate(mapped); navigate('/filter') }} className="w-full">Pilih</Button>
              </div>
            )
          })}
        </div>
      )}
      {syncStatus === 'local-only' && <Alert type="warning">{syncError ?? 'Sesi berjalan dengan penyimpanan lokal.'}</Alert>}
      <Button onClick={() => navigate('/dashboard')} className="mr-auto bg-slate-500 hover:bg-slate-600">Batal</Button>
    </div>
  )
}
