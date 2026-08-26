import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '@/api/axios'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { verifyPassword } from '@/features/auth/api/auth'
import { useWebcam } from '@/features/camera/hooks/useWebcam'

interface HomeSettings {
  title: string
  subtitle: string
  logo: string | null
}
const HOME_SETTINGS_KEY = 'desktop.home-settings'

function CameraTest({ onBack }: { onBack: () => void }): JSX.Element {
  const webcam = useWebcam()
  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Test Kamera</h1>
        <p className="text-slate-500">Pastikan gambar tampil jelas sebelum booth digunakan.</p>
      </div>
      <div className="relative flex-1 overflow-hidden rounded-xl bg-slate-900">
        <video
          ref={webcam.videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-contain"
        />
        {webcam.status !== 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-white">
            {webcam.status === 'requesting'
              ? 'Menghubungkan kamera...'
              : webcam.error || 'Kamera belum siap.'}
          </div>
        )}
      </div>
      {webcam.devices.length > 1 && (
        <select
          value={webcam.activeDeviceId ?? ''}
          onChange={(event) => webcam.selectDevice(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
        >
          {webcam.devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-3">
        <Button onClick={onBack} className="bg-slate-500 hover:bg-slate-600">
          Kembali
        </Button>
        <Button onClick={webcam.retry}>Muat Ulang Kamera</Button>
      </div>
    </div>
  )
}

export default function SettingsPage(): JSX.Element {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [verified, setVerified] = useState(false)
  const [screen, setScreen] = useState<'menu' | 'home' | 'camera'>('menu')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [home, setHome] = useState<HomeSettings>({ title: '', subtitle: '', logo: null })
  useEffect(() => {
    void window.storage.get(HOME_SETTINGS_KEY).then((value) => {
      if (value && typeof value === 'object') setHome(value as HomeSettings)
    })
  }, [])
  async function verify(): Promise<void> {
    try {
      await verifyPassword(password)
      setVerified(true)
      setError(null)
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Password salah. Pengaturan tidak dapat dibuka.'))
    }
  }
  async function chooseLogo(): Promise<void> {
    const logo = await window.electron.home.pickImage()
    if (logo) setHome((current) => ({ ...current, logo }))
  }
  async function saveHome(): Promise<void> {
    await window.storage.set(HOME_SETTINGS_KEY, home)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }
  if (!verified)
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void verify()
        }}
        className="mx-auto flex h-full max-w-sm flex-col justify-center gap-4"
      >
        <h1 className="text-2xl font-bold text-slate-800">Verifikasi Pengaturan</h1>
        <p className="text-sm text-slate-500">Masukkan password operator yang sedang login.</p>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password operator"
          autoFocus
        />
        {error && <Alert type="error">{error}</Alert>}
        <Button type="submit">Buka Pengaturan</Button>
        <Button
          type="button"
          onClick={() => navigate('/welcome')}
          className="bg-slate-500 hover:bg-slate-600"
        >
          Kembali
        </Button>
      </form>
    )
  if (screen === 'camera') return <CameraTest onBack={() => setScreen('menu')} />
  if (screen === 'home')
    return (
      <div className="mx-auto flex h-full w-full max-w-xl flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Home</h1>
          <p className="text-slate-500">Logo dan tulisan disimpan pada perangkat booth ini.</p>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          {home.logo ? (
            <img src={home.logo} className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              Logo
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => void chooseLogo()}>Pilih Logo</Button>
            {home.logo && (
              <Button
                onClick={() => setHome((current) => ({ ...current, logo: null }))}
                className="bg-slate-500 hover:bg-slate-600"
              >
                Hapus
              </Button>
            )}
          </div>
        </div>
        <Input
          value={home.title}
          onChange={(event) => setHome((current) => ({ ...current, title: event.target.value }))}
          placeholder="Judul halaman Start"
          maxLength={100}
        />
        <Input
          value={home.subtitle}
          onChange={(event) => setHome((current) => ({ ...current, subtitle: event.target.value }))}
          placeholder="Keterangan singkat"
          maxLength={150}
        />
        {saved && <Alert type="success">Tampilan Home berhasil disimpan.</Alert>}
        <div className="mt-auto flex gap-3">
          <Button onClick={() => setScreen('menu')} className="bg-slate-500 hover:bg-slate-600">
            Kembali
          </Button>
          <Button onClick={() => void saveHome()}>Simpan</Button>
        </div>
      </div>
    )
  return (
    <div className="flex h-full flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan</h1>
        <p className="text-slate-500">Pilih pengaturan yang ingin dibuka.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="rounded-xl border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:border-blue-400 hover:shadow"
        >
          <span className="text-xl font-bold text-slate-800">Edit Home</span>
          <p className="mt-2 text-sm text-slate-500">
            Ubah logo, judul, dan keterangan halaman Start.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setScreen('camera')}
          className="rounded-xl border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:border-blue-400 hover:shadow"
        >
          <span className="text-xl font-bold text-slate-800">Test Kamera</span>
          <p className="mt-2 text-sm text-slate-500">
            Lihat preview dan periksa kamera yang terhubung.
          </p>
        </button>
      </div>
      <div className="mt-auto flex justify-between">
        <Button onClick={() => navigate('/welcome')} className="bg-slate-500 hover:bg-slate-600">
          Kembali
        </Button>
        <div className="flex gap-3">
          <Button
            onClick={() => void window.electron.window.minimize()}
            className="bg-slate-600 hover:bg-slate-700"
          >
            Minimize
          </Button>
          <Button
            onClick={() => void window.electron.window.close()}
            className="bg-red-600 hover:bg-red-700"
          >
            Exit
          </Button>
        </div>
      </div>
    </div>
  )
}
