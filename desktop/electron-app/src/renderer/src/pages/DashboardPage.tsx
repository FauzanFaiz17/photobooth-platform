import { useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage, isNetworkError } from '@/api/axios'
import { getEventConfiguration } from '@/api/event'
import { NeoButton } from '@/components/shared/button'
import { eventStorage } from '@/features/event/services/eventStorage'
import { useAuthStore } from '@/store/authStore'
import { useDeviceStore } from '@/store/deviceStore'
import { useSessionStore } from '@/store/sessionStore'

const EVENT_CODE_PATTERN = /^EVT-[A-Z0-9]{8}$/

const focusRing =
  'focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-(--danger)'

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
    <main className="grid h-full min-h-[520px] place-items-center">
      <section className="relative grid w-full max-w-5xl overflow-hidden border-4 border-(--border) bg-(--surface) text-(--foreground) shadow-[12px_12px_0_0_var(--border)] md:grid-cols-[1.05fr_0.95fr]">
        <span
          className="absolute left-0 top-0 h-4 w-32 border-b-4 border-r-4 border-(--border) bg-(--secondary)"
          aria-hidden="true"
        />

        <div className="flex flex-col justify-between border-b-4 border-(--border) p-7 pt-12 md:border-b-0 md:border-r-4 md:p-10 md:pt-14">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-(--danger)">
              {user?.name ? `Halo, ${user.name}` : 'Operator booth'}
            </p>
            <h1 className="mt-3 text-5xl font-black leading-[0.88] tracking-[-0.04em] text-balance sm:text-6xl">
              Buka Sesi Event
            </h1>
            <p className="mt-6 max-w-md text-lg font-semibold leading-7 text-(--muted-foreground)">
              Masukkan kode event dari dashboard untuk memuat template, kamera, dan paket harganya.
            </p>
          </div>

          <div className="mt-10 border-2 border-(--border) bg-(--background) p-3">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.18em] text-(--muted-foreground)">
              Perangkat
            </p>
            <p className="mt-1 break-all font-mono text-xs font-semibold">
              {device?.device_name ?? 'Perangkat photobooth'}
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between bg-(--accent) p-7 md:p-10">
          <div className="mb-10 flex items-start justify-between gap-4">
            <span className="border-2 border-(--border) bg-(--surface) px-3 py-2 text-xs font-black uppercase">
              02 / Kode event
            </span>
            <span className="text-4xl font-black leading-none" aria-hidden="true">
              ✳
            </span>
          </div>

          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault()
              void handleStart()
            }}
          >
            <div>
              <label
                htmlFor="event-code"
                className="block text-xs font-black uppercase tracking-[0.2em]"
              >
                Kode Event
              </label>
              <input
                id="event-code"
                value={eventCode}
                onChange={(event) => setEventCode(event.target.value.toUpperCase())}
                placeholder="EVT-AB12CD34"
                maxLength={12}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                className={`mt-3 w-full border-4 border-(--border) bg-(--surface) px-4 py-5 text-center font-mono text-3xl font-black uppercase tracking-[0.18em] shadow-[var(--shadow-neo)] outline-none placeholder:text-(--muted-foreground)/45 ${focusRing}`}
              />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-(--muted-foreground)">
                Format EVT- diikuti 8 karakter
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="border-4 border-(--border) bg-(--danger) p-4 font-bold leading-6 text-white shadow-[var(--shadow-neo)]"
              >
                {error}
              </p>
            )}

            <NeoButton
              type="submit"
              loading={loading}
              className={`w-full bg-(--danger) px-6 py-5 text-xl text-(--foreground) shadow-[var(--shadow-neo)] disabled:cursor-not-allowed disabled:opacity-60 [transition:none] hover:bg-[#cf3d26] ${focusRing}`}
            >
              {loading ? 'Memuat Event...' : 'Mulai Sesi'} <span aria-hidden="true">&rarr;</span>
            </NeoButton>
          </form>
        </div>
      </section>
    </main>
  )
}
