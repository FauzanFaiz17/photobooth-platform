import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '@/api/axios'
import { NeoButton } from '@/components/shared/button'
import Alert from '@/components/ui/Alert'
import { verifyPassword } from '@/features/auth/api/auth'
import { authService } from '@/features/auth/services/authService'
import { useWebcam } from '@/features/camera/hooks/useWebcam'
import { NeoInput } from '@/components/shared/input'
import {
  type AppSettings,
  DEFAULT_APP_SETTINGS,
  getAppSettings,
  saveAppSettings,
  getPrinterSettings,
  savePrinterSettings
} from '@/features/settings/deviceSettings'

interface HomeSettings {
  title: string
  subtitle: string
  logo: string | null
}
const HOME_SETTINGS_KEY = 'desktop.home-settings'

function SliderInput({
  label,
  value,
  minimum,
  maximum,
  unit,
  onChange
}: {
  label: string
  value: number
  minimum: number
  maximum: number
  unit: string
  onChange: (value: number) => void
}): JSX.Element {
  function update(rawValue: string): void {
    const parsed = Number(rawValue)
    if (!Number.isFinite(parsed)) return
    onChange(Math.max(minimum, Math.min(maximum, Math.round(parsed))))
  }

  return (
    <div className="space-y-2 border-b-2 border-[var(--border)] pb-4 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <label className="font-black">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={minimum}
            max={maximum}
            value={value}
            onChange={(event) => update(event.target.value)}
            className="h-11 w-20 border-4 border-[var(--border)] bg-[var(--background)] px-2 text-center font-black outline-none"
          />
          <span className="w-12 text-sm font-bold text-[var(--muted-foreground)]">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={minimum}
        max={maximum}
        value={value}
        onChange={(event) => update(event.target.value)}
        className="h-6 w-full accent-[var(--danger)]"
      />
      <div className="flex justify-between text-xs font-bold text-[var(--muted-foreground)]">
        <span>
          {minimum} {unit}
        </span>
        <span>
          {maximum} {unit}
        </span>
      </div>
    </div>
  )
}

function AppSettingsPanel({ onBack }: { onBack: () => void }): JSX.Element {
  const [home, setHome] = useState<HomeSettings>({ title: '', subtitle: '', logo: null })
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void Promise.all([window.storage.get(HOME_SETTINGS_KEY), getAppSettings()]).then(
      ([storedHome, storedSettings]) => {
        if (storedHome && typeof storedHome === 'object') setHome(storedHome as HomeSettings)
        setSettings(storedSettings)
      }
    )
  }, [])

  async function chooseLogo(): Promise<void> {
    const logo = await window.electron.home.pickImage()
    if (logo) setHome((current) => ({ ...current, logo }))
  }

  async function chooseStorageDirectory(): Promise<void> {
    const directory = await window.electron.storage.pickDirectory()
    if (directory) setSettings((current) => ({ ...current, storageDirectory: directory }))
  }

  async function save(): Promise<void> {
    await Promise.all([window.storage.set(HOME_SETTINGS_KEY, home), saveAppSettings(settings)])
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-5 bg-[var(--background)] p-5 text-[var(--foreground)] md:p-8">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--danger)]">
          App setup
        </p>
        <h1 className="text-4xl font-black">Setting App</h1>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto lg:grid-cols-2">
        <section className="space-y-4 border-4 border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-neo)]">
          <h2 className="text-xl font-black">Tampilan Home</h2>
          <div className="flex flex-wrap items-center gap-4">
            {home.logo ? (
              <img src={home.logo} alt="Logo home" className="h-24 w-24 object-cover" />
            ) : (
              <div className="grid h-24 w-24 place-items-center border-4 border-[var(--border)] bg-[var(--accent)] font-black">
                Logo
              </div>
            )}
            <div className="flex gap-2">
              <NeoButton onClick={() => void chooseLogo()}>Pilih Logo</NeoButton>
              {home.logo && (
                <NeoButton
                  variant="secondary"
                  onClick={() => setHome((current) => ({ ...current, logo: null }))}
                >
                  Hapus
                </NeoButton>
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
            onChange={(event) =>
              setHome((current) => ({ ...current, subtitle: event.target.value }))
            }
            placeholder="Keterangan singkat"
            maxLength={150}
          />

          <div className="space-y-2 pt-3">
            <h2 className="text-xl font-black">Penyimpanan Lokal</h2>
            <div className="break-all border-4 border-[var(--border)] bg-[var(--background)] p-3 text-sm font-bold">
              {settings.storageDirectory ?? 'Default: Pictures/Photobooth'}
            </div>
            <div className="flex gap-2">
              <NeoButton variant="outlined" onClick={() => void chooseStorageDirectory()}>
                Pilih Folder
              </NeoButton>
              {settings.storageDirectory && (
                <NeoButton
                  variant="secondary"
                  onClick={() => setSettings((current) => ({ ...current, storageDirectory: null }))}
                >
                  Gunakan Default
                </NeoButton>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4 border-4 border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-neo)]">
          <h2 className="text-xl font-black">Pengaturan Waktu</h2>
          <SliderInput
            label="Countdown Kamera"
            value={settings.countdownSeconds}
            minimum={1}
            maximum={10}
            unit="detik"
            onChange={(countdownSeconds) =>
              setSettings((current) => ({ ...current, countdownSeconds }))
            }
          />
          <SliderInput
            label="Session Timer"
            value={settings.sessionTimerMinutes}
            minimum={1}
            maximum={6}
            unit="menit"
            onChange={(sessionTimerMinutes) =>
              setSettings((current) => ({ ...current, sessionTimerMinutes }))
            }
          />
          <SliderInput
            label="QR Timer"
            value={settings.qrTimerSeconds}
            minimum={5}
            maximum={120}
            unit="detik"
            onChange={(qrTimerSeconds) =>
              setSettings((current) => ({ ...current, qrTimerSeconds }))
            }
          />
        </section>
      </div>
<<<<<<< HEAD

      {saved && <Alert type="success">Setting aplikasi berhasil disimpan.</Alert>}
      <div className="flex justify-between gap-3">
        <NeoButton variant="outlined" onClick={onBack}>
=======
      {devices.length > 1 && (
        <select
          value={activeDeviceId ?? ''}
          onChange={(event) => selectDevice(event.target.value)}
          className="border-4 border-[var(--border)] bg-[var(--surface)] px-3 py-3 font-bold text-[var(--foreground)] shadow-[var(--shadow-neo)] outline-none"
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-3">
        <NeoButton
          variant="outlined"
          onClick={onBack}
          className="border-(--border) bg-(--surface) px-5 py-3 font-black text-(--foreground) shadow-(--shadow-neo) [transition:none] hover:bg-[var(--accent)]"
        >
>>>>>>> 434f641efcc3346a5a5bcbba76a9713e89a4de5e
          Kembali
        </NeoButton>
        <NeoButton onClick={() => void save()}>Simpan Setting</NeoButton>
      </div>
    </div>
  )
}

function PrinterTest({ onBack }: { onBack: () => void }): JSX.Element {
  const [printers, setPrinters] = useState<
    Array<{ name: string; displayName: string; isDefault: boolean }>
  >([])
  const [deviceName, setDeviceName] = useState('')
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    void Promise.all([window.electron.printer.list(), getPrinterSettings()])
      .then(([available, stored]) => {
        setPrinters(available)
        setDeviceName(
          stored?.deviceName ??
            available.find((printer) => printer.isDefault)?.name ??
            available[0]?.name ??
            ''
        )
      })
      .catch((cause) => {
        setMessage({
          type: 'error',
          text: cause instanceof Error ? cause.message : 'Daftar printer tidak dapat dibaca.'
        })
      })
      .finally(() => setLoading(false))
  }, [])

  async function saveAndTest(): Promise<void> {
    const selected = printers.find((printer) => printer.name === deviceName)
    if (!selected) return

    setTesting(true)
    setMessage(null)
    try {
      await savePrinterSettings({ deviceName: selected.name, displayName: selected.displayName })
      await window.electron.printer.test(selected.name)
      setMessage({ type: 'success', text: 'Test print dikirim ke printer.' })
    } catch (cause) {
      setMessage({
        type: 'error',
        text: cause instanceof Error ? cause.message : 'Test print gagal.'
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-xl flex-col gap-6 bg-(--background) p-5 text-(--foreground) md:p-8">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-(--danger)">
          Printer setup
        </p>
        <h1 className="text-4xl font-black">Test Printer</h1>
        <p className="mt-2 font-semibold text-(--muted-foreground)">
          Pilih nama driver Windows untuk DNP RX1HS.
        </p>
      </div>

      <select
        value={deviceName}
        disabled={loading || printers.length === 0}
        onChange={(event) => setDeviceName(event.target.value)}
        className="border-4 border-(--border) bg-(--surface) px-4 py-3 font-bold shadow-(--shadow-neo)"
      >
        {printers.length === 0 && <option value="">Printer tidak ditemukan</option>}
        {printers.map((printer) => (
          <option key={printer.name} value={printer.name}>
            {printer.displayName}
            {printer.isDefault ? ' (Default)' : ''}
          </option>
        ))}
      </select>

      {message && <Alert type={message.type}>{message.text}</Alert>}

      <div className="mt-auto flex justify-between gap-3">
        <NeoButton variant="outlined" onClick={onBack}>
          Kembali
        </NeoButton>
        <NeoButton disabled={!deviceName || testing} onClick={() => void saveAndTest()}>
          {testing ? 'Mengirim...' : 'Simpan dan Test Print'}
        </NeoButton>
      </div>
    </div>
  )
}

export default function SettingsPage(): JSX.Element {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [verified, setVerified] = useState(false)
  const [screen, setScreen] = useState<'menu' | 'app' | 'camera' | 'printer'>('menu')
  const [error, setError] = useState<string | null>(null)
  async function verify(): Promise<void> {
    try {
      await verifyPassword(password)
      setVerified(true)
      setError(null)
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Password salah. Pengaturan tidak dapat dibuka.'))
    }
  }
  async function handleLogout(): Promise<void> {
    await authService.logout()
    navigate('/login', { replace: true })
  }
  if (!verified)
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void verify()
        }}
        className="mx-auto flex h-full w-full max-w-sm flex-col justify-center gap-5 bg-[var(--background)] px-5 text-[var(--foreground)]"
      >
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--danger)]">
          Settings access
        </p>
        <h1 className="text-4xl font-black tracking-[-0.04em]">Verifikasi Pengaturan</h1>
        <p className="text-sm font-semibold text-[var(--muted-foreground)]">
          Masukkan password operator yang sedang login.
        </p>
        <NeoInput
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password operator"
          autoFocus
        />
        {error && <Alert type="error">{error}</Alert>}
        <NeoButton
          type="submit"
          className="border-[var(--border)] bg-[var(--primary)] py-3 font-black text-[var(--foreground)] shadow-[var(--shadow-neo)] [transition:none] hover:bg-[#f2cc25]"
        >
          Buka Pengaturan
        </NeoButton>
        <NeoButton
          variant="outlined"
          type="button"
          onClick={() => navigate('/welcome')}
          className="border-[var(--border)] bg-[var(--surface)] py-3 font-black text-[var(--foreground)] shadow-[var(--shadow-neo)] [transition:none] hover:bg-[var(--accent)]"
        >
          Kembali
        </NeoButton>
      </form>
    )
  if (screen === 'camera') return <CameraTestPanel onBack={() => setScreen('menu')} />
  if (screen === 'printer') return <PrinterTest onBack={() => setScreen('menu')} />
<<<<<<< HEAD
  if (screen === 'app') return <AppSettingsPanel onBack={() => setScreen('menu')} />
=======
  if (screen === 'countdown')
    return (
      <div className="mx-auto flex h-full w-full max-w-xl flex-col gap-6 bg-[var(--background)] p-5 text-[var(--foreground)] md:p-8">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--danger)]">
            02 / Camera timing
          </p>
          <h1 className="text-4xl font-black tracking-[-0.04em]">Countdown Foto</h1>
          <p className="mt-2 font-semibold text-[var(--muted-foreground)]">
            Waktu ini berlaku untuk pengambilan foto pada perangkat booth ini.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {COUNTDOWN_OPTIONS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => setCountdown(seconds)}
              className={`min-h-24 border-4 border-[var(--border)] text-2xl font-black shadow-[var(--shadow-neo)] [transition:none] ${
                countdown === seconds ? 'bg-[var(--primary)]' : 'bg-[var(--surface)]'
              }`}
            >
              {seconds} detik
            </button>
          ))}
        </div>
        {saved && <Alert type="success">Countdown berhasil disimpan.</Alert>}
        <div className="mt-auto flex gap-3">
          <NeoButton variant="outlined" onClick={() => setScreen('menu')}>
            Kembali
          </NeoButton>
          <NeoButton onClick={() => void saveCountdown()}>Simpan</NeoButton>
        </div>
      </div>
    )
  if (screen === 'home')
    return (
      <div className="mx-auto flex h-full w-full max-w-xl flex-col gap-5 bg-[var(--background)] p-5 text-[var(--foreground)] md:p-8">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--danger)]">
            01 / Home identity
          </p>
          <h1 className="text-4xl font-black tracking-[-0.04em]">Edit Home</h1>
          <p className="mt-2 font-semibold text-[var(--muted-foreground)]">
            Logo dan tulisan disimpan pada perangkat booth ini.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-4 border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-neo)]">
          {home.logo ? (
            <img src={home.logo} className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center border-4 border-[var(--border)] bg-[var(--accent)] font-black">
              Logo
            </div>
          )}
          <div className="flex gap-2">
            <NeoButton
              onClick={() => void chooseLogo()}
              className="border-[var(--border)] bg-[var(--primary)] font-black text-[var(--foreground)] shadow-[var(--shadow-neo)] [transition:none] hover:bg-[#f2cc25]"
            >
              Pilih Logo
            </NeoButton>
            {home.logo && (
              <NeoButton
                variant="secondary"
                onClick={() => setHome((current) => ({ ...current, logo: null }))}
                className="border-[var(--border)] bg-[var(--secondary)] font-black text-[var(--foreground)] shadow-[var(--shadow-neo)] [transition:none] hover:bg-[#ff78a4]"
              >
                Hapus
              </NeoButton>
            )}
          </div>
        </div>
        <NeoInput
          value={home.title}
          onChange={(event) => setHome((current) => ({ ...current, title: event.target.value }))}
          placeholder="Judul halaman Start"
          maxLength={100}
        />
        <NeoInput
          value={home.subtitle}
          onChange={(event) => setHome((current) => ({ ...current, subtitle: event.target.value }))}
          placeholder="Keterangan singkat"
          maxLength={150}
        />
        {saved && <Alert type="success">Tampilan Home berhasil disimpan.</Alert>}
        <div className="mt-auto flex gap-3">
          <NeoButton
            variant="outlined"
            onClick={() => setScreen('menu')}
            className="border-[var(--border)] bg-[var(--surface)] font-black text-[var(--foreground)] shadow-[var(--shadow-neo)] [transition:none] hover:bg-[var(--accent)]"
          >
            Kembali
          </NeoButton>
          <NeoButton
            onClick={() => void saveHome()}
            className="border-[var(--border)] bg-[var(--primary)] font-black text-[var(--foreground)] shadow-[var(--shadow-neo)] [transition:none] hover:bg-[#f2cc25]"
          >
            Simpan
          </NeoButton>
        </div>
      </div>
    )
>>>>>>> 434f641efcc3346a5a5bcbba76a9713e89a4de5e
  return (
    <div className="flex h-full flex-col gap-6 bg-[var(--background)] p-5 text-[var(--foreground)] md:p-8">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--danger)]">
          Control room
        </p>
        <h1 className="text-4xl font-black tracking-[-0.04em]">Pengaturan</h1>
        <p className="mt-2 font-semibold text-[var(--muted-foreground)]">
          Pilih pengaturan yang ingin dibuka.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setScreen('app')}
          className="border-4 border-[var(--border)] bg-[var(--surface)] p-7 text-left shadow-[var(--shadow-neo)] [transition:none] hover:bg-[var(--primary)]"
        >
          <span className="text-xl font-black">Setting App</span>
          <p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
<<<<<<< HEAD
            Atur tampilan home, timer sesi, QR, countdown, dan folder foto.
=======
            Pilih jeda 2, 3, atau 5 detik sebelum kamera mengambil foto.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setScreen('home')}
          className="border-4 border-(--border) bg-[var(--surface)] p-7 text-left shadow-(--shadow-neo) [transition:none] hover:bg-[var(--accent)]"
        >
          <span className="text-xl font-black">Edit Home</span>
          <p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
            Ubah logo, judul, dan keterangan halaman Start.
>>>>>>> 434f641efcc3346a5a5bcbba76a9713e89a4de5e
          </p>
        </button>
        <button
          type="button"
          onClick={() => setScreen('camera')}
          className="border-4 border-[var(--border)] bg-[var(--surface)] p-7 text-left shadow-[var(--shadow-neo)] [transition:none] hover:bg-[var(--secondary)]"
        >
          <span className="text-xl font-black">Test Kamera</span>
          <p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
            Lihat preview dan periksa kamera yang terhubung.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setScreen('printer')}
          className="border-4 border-(--border) bg-(--surface) p-7 text-left shadow-(--shadow-neo) [transition:none] hover:bg-(--primary)"
        >
          <span className="text-xl font-black">Test Printer</span>
          <p className="mt-2 text-sm font-semibold text-(--muted-foreground)">
            Pilih driver DNP RX1HS dan kirim satu lembar test print 4R.
          </p>
        </button>
      </div>
      <div className="mt-auto flex justify-between">
        <NeoButton
          variant="outlined"
          onClick={() => navigate('/welcome')}
          className="border-[var(--border)] bg-[var(--surface)] font-black text-[var(--foreground)] shadow-[var(--shadow-neo)] [transition:none] hover:bg-[var(--accent)]"
        >
          Kembali
        </NeoButton>
        <div className="flex gap-3">
          <NeoButton
            variant="outlined"
            onClick={() => void window.electron.window.minimize()}
            className="border-[var(--border)] bg-[var(--accent)] font-black text-[var(--foreground)] shadow-[var(--shadow-neo)] [transition:none] hover:bg-[#8cdbdf]"
          >
            Minimize
          </NeoButton>
          <NeoButton
            variant="secondary"
            onClick={() => void handleLogout()}
            className="border-[var(--border)] bg-[var(--secondary)] font-black text-[var(--foreground)] shadow-[var(--shadow-neo)] [transition:none] hover:bg-[#ff78a4]"
          >
            Logout
          </NeoButton>
          <NeoButton
            variant="secondary"
            onClick={() => void window.electron.window.close()}
            className="border-[var(--border)] bg-[var(--danger)] font-black text-white shadow-[var(--shadow-neo)] [transition:none] hover:bg-[#cf3d26]"
          >
            Exit
          </NeoButton>
        </div>
      </div>
    </div>
  )
}
