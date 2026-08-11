import { useEffect } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import { useSessionStore } from '@/store/sessionStore'

export default function FilterPage(): JSX.Element | null {
  const navigate = useNavigate()
  const configuration = useSessionStore((state) => state.eventConfiguration)
  const template = useSessionStore((state) => state.template)
  const filter = useSessionStore((state) => state.filter)

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

      <div className="mx-auto flex w-full max-w-lg flex-1 items-center">
        <div className="grid w-full grid-cols-[1fr_180px] gap-5 border border-slate-200 bg-white p-5 shadow-sm">
          <div
            className="min-h-64 bg-[linear-gradient(135deg,#d6d3d1,#64748b,#f1f5f9)]"
            style={{ filter: filter.cssFilter }}
          />
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-800">{filter.name}</p>
              <p className="mt-1 text-sm text-slate-500">Versi {filter.version}</p>
            </div>
            <Button onClick={() => navigate('/camera')}>Mulai Foto</Button>
          </div>
        </div>
      </div>

      <Button
        onClick={() => navigate('/template')}
        className="mr-auto bg-slate-500 hover:bg-slate-600"
      >
        Kembali
      </Button>
    </div>
  )
}
