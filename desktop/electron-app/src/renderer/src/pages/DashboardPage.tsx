import { useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage, isNetworkError } from '@/api/axios'
import { getEventConfiguration } from '@/api/event'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import CardBody from '@/components/ui/CardBody'
import Input from '@/components/ui/Input'
import { eventStorage } from '@/features/event/services/eventStorage'
import { useAuthStore } from '@/store/authStore'
import { useDeviceStore } from '@/store/deviceStore'
import { useSessionStore } from '@/store/sessionStore'

const EVENT_CODE_PATTERN = /^EVT-[A-Z0-9]{8}$/

export default function DashboardPage(): JSX.Element {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const device = useDeviceStore((state) => state.device)
  const beginEvent = useSessionStore((state) => state.beginEvent)
  const [eventCode, setEventCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart(): Promise<void> {
    const normalizedCode = eventCode.trim().toUpperCase()

    if (!EVENT_CODE_PATTERN.test(normalizedCode)) {
      setError('Kode event harus mengikuti format EVT-XXXXXXXX.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      let configuration

      try {
        configuration = await getEventConfiguration(normalizedCode)
        await eventStorage.save(configuration)
      } catch (requestError) {
        if (!isNetworkError(requestError)) throw requestError

        configuration = await eventStorage.get(normalizedCode)
        if (!configuration) throw requestError
      }

      beginEvent(configuration)

      navigate('/template')
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          'Event tidak dapat dimuat. Periksa koneksi dan kode event.'
        )
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-7 text-center">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Selamat Datang{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="mt-2 text-slate-500">{device?.device_name ?? 'Perangkat photobooth'}</p>
      </div>

      <Card className="w-full max-w-md">
        <CardBody>
          <form
            className="flex flex-col gap-4 text-left"
            onSubmit={(event) => {
              event.preventDefault()
              void handleStart()
            }}
          >
            <label htmlFor="event-code" className="text-sm font-semibold text-slate-700">
              Kode Event
            </label>
            <Input
              id="event-code"
              value={eventCode}
              onChange={(event) => setEventCode(event.target.value.toUpperCase())}
              placeholder="EVT-AB12CD34"
              maxLength={12}
              autoComplete="off"
              className="text-center text-lg uppercase tracking-wider"
            />

            {error && <Alert type="error">{error}</Alert>}
            <Button type="submit" loading={loading} className="py-3 text-lg">
              Mulai Sesi
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
