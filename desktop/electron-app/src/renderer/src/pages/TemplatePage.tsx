import { useEffect } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { useSessionStore } from '@/store/sessionStore'

export default function TemplatePage(): JSX.Element | null {
  const navigate = useNavigate()
  const configuration = useSessionStore((state) => state.eventConfiguration)
  const template = useSessionStore((state) => state.template)
  const syncStatus = useSessionStore((state) => state.syncStatus)
  const syncError = useSessionStore((state) => state.syncError)

  useEffect(() => {
    if (!configuration || !template) {
      navigate('/dashboard', { replace: true })
    }
  }, [configuration, navigate, template])

  if (!configuration || !template) return null

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Template Event</h1>
        <p className="text-slate-500">{configuration.event.event_name}</p>
      </div>

      {syncStatus === 'local-only' && (
        <Alert type="warning">{syncError ?? 'Sesi berjalan dengan penyimpanan lokal.'}</Alert>
      )}

      <div className="mx-auto flex w-full max-w-md flex-1 items-center">
        <div className="w-full border border-slate-200 bg-white p-5 shadow-sm">
          <div
            className="grid min-h-72 gap-2 bg-slate-800 p-4"
            style={{
              gridTemplateColumns: template.layout === 'strip' ? '1fr' : '1fr 1fr'
            }}
          >
            {Array.from({ length: template.slots }).map((_, index) => (
              <div
                key={index}
                className="flex min-h-20 items-center justify-center border border-white/30 bg-white/10 text-sm text-white/70"
              >
                {index + 1}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-800">{template.name}</p>
              <p className="text-sm text-slate-500">
                {template.slots} foto | versi {template.version}
              </p>
            </div>
            <Button onClick={() => navigate('/filter')}>Lanjutkan</Button>
          </div>
        </div>
      </div>

      <Button
        onClick={() => navigate('/dashboard')}
        className="mr-auto bg-slate-500 hover:bg-slate-600"
      >
        Batal
      </Button>
    </div>
  )
}
