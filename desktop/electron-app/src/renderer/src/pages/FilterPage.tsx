import { useEffect } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
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
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Filter Event</h1>
        <p className="text-slate-500">Template: {template.name}</p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        {(configuration.filters ?? [configuration.filter]).map((item) => { const mapped = mapFilterSnapshot(item); return <button type="button" key={item.id} onClick={() => setFilter(mapped)} className={`border bg-white p-3 text-left shadow-sm ${filter.id === mapped.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}><div className="relative aspect-video overflow-hidden bg-slate-800"><video ref={(element) => { if (element && webcam.stream) element.srcObject = webcam.stream }} autoPlay muted playsInline className="h-full w-full object-cover" style={{ filter: mapped.cssFilter }} /><div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-3 text-white"><span className="font-semibold">{mapped.name}</span></div></div><p className="mt-2 text-sm text-slate-500">Versi {mapped.version}</p></button> })}
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {(configuration.filters ?? [configuration.filter]).map((item) => (
          <Button key={item.id} onClick={() => setFilter(mapFilterSnapshot(item))} className="border border-slate-200 bg-white !text-slate-800 hover:bg-slate-50">
            {item.name}
          </Button>
        ))}
      </div>

      <Button onClick={() => navigate('/payment')} className="ml-auto">Pilih Jumlah</Button>
      <Button
        onClick={() => navigate('/template')}
        className="mr-auto bg-slate-500 hover:bg-slate-600"
      >
        Kembali
      </Button>
    </div>
  )
}
