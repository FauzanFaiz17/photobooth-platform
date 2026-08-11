import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import { useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '@/api/axios'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Label from '@/components/ui/Label'
import { activateDevice } from '@/features/devices/api/device'
import { useDeviceStore } from '@/store/deviceStore'

export default function DeviceActivationPage(): JSX.Element {
  const navigate = useNavigate()
  const fingerprint = useDeviceStore((state) => state.fingerprint)
  const setDevice = useDeviceStore((state) => state.setDevice)
  const [activationCode, setActivationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    if (!fingerprint) {
      setError('Fingerprint komputer belum tersedia. Mulai ulang aplikasi.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const device = await activateDevice(activationCode.trim().toUpperCase(), fingerprint)
      setDevice(device)
      navigate('/login', { replace: true })
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, 'Device tidak dapat diaktifkan.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={(event) => void handleSubmit(event)}>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">Aktivasi Device</h1>
        <p className="mt-2 text-sm text-slate-500">
          Masukkan kode aktivasi yang dibuat dari dashboard partner.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="activation-code">Kode Aktivasi</Label>
        <Input
          id="activation-code"
          value={activationCode}
          onChange={(event) => setActivationCode(event.target.value.toUpperCase())}
          placeholder="PB-ABCD-EFGH"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          className="text-center font-mono uppercase tracking-wider"
        />
      </div>

      {fingerprint && (
        <p className="break-all rounded-lg bg-slate-100 p-3 text-xs text-slate-500">
          Device UUID: {fingerprint.deviceUuid}
        </p>
      )}

      {error && <Alert type="error">{error}</Alert>}

      <Button type="submit" loading={loading} disabled={!activationCode.trim()}>
        Aktifkan Device
      </Button>
    </form>
  )
}
