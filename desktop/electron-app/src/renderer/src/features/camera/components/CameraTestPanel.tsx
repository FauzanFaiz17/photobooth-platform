import { useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import Alert from '@/components/ui/Alert'
import { NeoButton } from '@/components/shared/button'
import { useWebcam } from '@/features/camera/hooks/useWebcam'
import {
  getCameraSettings,
  getAppSettings,
  saveCameraSettings
} from '@/features/settings/deviceSettings'

const CAMERA_API_URL = 'http://127.0.0.1:5000'

interface CameraOption {
  name: string
  value: number
}

interface CameraOptions {
  iso: CameraOption[]
  aperture: CameraOption[]
  shutter: CameraOption[]
}

interface CameraApiResponse {
  status?: string
  detail?: string
  message?: string
  mirror_mode?: boolean
  options?: Partial<CameraOptions>
}

type CameraSource = 'canon' | `webcam:${string}`
type Orientation = 'portrait' | 'landscape'

async function cameraRequest(
  endpoint: string,
  method = 'GET',
  body?: unknown
): Promise<CameraApiResponse> {
  if (window.api?.request) return window.api.request(endpoint, method, body)

  const response = await fetch(`${CAMERA_API_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  return response.json() as Promise<CameraApiResponse>
}

function ExposureControl({
  label,
  options,
  value,
  disabled,
  onChange
}: {
  label: string
  options: CameraOption[]
  value: number | null
  disabled: boolean
  onChange: (value: number) => void
}): JSX.Element {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )
  const selected = options[selectedIndex]
  function commitInput(element: HTMLInputElement): void {
    const normalized = element.value.trim().toLowerCase()
    const match = options.find(
      (option) =>
        option.name.toLowerCase() === normalized ||
        String(option.value).toLowerCase() === normalized
    )
    if (match) onChange(match.value)
    else element.value = selected?.name ?? ''
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-black">{label}</label>
        <input
          key={selected?.value ?? 'empty'}
          defaultValue={selected?.name ?? ''}
          disabled={disabled || options.length === 0}
          onBlur={(event) => commitInput(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitInput(event.currentTarget)
              event.currentTarget.blur()
            }
          }}
          className="h-10 w-24 border-4 border-[var(--border)] bg-[var(--background)] px-2 text-center text-sm font-black outline-none disabled:opacity-40"
          aria-label={`${label} input`}
        />
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, options.length - 1)}
        step={1}
        value={selectedIndex}
        disabled={disabled || options.length === 0}
        onChange={(event) => onChange(options[Number(event.target.value)].value)}
        className="h-6 w-full cursor-pointer accent-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`${label} slider`}
      />
    </div>
  )
}

export default function CameraTestPanel({ onBack }: { onBack: () => void }): JSX.Element {
  const {
    videoRef,
    status: webcamStatus,
    error: webcamError,
    devices: webcamDevices,
    activeDeviceId,
    selectDevice,
    retry: retryWebcam
  } = useWebcam()
  const [source, setSource] = useState<CameraSource>('canon')
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [mirror, setMirror] = useState(false)
  const [options, setOptions] = useState<CameraOptions>({ iso: [], aperture: [], shutter: [] })
  const [iso, setIso] = useState<number | null>(null)
  const [aperture, setAperture] = useState<number | null>(null)
  const [shutter, setShutter] = useState<number | null>(null)
  const [serviceReady, setServiceReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testPhoto, setTestPhoto] = useState<string | null>(null)

  const isCanon = source === 'canon'
  const selectedWebcamId = source.startsWith('webcam:') ? source.slice(7) : null
  const cameraOptions = useMemo(
    () => [
      { value: 'canon' as const, label: 'Canon R100 (EDSDK)' },
      ...webcamDevices.map((device) => ({
        value: `webcam:${device.deviceId}` as CameraSource,
        label: device.label
      }))
    ],
    [webcamDevices]
  )

  async function loadCanonOptions(): Promise<void> {
    setMessage(null)
    try {
      const data = await cameraRequest('/options')
      if (data.status !== 'success') throw new Error(data.detail || 'Layanan kamera tidak siap.')

      const nextOptions: CameraOptions = {
        iso: data.options?.iso ?? [],
        aperture: data.options?.aperture ?? [],
        shutter: data.options?.shutter ?? []
      }
      setOptions(nextOptions)
      setIso(nextOptions.iso[0]?.value ?? null)
      setAperture(nextOptions.aperture[0]?.value ?? null)
      setShutter(nextOptions.shutter[0]?.value ?? null)
      setServiceReady(true)
      if (nextOptions.iso.length === 0) {
        setMessage({
          type: 'error',
          text: 'Layanan EDSDK aktif, tetapi Canon belum terhubung. Nyalakan kamera dan gunakan mode foto.'
        })
      }
    } catch (cause) {
      setServiceReady(false)
      setMessage({
        type: 'error',
        text: cause instanceof Error ? cause.message : 'Layanan Canon tidak dapat dihubungi.'
      })
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void getCameraSettings().then(async (stored) => {
        const storedDeviceId = stored.deviceId ?? activeDeviceId ?? webcamDevices[0]?.deviceId ?? ''
        const storedSource: CameraSource =
          stored.source === 'canon' ? 'canon' : `webcam:${storedDeviceId}`
        await selectSource(storedSource)
        setOrientation(stored.orientation)
        setMirror(stored.mirror)
        setIso(stored.iso?.value ?? null)
        setAperture(stored.aperture?.value ?? null)
        setShutter(stored.shutter?.value ?? null)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // Initial hydration only; device changes are handled by the source selector.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (source !== 'webcam:' || !webcamDevices[0]) return
    void selectSource(`webcam:${webcamDevices[0].deviceId}`)
    // Only resolves a legacy setting without a stored device id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, webcamDevices])

  async function saveSettings(): Promise<void> {
    setSaving(true)
    try {
      const deviceId = source.startsWith('webcam:') ? source.slice(7) || null : null
      await saveCameraSettings({
        source: isCanon ? 'canon' : 'webcam',
        deviceId,
        deviceLabel: webcamDevices.find((device) => device.deviceId === deviceId)?.label ?? null,
        orientation,
        mirror,
        iso: options.iso.find((option) => option.value === iso) ?? null,
        aperture: options.aperture.find((option) => option.value === aperture) ?? null,
        shutter: options.shutter.find((option) => option.value === shutter) ?? null
      })
      setMessage({ type: 'success', text: 'Pengaturan kamera berhasil disimpan.' })
    } catch (cause) {
      setMessage({
        type: 'error',
        text: cause instanceof Error ? cause.message : 'Pengaturan kamera gagal disimpan.'
      })
    } finally {
      setSaving(false)
    }
  }

  async function selectSource(nextSource: CameraSource): Promise<void> {
    setSource(nextSource)
    setTestPhoto(null)
    setMessage(null)

    if (nextSource === 'canon') {
      const data = await cameraRequest('/toggle_webcam', 'POST', {
        use_webcam: false,
        device_index: 0
      })
      if (data.status === 'error') {
        setMessage({ type: 'error', text: data.detail || 'Canon tidak dapat diaktifkan.' })
      } else {
        await loadCanonOptions()
      }
      return
    }

    const deviceId = nextSource.slice(7)
    if (deviceId) selectDevice(deviceId)
    const deviceIndex = Math.max(
      0,
      webcamDevices.findIndex((device) => device.deviceId === deviceId)
    )
    const data = await cameraRequest('/toggle_webcam', 'POST', {
      use_webcam: true,
      device_index: deviceIndex
    })
    if (data.status === 'error') {
      setMessage({ type: 'error', text: data.detail || 'Sumber webcam tidak dapat diaktifkan.' })
    }
  }

  async function updateCanonProperty(property: string, value: number): Promise<void> {
    const data = await cameraRequest('/set_property', 'POST', { property, value })
    if (data.status === 'error') {
      setMessage({ type: 'error', text: data.detail || `${property} gagal diubah.` })
    } else {
      setMessage({ type: 'success', text: `${property} berhasil diubah.` })
    }
  }

  async function setExposure(
    property: 'iso' | 'aperture' | 'shutter',
    value: number
  ): Promise<void> {
    if (property === 'iso') setIso(value)
    if (property === 'aperture') setAperture(value)
    if (property === 'shutter') setShutter(value)
    await updateCanonProperty(property, value)
  }

  async function toggleMirror(enabled: boolean): Promise<void> {
    setMirror(enabled)
    const data = await cameraRequest('/toggle_mirror', 'POST', { mirror: enabled })
    if (data.status === 'error') {
      setMessage({ type: 'error', text: data.detail || 'Mirror gagal diubah.' })
    }
  }

  async function captureTestPhoto(): Promise<void> {
    setBusy(true)
    setMessage(null)
    try {
      if (isCanon) {
        // Arahkan cameraAPI menyimpan hasil test ke folder test terpisah.
        const appSettings = await getAppSettings()
        const { directory } = await window.session.prepareDirectory(
          appSettings.storageDirectory,
          'test'
        )
        await window.electron.camera.setSaveDir(directory)

        const capture = await window.electron.camera.captureCanon()
        if (!capture.filePath) throw new Error('File hasil capture Canon tidak ditemukan.')
        setTestPhoto(capture.dataUrl)
        setMessage({
          type: 'success',
          text: `Test photo Canon berhasil disimpan di: ${directory}`
        })
      } else {
        const video = videoRef.current
        if (!video || video.videoWidth === 0) throw new Error('Preview webcam belum siap.')
        const canvas = document.createElement('canvas')
        const portrait = orientation === 'portrait'
        canvas.width = portrait ? video.videoHeight : video.videoWidth
        canvas.height = portrait ? video.videoWidth : video.videoHeight
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Canvas foto tidak tersedia.')
        context.translate(canvas.width / 2, canvas.height / 2)
        if (portrait) context.rotate(Math.PI / 2)
        context.scale(mirror ? -1 : 1, 1)
        context.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

        // Simpan hasil test webcam ke folder test yang sama.
        const appSettings = await getAppSettings()
        const { directory } = await window.session.prepareDirectory(
          appSettings.storageDirectory,
          'test'
        )
        await window.session.saveWebcamShots(
          [dataUrl],
          undefined,
          undefined,
          undefined,
          directory,
          {
            exactDirectory: true
          }
        )
        setTestPhoto(dataUrl)
        setMessage({
          type: 'success',
          text: `Test photo webcam berhasil disimpan di: ${directory}`
        })
      }
    } catch (cause) {
      setMessage({
        type: 'error',
        text: cause instanceof Error ? cause.message : 'Test photo gagal.'
      })
    } finally {
      setBusy(false)
    }
  }

  const canonControlsDisabled = !isCanon || !serviceReady || options.iso.length === 0

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 bg-[var(--background)] p-5 text-[var(--foreground)] md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--danger)]">
            Device check
          </p>
          <h1 className="text-3xl font-black md:text-4xl">Test Kamera</h1>
        </div>
        <NeoButton variant="outlined" onClick={onBack}>
          Kembali
        </NeoButton>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-[320px] items-center justify-center overflow-hidden border-4 border-[var(--border)] bg-[#181818] shadow-[var(--shadow-neo)]">
          <div
            className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
              orientation === 'portrait' ? 'mx-auto max-w-[58vh]' : ''
            }`}
          >
            {testPhoto ? (
              <img
                src={testPhoto}
                alt="Hasil test photo"
                className="h-full w-full object-contain"
              />
            ) : isCanon ? (
              <img
                src={`${CAMERA_API_URL}/video_feed`}
                alt="Live preview Canon"
                className={`h-full w-full object-contain ${mirror ? 'scale-x-[-1]' : ''}`}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-contain ${mirror ? 'scale-x-[-1]' : ''}`}
              />
            )}
            {!testPhoto && !isCanon && webcamStatus !== 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center p-5 text-center font-bold text-white">
                {webcamError || 'Menghubungkan kamera...'}
              </div>
            )}
          </div>
        </section>

        <aside className="min-h-0 space-y-5 overflow-y-auto border-4 border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-neo)]">
          <div className="space-y-2">
            <label className="text-sm font-black">Kamera</label>
            <select
              value={source}
              onChange={(event) => void selectSource(event.target.value as CameraSource)}
              className="h-12 w-full border-4 border-[var(--border)] bg-[var(--background)] px-3 font-bold outline-none"
            >
              {cameraOptions.map((camera) => (
                <option key={camera.value} value={camera.value}>
                  {camera.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-black">Orientasi</label>
            <select
              value={orientation}
              onChange={(event) => setOrientation(event.target.value as Orientation)}
              className="h-12 w-full border-4 border-[var(--border)] bg-[var(--background)] px-3 font-bold outline-none"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-black">Mirror</span>
            <button
              type="button"
              role="switch"
              aria-checked={mirror}
              onClick={() => void toggleMirror(!mirror)}
              className={`relative h-8 w-16 border-4 border-[var(--border)] ${mirror ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'}`}
            >
              <span
                className={`absolute top-0 h-6 w-6 bg-[var(--foreground)] ${mirror ? 'right-0' : 'left-0'}`}
              />
            </button>
          </div>

          <ExposureControl
            label="ISO"
            options={options.iso}
            value={iso}
            disabled={canonControlsDisabled}
            onChange={(value) => void setExposure('iso', value)}
          />
          <ExposureControl
            label="Aperture"
            options={options.aperture}
            value={aperture}
            disabled={canonControlsDisabled}
            onChange={(value) => void setExposure('aperture', value)}
          />
          <ExposureControl
            label="Shutter Speed"
            options={options.shutter}
            value={shutter}
            disabled={canonControlsDisabled}
            onChange={(value) => void setExposure('shutter', value)}
          />

          {message && <Alert type={message.type}>{message.text}</Alert>}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <NeoButton
              variant="outlined"
              onClick={() => {
                setTestPhoto(null)
                if (isCanon) void loadCanonOptions()
                else retryWebcam()
              }}
            >
              Muat Ulang
            </NeoButton>
            <NeoButton disabled={busy} onClick={() => void captureTestPhoto()}>
              {busy ? 'Mengambil...' : 'Test Photo'}
            </NeoButton>
            <NeoButton
              className="col-span-2"
              disabled={saving || (!isCanon && !selectedWebcamId)}
              onClick={() => void saveSettings()}
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan Kamera'}
            </NeoButton>
          </div>
          {selectedWebcamId && (
            <p className="break-all text-xs font-semibold text-[var(--muted-foreground)]">
              Webcam aktif:{' '}
              {webcamDevices.find((device) => device.deviceId === selectedWebcamId)?.label}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
