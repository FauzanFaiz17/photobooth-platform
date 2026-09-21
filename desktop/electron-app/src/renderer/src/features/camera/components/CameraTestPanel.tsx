import { useCallback, useEffect, useMemo, useState } from 'react'
import type { JSX } from 'react'
import Alert from '@/components/ui/Alert'
import { NeoButton } from '@/components/shared/button'
import { useWebcam } from '@/features/camera/hooks/useWebcam'
import {
  getCameraSettings,
  getAppSettings,
  saveCameraSettings
} from '@/features/settings/deviceSettings'
import { useSessionStore } from '@/store/sessionStore'
import { getApiErrorMessage } from '@/api/axios'
import axios from '@/api/axios'

const CAMERA_API_URL = 'http://127.0.0.1:5000'

interface CameraOption {
  name: string
  value: number
}

interface CameraOptions {
  iso: CameraOption[]
  aperture: CameraOption[]
  shutter: CameraOption[]
  white_balance: CameraOption[]
  picture_style: CameraOption[]
  exposure: CameraOption[]
  contrast: CameraOption[]
  saturation: CameraOption[]
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

function findOptionByValue(options: CameraOption[], value: number | null): CameraOption | undefined {
  return options.find((option) => option.value === value)
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

function CameraDropdown({
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
  return (
    <div className="space-y-2">
      <label className="text-sm font-black">{label}</label>
      <select
        value={value ?? ''}
        disabled={disabled || options.length === 0}
        onChange={(event) => {
          const selected = Number(event.target.value)
          if (!Number.isNaN(selected)) onChange(selected)
        }}
        className="h-10 w-full border-4 border-[var(--border)] bg-[var(--background)] px-2 text-sm font-bold outline-none disabled:opacity-40"
      >
        {options.length === 0 && <option value="">--</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default function CameraTestPanel({ onBack }: { onBack: () => void }): JSX.Element {
  const [source, setSource] = useState<CameraSource>('canon')
  const isWebcamSource = source.startsWith('webcam:')
  const {
    videoRef,
    status: webcamStatus,
    error: webcamError,
    devices: webcamDevices,
    activeDeviceId,
    selectDevice,
    retry: retryWebcam,
    refreshDevices
  } = useWebcam({ enabled: isWebcamSource })
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [mirror, setMirror] = useState(false)
  const [options, setOptions] = useState<CameraOptions>({
    iso: [], aperture: [], shutter: [], white_balance: [], picture_style: [], exposure: [], contrast: [], saturation: []
  })
  const [iso, setIso] = useState<number | null>(null)
  const [aperture, setAperture] = useState<number | null>(null)
  const [shutter, setShutter] = useState<number | null>(null)
  const [whiteBalance, setWhiteBalance] = useState<number | null>(null)
  const [pictureStyle, setPictureStyle] = useState<number | null>(null)
  const [exposure, setExposureValue] = useState<number | null>(null)
  const [contrast, setContrast] = useState<number | null>(null)
  const [saturation, setSaturation] = useState<number | null>(null)
  const [serviceReady, setServiceReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testPhoto, setTestPhoto] = useState<string | null>(null)
  const isCanon = source === 'canon'
  const selectedWebcamId = source.startsWith('webcam:') ? source.slice(7) : null
  const eventConfiguration = useSessionStore((state) => state.eventConfiguration)

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

  const applyAllCanonSettings = useCallback(async (opts: CameraOptions, values: { iso: number | null; aperture: number | null; shutter: number | null; whiteBalance: number | null; pictureStyle: number | null; exposure: number | null; contrast: number | null; saturation: number | null }) => {
    const props: Array<[string, number | null, CameraOption[]]> = [
      ['iso', values.iso, opts.iso],
      ['aperture', values.aperture, opts.aperture],
      ['shutter', values.shutter, opts.shutter],
      ['white_balance', values.whiteBalance, opts.white_balance],
      ['picture_style', values.pictureStyle, opts.picture_style],
      ['exposure', values.exposure, opts.exposure],
      ['contrast', values.contrast, opts.contrast],
      ['saturation', values.saturation, opts.saturation],
    ]
    for (const [property, val, available] of props) {
      if (val !== null && available.some((o) => o.value === val)) {
        await cameraRequest('/set_property', 'POST', { property, value: val })
      }
    }
  }, [])

  async function loadCanonOptions(): Promise<void> {
    setMessage(null)
    try {
      const data = await cameraRequest('/options')
      if (data.status !== 'success') throw new Error(data.detail || 'Layanan kamera tidak siap.')

      const nextOptions: CameraOptions = {
        iso: data.options?.iso ?? [],
        aperture: data.options?.aperture ?? [],
        shutter: data.options?.shutter ?? [],
        white_balance: data.options?.white_balance ?? [],
        picture_style: data.options?.picture_style ?? [],
        exposure: data.options?.exposure ?? [],
        contrast: data.options?.contrast ?? [],
        saturation: data.options?.saturation ?? []
      }
      setOptions(nextOptions)

      const camera = eventConfiguration?.camera
      let nextIso = nextOptions.iso[0]?.value ?? null
      let nextAperture = nextOptions.aperture[0]?.value ?? null
      let nextShutter = nextOptions.shutter[0]?.value ?? null
      let nextWb = nextOptions.white_balance[0]?.value ?? null
      let nextPs = nextOptions.picture_style[0]?.value ?? null
      let nextExposure = nextOptions.exposure[0]?.value ?? null
      let nextContrast = nextOptions.contrast[0]?.value ?? null
      let nextSaturation = nextOptions.saturation[0]?.value ?? null

      if (camera) {
        const stored = await getCameraSettings()
        nextIso = findOptionByValue(nextOptions.iso, stored.iso?.value)?.value
          ?? findOptionByValue(nextOptions.iso, camera.iso !== null ? Number(camera.iso) : null)?.value
          ?? nextOptions.iso[0]?.value
          ?? null
        nextAperture = findOptionByValue(nextOptions.aperture, stored.aperture?.value)?.value
          ?? findOptionByValue(nextOptions.aperture, camera.aperture !== null ? Number(camera.aperture) : null)?.value
          ?? nextOptions.aperture[0]?.value
          ?? null
        nextShutter = findOptionByValue(nextOptions.shutter, stored.shutter?.value)?.value
          ?? findOptionByValue(nextOptions.shutter, camera.shutter_speed !== null ? Number(camera.shutter_speed) : null)?.value
          ?? nextOptions.shutter[0]?.value
          ?? null
        nextWb = findOptionByValue(nextOptions.white_balance, stored.whiteBalance?.value)?.value
          ?? findOptionByValue(nextOptions.white_balance, camera.white_balance !== null ? Number(camera.white_balance) : null)?.value
          ?? nextOptions.white_balance[0]?.value
          ?? null
        nextPs = findOptionByValue(nextOptions.picture_style, stored.pictureStyle?.value)?.value
          ?? findOptionByValue(nextOptions.picture_style, camera.picture_style !== null ? Number(camera.picture_style) : null)?.value
          ?? nextOptions.picture_style[0]?.value
          ?? null
        nextExposure = findOptionByValue(nextOptions.exposure, stored.exposure?.value)?.value
          ?? findOptionByValue(nextOptions.exposure, camera.exposure !== null ? Number(camera.exposure) : null)?.value
          ?? nextOptions.exposure[0]?.value
          ?? null
        nextContrast = findOptionByValue(nextOptions.contrast, stored.contrast?.value)?.value
          ?? findOptionByValue(nextOptions.contrast, camera.contrast !== null ? Number(camera.contrast) : null)?.value
          ?? nextOptions.contrast[0]?.value
          ?? null
        nextSaturation = findOptionByValue(nextOptions.saturation, stored.saturation?.value)?.value
          ?? findOptionByValue(nextOptions.saturation, camera.saturation !== null ? Number(camera.saturation) : null)?.value
          ?? nextOptions.saturation[0]?.value
          ?? null
      }

      setIso(nextIso)
      setAperture(nextAperture)
      setShutter(nextShutter)
      setWhiteBalance(nextWb)
      setPictureStyle(nextPs)
      setExposureValue(nextExposure)
      setContrast(nextContrast)
      setSaturation(nextSaturation)
      setServiceReady(true)

      await applyAllCanonSettings(nextOptions, {
        iso: nextIso, aperture: nextAperture, shutter: nextShutter,
        whiteBalance: nextWb, pictureStyle: nextPs, exposure: nextExposure,
        contrast: nextContrast, saturation: nextSaturation
      })

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
        setWhiteBalance(stored.whiteBalance?.value ?? null)
        setPictureStyle(stored.pictureStyle?.value ?? null)
        setExposureValue(stored.exposure?.value ?? null)
        setContrast(stored.contrast?.value ?? null)
        setSaturation(stored.saturation?.value ?? null)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (source !== 'webcam:' || !webcamDevices[0]) return
    void selectSource(`webcam:${webcamDevices[0].deviceId}`)
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
        iso: findOptionByValue(options.iso, iso) ?? null,
        aperture: findOptionByValue(options.aperture, aperture) ?? null,
        shutter: findOptionByValue(options.shutter, shutter) ?? null,
        whiteBalance: findOptionByValue(options.white_balance, whiteBalance) ?? null,
        pictureStyle: findOptionByValue(options.picture_style, pictureStyle) ?? null,
        exposure: findOptionByValue(options.exposure, exposure) ?? null,
        contrast: findOptionByValue(options.contrast, contrast) ?? null,
        saturation: findOptionByValue(options.saturation, saturation) ?? null
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

  async function syncCameraToBackend(): Promise<void> {
    const cameraProfileId = eventConfiguration?.camera?.camera_profile_id
    if (!cameraProfileId) return
    try {
      await axios.put(`/v1/camera-profiles/${cameraProfileId}`, {
        partner_id: eventConfiguration?.event?.partner?.id ?? null,
        name: `Profile #${cameraProfileId}`,
        iso: iso !== null ? String(iso) : null,
        shutter_speed: shutter !== null ? String(shutter) : null,
        aperture: aperture !== null ? String(aperture) : null,
        white_balance: whiteBalance !== null ? String(whiteBalance) : null,
        picture_style: pictureStyle !== null ? String(pictureStyle) : null,
        contrast: contrast !== null ? String(contrast) : null,
        saturation: saturation !== null ? String(saturation) : null,
        exposure: exposure !== null ? String(exposure) : null,
        countdown_seconds: eventConfiguration?.camera?.countdown_seconds ?? 3,
        burst_count: eventConfiguration?.camera?.burst_count ?? 1,
        live_view: eventConfiguration?.camera?.live_view ?? true,
        is_active: true,
      })
    } catch (cause) {
      console.error('Gagal sync kamera ke backend:', getApiErrorMessage(cause, 'Unknown'))
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

  async function setExposure(property: 'iso' | 'aperture' | 'shutter', value: number): Promise<void> {
    if (property === 'iso') setIso(value)
    if (property === 'aperture') setAperture(value)
    if (property === 'shutter') setShutter(value)
    await updateCanonProperty(property, value)
    void syncCameraToBackend()
  }

  async function setDropdownSetting(
    setter: (v: number | null) => void,
    property: string,
    value: number
  ): Promise<void> {
    setter(value)
    await updateCanonProperty(property, value)
    void syncCameraToBackend()
  }

  async function handleAutoFocus(): Promise<void> {
    const data = await cameraRequest('/auto_focus', 'POST')
    if (data.status === 'error') {
      setMessage({ type: 'error', text: data.detail || 'Auto focus gagal.' })
    } else {
      setMessage({ type: 'success', text: 'Auto focus berhasil.' })
    }
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
          { exactDirectory: true }
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
        <section className="relative flex min-h-[320px] items-center justify-center overflow-hidden border-4 border-[var(--border)] bg-[#181818] shadow-[var(--shadow-neo)]">
          <div
            className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
              orientation === 'portrait' ? 'mx-auto max-w-[58vh]' : ''
            }`}
          >
            {isCanon ? (
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
            {!isCanon && webcamStatus !== 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center p-5 text-center font-bold text-white">
                {webcamError || 'Menghubungkan kamera...'}
              </div>
            )}
          </div>
          {testPhoto && (
            <div className="absolute inset-x-0 top-0 flex justify-center p-3">
              <div className="relative max-h-[40%] overflow-hidden border-4 border-[var(--primary)] bg-black shadow-lg">
                <img
                  src={testPhoto}
                  alt="Hasil test photo"
                  className="max-h-[200px] object-contain"
                />
                <button
                  type="button"
                  onClick={() => setTestPhoto(null)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/70 text-xs font-bold text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="min-h-0 space-y-5 overflow-y-auto border-4 border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-neo)]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-black">Kamera</label>
              <button type="button" className="text-xs font-black underline" onClick={() => void refreshDevices()}>Refresh</button>
            </div>
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

          <NeoButton
            variant="outlined"
            disabled={!isCanon || !serviceReady || options.iso.length === 0}
            onClick={() => void handleAutoFocus()}
            className="w-full border-[var(--border)] bg-[var(--surface)] text-sm font-black disabled:opacity-40"
          >
            Auto Focus
          </NeoButton>

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
          <CameraDropdown
            label="White Balance"
            options={options.white_balance}
            value={whiteBalance}
            disabled={canonControlsDisabled}
            onChange={(value) => void setDropdownSetting(setWhiteBalance, 'white_balance', value)}
          />
          <CameraDropdown
            label="Picture Style"
            options={options.picture_style}
            value={pictureStyle}
            disabled={canonControlsDisabled}
            onChange={(value) => void setDropdownSetting(setPictureStyle, 'picture_style', value)}
          />
          <ExposureControl
            label="Exposure"
            options={options.exposure}
            value={exposure}
            disabled={canonControlsDisabled}
            onChange={(value) => void setDropdownSetting(setExposureValue, 'exposure', value)}
          />
          <ExposureControl
            label="Contrast"
            options={options.contrast}
            value={contrast}
            disabled={canonControlsDisabled}
            onChange={(value) => void setDropdownSetting(setContrast, 'contrast', value)}
          />
          <ExposureControl
            label="Saturation"
            options={options.saturation}
            value={saturation}
            disabled={canonControlsDisabled}
            onChange={(value) => void setDropdownSetting(setSaturation, 'saturation', value)}
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
