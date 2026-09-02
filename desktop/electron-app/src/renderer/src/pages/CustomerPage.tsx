import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '@/api/axios'
import { resolveCustomer } from '@/api/customer'
import { createPhotoSession } from '@/api/media'
import { useSessionStore } from '@/store/sessionStore'
import { NeoInput } from '@/components/shared/input'
import { NeoButton } from '@/components/shared/button'

export default function CustomerPage(): JSX.Element | null {
  const navigate = useNavigate()
  const configuration = useSessionStore((s) => s.eventConfiguration)
  const paymentId = useSessionStore((s) => s.paymentId)
  const setCustomerId = useSessionStore((s) => s.setCustomerId)
  const setRemoteSession = useSessionStore((s) => s.setRemoteSession)
  const setSyncStatus = useSessionStore((s) => s.setSyncStatus)
  const startSessionTimer = useSessionStore((s) => s.startSessionTimer)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void getAppSettings().then((settings) => startSessionTimer(settings.sessionTimerMinutes))
  }, [startSessionTimer])

  if (!configuration || !paymentId) return null
  async function submit(skip = false): Promise<void> {
    if (!configuration || !paymentId) return
    setLoading(true)
    setError(null)
    try {
      const hasCustomerData = Boolean(name.trim() || email.trim() || phone.trim())
      const customer =
        skip || !hasCustomerData
          ? null
          : await resolveCustomer({
              name: name.trim() || undefined,
              email: email.trim() || undefined,
              phone: phone.trim() || undefined
            })
      setCustomerId(customer?.id ?? null)
      const session = await createPhotoSession(
        configuration.event.id,
        paymentId,
        customer?.id ?? undefined
      )
      setRemoteSession(session.id)
      setSyncStatus('ready')
      navigate('/camera')
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Data customer tidak valid.'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'p-4 text-lg [transition:none] focus:translate-x-0 focus:translate-y-0'

  return (
    <main className="flex  w-full items-center justify-center bg-[#f4f0e8] px-5 py-2 text-[#111111]">
      <section className="relative grid w-full max-w-5xl overflow-hidden border-4 border-black bg-[#fffdf7] shadow-[12px_12px_0_0_#111111] md:grid-cols-[1.05fr_0.95fr]">
        <div
          className="absolute left-0 top-0 h-4 w-32 border-b-4 border-r-4 border-black bg-[#ffdc3e]"
          aria-hidden="true"
        />

        <div className="flex flex-col justify-between border-b-4 border-black p-7 pt-12 md:border-b-0 md:border-r-4 md:p-10 md:pt-10">
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[#e34b31]">
              {configuration.event.event_name}
            </p>
            <h1 className="text-4xl font-black leading-[0.92] tracking-[-0.04em] sm:text-5xl">
              Data Customer
            </h1>
            <p className="mt-4 max-w-md text-base font-semibold leading-7 text-black/65">
              Data ini opsional. Kosongkan saja bila tamu tidak ingin mengisi.
            </p>

            <div className="mt-8 grid gap-5">
              <NeoInput
                label="Nama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama"
                className={inputClass}
              />
              <NeoInput
                label="Nomor telepon"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Nomor telepon"
                className={inputClass}
              />
              <NeoInput
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className={inputClass}
              />
            </div>

            {error && (
              <p
                role="alert"
                className="mt-6 border-4 border-black bg-[#e34b31] px-4 py-3 text-sm font-black text-white shadow-[5px_5px_0_0_#111111]"
              >
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between bg-[#ffdc3e] p-7 md:p-10">
          <div className='space-y-5'>
            <div className="flex flex-wrap gap-3 text-xs font-black uppercase tracking-wider">
              <span className="border-2 border-black bg-[#b7eff0] px-3 py-2">Opsional</span>
              <span className="border-2 border-black bg-white px-3 py-2">
                {configuration.event.booth.name}
              </span>
            </div>
            <p className="max-w-xs text-2xl font-black leading-tight">
              Isi kontak supaya hasil foto bisa dikirim dan diunduh nanti.
            </p>
          </div>

          <div className="mt-12 grid gap-4">
            <NeoButton
              loading={loading}
              onClick={() => void submit(false)}
              className="w-full bg-[#e34b31] px-6 py-4 text-lg text-black shadow-[7px_7px_0_0_#111111] hover:bg-[#cf3d26] [transition:none]"
            >
              Lanjut Foto <span aria-hidden="true">→</span>
            </NeoButton>
            <div className="grid grid-cols-2 gap-4">
              <NeoButton
                onClick={() => navigate('/payment')}
                variant="outlined"
                className="w-full px-6 py-4 text-base shadow-[7px_7px_0_0_#111111] [transition:none]"
              >
                Kembali
              </NeoButton>
              <NeoButton
                loading={loading}
                onClick={() => void submit(true)}
                variant="secondary"
                className="w-full px-6 py-4 text-base shadow-[7px_7px_0_0_#111111] [transition:none]"
              >
                Lewati
              </NeoButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
