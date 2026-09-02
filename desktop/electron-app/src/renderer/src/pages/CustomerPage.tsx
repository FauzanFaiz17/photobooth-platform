import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import { getApiErrorMessage } from '@/api/axios'
import { resolveCustomer } from '@/api/customer'
import { createPhotoSession } from '@/api/media'
import { useSessionStore } from '@/store/sessionStore'
import { getAppSettings } from '@/features/settings/deviceSettings'

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
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col justify-center gap-4">
      <h1 className="text-2xl font-bold text-slate-800">Data Customer</h1>
      <p className="text-sm text-slate-500">Data ini opsional.</p>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" />
      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nomor telepon" />
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
      />
      {error && <Alert type="error">{error}</Alert>}
      <div className="flex gap-3">
        <Button onClick={() => navigate('/payment')} className="bg-slate-500 hover:bg-slate-600">
          Kembali
        </Button>
        <Button loading={loading} onClick={() => void submit(false)}>
          Lanjut Foto
        </Button>
        <Button
          loading={loading}
          onClick={() => void submit(true)}
          className="bg-slate-400 hover:bg-slate-500"
        >
          Lewati
        </Button>
      </div>
    </div>
  )
}
