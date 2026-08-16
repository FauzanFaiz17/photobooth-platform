import { useEffect } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import { useSessionStore } from '@/store/sessionStore'

interface PreviewFrame {
  x: number
  y: number
  width: number
  height: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function readPreviewLayout(jsonLayout: Record<string, unknown>): {
  aspectRatio: string
  frames: PreviewFrame[]
} | null {
  const canvas = isRecord(jsonLayout.canvas) ? jsonLayout.canvas : null
  const canvasWidth = positiveNumber(canvas?.width)
  const canvasHeight = positiveNumber(canvas?.height)
  const configuredFrames = Array.isArray(jsonLayout.frames) ? jsonLayout.frames : []
  if (!canvasWidth || !canvasHeight || configuredFrames.length === 0) return null

  const frames = configuredFrames.flatMap((value): PreviewFrame[] => {
    if (!isRecord(value)) return []
    const x = typeof value.x === 'number' && Number.isFinite(value.x) ? value.x : null
    const y = typeof value.y === 'number' && Number.isFinite(value.y) ? value.y : null
    const width = positiveNumber(value.width)
    const height = positiveNumber(value.height)
    if (x === null || y === null || !width || !height) return []
    return [
      {
        x: (x / canvasWidth) * 100,
        y: (y / canvasHeight) * 100,
        width: (width / canvasWidth) * 100,
        height: (height / canvasHeight) * 100
      }
    ]
  })

  return frames.length > 0 ? { aspectRatio: `${canvasWidth} / ${canvasHeight}`, frames } : null
}

export default function TemplatePage(): JSX.Element | null {
  const navigate = useNavigate()
  const configuration = useSessionStore((state) => state.eventConfiguration)
  const template = useSessionStore((state) => state.template)
  const syncStatus = useSessionStore((state) => state.syncStatus)
  const syncError = useSessionStore((state) => state.syncError)
  const previewLayout = template ? readPreviewLayout(template.jsonLayout) : null

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
          {previewLayout ? (
            <div
              className="relative mx-auto w-full overflow-hidden bg-slate-800"
              style={{ aspectRatio: previewLayout.aspectRatio }}
            >
              {previewLayout.frames.map((frame, index) => (
                <div
                  key={index}
                  className="absolute flex items-center justify-center border border-white/40 bg-white/10 text-sm text-white/70"
                  style={{
                    left: `${frame.x}%`,
                    top: `${frame.y}%`,
                    width: `${frame.width}%`,
                    height: `${frame.height}%`
                  }}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="grid min-h-72 gap-2 bg-slate-800 p-4"
              style={{ gridTemplateColumns: template.layout === 'strip' ? '1fr' : '1fr 1fr' }}
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
          )}
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
