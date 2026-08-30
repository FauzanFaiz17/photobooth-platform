import { useEffect } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { NeoButton } from '@/components/shared/button'
import { useSessionStore } from '@/store/sessionStore'
import { mapFilterSnapshot } from '@/features/event/types'
import { useWebcam } from '@/features/camera/hooks/useWebcam'

export default function FilterPage(): JSX.Element | null {
  const navigate = useNavigate()
  const configuration = useSessionStore((state) => state.eventConfiguration)
  const template = useSessionStore((state) => state.template)
  const filter = useSessionStore((state) => state.filter)
  const setFilter = useSessionStore((state) => state.setFilter)
  const webcam = useWebcam()

  useEffect(() => {
    if (!configuration || !template || !filter) {
      navigate('/dashboard', { replace: true })
    }
  }, [configuration, filter, navigate, template])

  if (!configuration || !template || !filter) return null

  return (
    <main className="flex h-full flex-col gap-6 bg-[var(--background)] p-5 text-[var(--foreground)] md:p-8">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--danger)]">
          03 / Choose a look
        </p>
        <h1 className="text-4xl font-black tracking-[-0.04em]">Filter Event</h1>
        <p className="mt-2 font-semibold text-[var(--muted-foreground)]">
          Template: {template.name}
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {(configuration.filters ?? [configuration.filter]).map((item) => {
          const mapped = mapFilterSnapshot(item)
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setFilter(mapped)}
              className={`border-4 p-4 text-left shadow-[var(--shadow-neo)] [transition:none] ${filter.id === mapped.id ? 'border-[var(--border)] bg-[var(--primary)]' : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--accent)]'}`}
            >
              <div className="relative aspect-video overflow-hidden border-4 border-[var(--border)] bg-[#202020]">
                <video
                  ref={(element) => {
                    if (element && webcam.stream) element.srcObject = webcam.stream
                  }}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                  style={{ filter: mapped.cssFilter }}
                />
                <div className="absolute bottom-0 left-0 right-0 border-t-4 border-[var(--border)] bg-[var(--surface)] p-3">
                  <span className="font-black">{mapped.name}</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-[var(--muted-foreground)]">
                Versi {mapped.version}
              </p>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        {(configuration.filters ?? [configuration.filter]).map((item) => (
          <NeoButton
            key={item.id}
            onClick={() => setFilter(mapFilterSnapshot(item))}
            variant={filter.id === mapFilterSnapshot(item).id ? 'secondary' : 'outlined'}
            className="[transition:none]"
          >
            {item.name}
          </NeoButton>
        ))}
      </div>

      <NeoButton onClick={() => navigate('/payment')} className="ml-auto [transition:none]">
        Pilih Jumlah <span aria-hidden="true">→</span>
      </NeoButton>
      <NeoButton
        onClick={() => navigate('/template')}
        variant="outlined"
        className="mr-auto [transition:none]"
      >
        Kembali
      </NeoButton>
    </main>
  )
}
