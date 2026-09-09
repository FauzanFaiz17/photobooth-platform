import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '@/api/axios'
import { NeoButton } from '@/components/shared/button'
import Alert from '@/components/ui/Alert'
import { verifyPassword } from '@/features/auth/api/auth'
import { authService } from '@/features/auth/services/authService'
import CameraTestPanel from '@/features/camera/components/CameraTestPanel'
import { NeoInput } from '@/components/shared/input'
import {
  type AppSettings,
  DEFAULT_APP_SETTINGS,
  getAppSettings,
  saveAppSettings,
  getPrinterSettings,
  savePrinterSettings,
  getPrintSampleSettings,
  savePrintSampleSettings,
  type PrintSampleImage,
  type PrintSampleSettings
} from '@/features/settings/deviceSettings'

const PAPER_DIMENSIONS_MM: Record<'2r' | '4r', { width: number; height: number }> = {
  '2r': { width: 60, height: 90 },
  '4r': { width: 100, height: 150 }
}

/**
 * Preview akurat layout print: mereplikasi logika main process —
 * kertas selalu sesuai media fisik (portrait), dan gambar landscape
 * dirotasi 90 derajat lewat CSS. Area hitam = pinggir kertas yang
 * tidak tertutup gambar.
 */
function PaperPreview({
  paperSize,
  orientation,
  sampleImage,
  scale,
  horizontalPosition,
  verticalPosition,
  quality
}: {
  paperSize: '2r' | '4r'
  orientation: 'portrait' | 'landscape'
  sampleImage: PrintSampleImage | null
  scale: number
  horizontalPosition: number
  verticalPosition: number
  quality: 'best' | 'photo' | 'normal' | 'draft'
}) {
  const paper = PAPER_DIMENSIONS_MM[paperSize]
  const isLandscape = orientation === 'landscape'
  const imgW = isLandscape ? paper.height : paper.width
  const imgH = isLandscape ? paper.width : paper.height
  const scalePct = Math.max(5, Math.min(200, scale)) / 100

  // Tampilan preview dalam px (0.75 px per mm supaya pas di layar)
  const pxPerMm = 0.75
  const paperW = paper.width * pxPerMm
  const paperH = paper.height * pxPerMm

  return (
    <div
      className="relative grid place-items-center bg-black"
      style={{ width: paperW, height: paperH, margin: '0 auto' }}
    >
      {sampleImage?.dataUrl ? (
        <img
          src={sampleImage.dataUrl}
          alt="Print sample"
          className="absolute"
          style={
            isLandscape
              ? {
                  width: imgW * pxPerMm * scalePct,
                  height: imgH * pxPerMm * scalePct,
                  transform: `translate(calc(-50% + ${horizontalPosition / 4}px), calc(-50% + ${verticalPosition / 4}px)) rotate(90deg)`,
                  top: '50%',
                  left: '50%'
                }
              : {
                  width: imgW * pxPerMm * scalePct,
                  height: imgH * pxPerMm * scalePct,
                  transform: `translate(calc(-50% + ${horizontalPosition / 4}px), calc(-50% + ${verticalPosition / 4}px))`,
                  top: '50%',
                  left: '50%'
                }
          }
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-center text-xs font-bold text-white/50">
          <span>
            {imgW} x {imgH} mm
            <br />
            {orientation.toUpperCase()} · {quality.toUpperCase()} · {scale}%
            <br />
            (upload gambar sampel untuk preview)
          </span>
        </div>
      )}
    </div>
  )
}

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
          <NeoInput
            onChange={(event) => setHome((current) => ({ ...current, title: event.target.value }))}
            placeholder="Judul halaman Start"
            maxLength={100}
          />
          <NeoInput
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

      {saved && <Alert type="success">Setting aplikasi berhasil disimpan.</Alert>}
      <div className="flex justify-between gap-3">
        <NeoButton variant="outlined" onClick={onBack}>
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
  const [quality, setQuality] = useState<'standard' | 'high'>('standard')
  const [scale, setScale] = useState(100)
  const [horizontalPosition, setHorizontalPosition] = useState(0)
  const [verticalPosition, setVerticalPosition] = useState(0)
  const [paperSize, setPaperSize] = useState<'2r' | '4r'>('4r')
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [sampleImage, setSampleImage] = useState<PrintSampleImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    void Promise.all([window.electron.printer.list(), getPrinterSettings(), getPrintSampleSettings()])
      .then(([available, stored, sample]) => {
        setPrinters(available)
        setDeviceName(
          stored?.deviceName ??
            available.find((printer) => printer.isDefault)?.name ??
            available[0]?.name ??
            ''
        )
        setQuality(stored?.quality ?? 'standard')
        setScale(stored?.scale ?? 100)
        setHorizontalPosition(stored?.horizontalPosition ?? 0)
        setVerticalPosition(stored?.verticalPosition ?? 0)
        setPaperSize(stored?.paperSize ?? '4r')
        setOrientation(stored?.orientation ?? 'portrait')
        setSampleImage(sample?.['4r'] ?? null)
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
      await savePrinterSettings({ deviceName: selected.name, displayName: selected.displayName, quality, scale, horizontalPosition, verticalPosition, paperSize, orientation })
      await window.electron.printer.test(selected.name, { paperSize, orientation })
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

  async function refreshPrinters(): Promise<void> {
    setLoading(true)
    try { setPrinters(await window.electron.printer.list()) } finally { setLoading(false) }
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
      <NeoButton variant="outlined" disabled={loading} onClick={() => void refreshPrinters()}>Refresh daftar printer</NeoButton>

      <div className="grid gap-4 border-4 border-(--border) bg-(--surface) p-4 shadow-(--shadow-neo)">
        <label className="grid gap-2 font-bold">Print quality<select value={quality} onChange={(e) => setQuality(e.target.value as 'standard' | 'high')} className="border-2 border-(--border) bg-(--background) p-2"><option value="standard">Standard</option><option value="high">High</option></select></label>
        <label className="grid gap-2 font-bold">Ukuran kertas<select value={paperSize} onChange={(e) => setPaperSize(e.target.value as '2r' | '4r')} className="border-2 border-(--border) bg-(--background) p-2"><option value="4r">4R</option><option value="2r">2R</option></select></label>
        <label className="grid gap-2 font-bold">Orientasi cetak<select value={orientation} onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')} className="border-2 border-(--border) bg-(--background) p-2"><option value="portrait">Portrait (tinggi)</option><option value="landscape">Landscape (mendatar)</option></select></label>
        {([['Scale', scale, setScale, 80, 120], ['Horizontal position', horizontalPosition, setHorizontalPosition, -100, 100], ['Vertical position', verticalPosition, setVerticalPosition, -100, 100]] as const).map(([label, value, setter, min, max]) => <label key={label} className="grid gap-2 font-bold">{label}<div className="flex gap-2"><input className="w-full" type="range" min={min} max={max} value={value} onChange={(e) => setter(Number(e.target.value))} /><input className="w-20 border-2 border-(--border) p-2" type="number" min={min} max={max} value={value} onChange={(e) => setter(Number(e.target.value))} /></div></label>)}
      </div>

      <div className="grid gap-3 border-4 border-(--border) bg-[#202020] p-4 text-white shadow-(--shadow-neo)">
        <p className="font-black uppercase tracking-wider">
          Preview {paperSize === '2r' ? '2R (2R x 2)' : '4R'} — {orientation === 'landscape' ? 'Landscape' : 'Portrait'}
        </p>
        <PaperPreview paperSize={paperSize} orientation={orientation} sampleImage={sampleImage} scale={scale} horizontalPosition={horizontalPosition} verticalPosition={verticalPosition} quality={quality === 'high' ? 'photo' : 'normal'} />
        <p className="text-xs text-white/70">
          Preview menampilkan gambar sampel di atas media kertas (ukuran sebenarnya: {paperSize === '2r' ? '60 x 90 mm' : '100 x 150 mm'}).
          Area hitam adalah pinggir kertas yang tidak tertutup gambar. Atur Scale dan posisi Horizontal/Vertical sampai gambar
          penuh memenuhi kertas, lalu Simpan dan Test Print.
        </p>
      </div>

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

function DnpPresetTest({ onBack }: { onBack: () => void }): JSX.Element {
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [samples, setSamples] = useState<PrintSampleSettings>({
    '2r': null,
    '4r': null
  })
  const [printerReady, setPrinterReady] = useState(false)

  useEffect(() => {
    void Promise.all([getPrintSampleSettings(), getPrinterSettings()]).then(
      ([storedSamples, printer]) => {
        setSamples(storedSamples)
        setPrinterReady(Boolean(printer))
      }
    )
  }, [])

  async function chooseSample(paperSize: '2r' | '4r'): Promise<void> {
    const picked = await window.electron.printer.pickSampleImage()
    if (!picked) return
    setSamples((current) => {
      const next: PrintSampleSettings = { ...current, [paperSize]: picked as PrintSampleImage }
      void savePrintSampleSettings(next)
      return next
    })
  }

  function removeSample(paperSize: '2r' | '4r'): void {
    setSamples((current) => {
      const next: PrintSampleSettings = { ...current, [paperSize]: null }
      void savePrintSampleSettings(next)
      return next
    })
  }

  // Sementara: hanya uji 4R dan 2R. Preset 2R x 2 ditunda sampai keduanya lolos.
  const presets = [
    { id: '4r', label: '4R', retry: false, cut: false, paper: '4r' as const, copies: 1 },
    { id: '2r', label: '2R', retry: false, cut: true, paper: '2r' as const, copies: 1 }
  ]

  async function test(preset: (typeof presets)[number]): Promise<void> {
    const printer = await getPrinterSettings()
    if (!printer) { setMessage('Pilih printer terlebih dahulu di Test Printer.'); return }
    const sample = samples[preset.paper]
    if (!sample) { setMessage(`Pilih foto sample ${preset.paper === '2r' ? '2R' : '4R'} terlebih dahulu.`); return }
    setTesting(true); setMessage(null)
    try {
      await window.electron.printer.test(printer.deviceName, {
        paperSize: preset.paper,
        copies: preset.copies,
        sampleDataUrl: sample.dataUrl
      })
      setMessage(`${preset.label} dikirim memakai sample "${sample.name}". Print Retry: ${preset.retry ? 'Enable' : 'Disable'}, 2-inch Cut: ${preset.cut ? 'Enable' : 'Disable'}.`)
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Test print gagal.') }
    finally { setTesting(false) }
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 p-6">
      <NeoButton
        variant="outlined"
        className="self-start"
        onClick={onBack}
      >
        Kembali
      </NeoButton>
      <div>
        <h2 className="text-2xl font-black">Test Print Preset DNP</h2>
        <p className="text-sm font-semibold text-[var(--muted-foreground)]">
          Uji 4R dan 2R. Pilih sample foto, lalu kirim test print ke printer DNP.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SamplePicker
          paperSize="4r"
          sample={samples['4r']}
          onChoose={chooseSample}
          onRemove={removeSample}
        />
        <SamplePicker
          paperSize="2r"
          sample={samples['2r']}
          onChoose={chooseSample}
          onRemove={removeSample}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {presets.map((preset) => (
          <NeoButton
            key={preset.id}
            variant="secondary"
            disabled={testing}
            onClick={() => void test(preset)}
          >
            {testing ? 'Mencetak...' : `Test Print ${preset.label}`}
          </NeoButton>
        ))}
      </div>
      {!printerReady && (
        <p className="text-sm font-bold text-[var(--danger)]">
          Printer belum dipilih. Buka menu Test Printer terlebih dahulu.
        </p>
      )}
      {message && <p className="text-sm font-bold">{message}</p>}
    </div>
  )
}

function SamplePicker({ paperSize, sample, onChoose, onRemove }: {
  paperSize: '2r' | '4r'
  sample: PrintSampleImage | null
  onChoose: (paperSize: '2r' | '4r') => void
  onRemove: (paperSize: '2r' | '4r') => void
}): JSX.Element {
  const label = paperSize === '2r' ? '2R' : '4R'
  return (
      <div className="border-4 border-(--border) bg-(--surface) p-4 shadow-(--shadow-neo)">
        <div className="flex items-center justify-between gap-3">
          <p className="font-black uppercase tracking-wider">Sample {label}</p>
          {sample && (
            <NeoButton variant="secondary" onClick={() => onRemove(paperSize)}>
              Hapus
            </NeoButton>
          )}
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="grid h-28 w-20 shrink-0 place-items-center overflow-hidden border-2 border-(--border) bg-white">
            {sample ? (
              <img src={sample.dataUrl} alt={`Sample ${label}`} className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs font-black text-(--muted-foreground)">{label}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-all text-sm font-bold">
              {sample ? sample.name : 'Belum ada foto sample'}
            </p>
            <p className="mt-1 text-xs font-semibold text-(--muted-foreground)">
              Foto ini yang akan dicetak saat test print {label}.
            </p>
            <NeoButton
              variant="outlined"
              className="mt-2"
              onClick={() => onChoose(paperSize)}
            >
              {sample ? 'Ganti Foto' : 'Pilih Foto'}
            </NeoButton>
          </div>
        </div>
      </div>
    )
}

export default function SettingsPage(): JSX.Element {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [verified, setVerified] = useState(false)
  const [screen, setScreen] = useState<'menu' | 'app' | 'camera' | 'printer' | 'dnp'>('menu')
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

  function handleEnterEvent(): void {
    navigate('/dashboard')
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
  if (screen === 'dnp') return <DnpPresetTest onBack={() => setScreen('menu')} />
  if (screen === 'app') return <AppSettingsPanel onBack={() => setScreen('menu')} />
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
            Atur tampilan home, timer sesi, QR, countdown, dan folder foto.
          </p>
        </button>
        <button type="button" onClick={() => setScreen('dnp')} className="border-4 border-[var(--border)] bg-[var(--surface)] p-7 text-left shadow-[var(--shadow-neo)] hover:bg-[var(--primary)]"><span className="text-xl font-black">Uji Preset DNP</span><p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">Uji 4R dan 2R.</p></button>
        <button
          type="button"
          onClick={() => setScreen('app')}
          className="border-[var(--border)] bg-[var(--surface)] p-7 text-left shadow-[var(--shadow-neo)] [transition:none] hover:bg-[var(--accent)]"
        >
          <span className="text-xl font-black">Edit Home</span>
          <p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
            Ubah logo, judul, dan keterangan halaman Start (ada di dalam Setting App).
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
          className="border-[var(--border)] bg-[var(--surface)] p-7 text-left shadow-[var(--shadow-neo)] [transition:none] hover:bg-[var(--primary)]"
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
            variant="outlined"
            onClick={() => void handleEnterEvent()}
            className="border-[var(--border)] bg-(--accent) font-black text-[var(--foreground)] shadow-[var(--shadow-neo)] [transition:none] hover:bg-[#8cdbdf]"
          >
            enter event
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
