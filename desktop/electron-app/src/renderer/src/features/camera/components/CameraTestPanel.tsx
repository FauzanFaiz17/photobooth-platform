import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { JSX } from 'react'
import Alert from '@/components/ui/Alert'
import { NeoButton } from '@/components/shared/button'
import { useWebcam } from '@/features/camera/hooks/useWebcam'
import {
  getCameraSettings,
  getAppSettings,
  saveCameraSettings,
  type CameraExposureSettings
} from '@/features/settings/deviceSettings'
import { useSessionStore } from '@/store/sessionStore'
import { getApiErrorMessage } from '@/api/axios'
import axios from '@/api/axios'

const CAMERA_API_URL = 'http://127.0.0.1:5000'
const TEST_VIDEO_MS = 5000

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
  canon_connected?: boolean
  camera_name?: string
  live_view_active?: boolean
}

type CameraSource = 'canon' | `webcam:${string}`
type Orientation = 'portrait' | 'landscape'
type ProfileKey = 'video' | 'photo'

interface ExposureValues {
  iso: number | null
  aperture: number | null
  shutter: number | null
  whiteBalance: number | null
  pictureStyle: number | null
  exposure: number | null
  contrast: number | null
  saturation: number | null
}

type ExposureKey = keyof ExposureValues

const EMPTY_EXPOSURE_VALUES: ExposureValues = {
  iso: null,
  aperture: null,
  shutter: null,
  whiteBalance: null,
  pictureStyle: null,
  exposure: null,
  contrast: null,
  saturation: null
}

const EXPOSURE_TO_PROPERTY: Record<ExposureKey, string> = {
  iso: 'iso',
  aperture: 'aperture',
  shutter: 'shutter',
  whiteBalance: 'white_balance',
  pictureStyle: 'picture_style',
  exposure: 'exposure',
  contrast: 'contrast',
  saturation: 'saturation'
}

async function cameraRequest(
  endpoint: string,
  method = 'GET',
  body?: unknown
): Promise<CameraApiResponse> {
  if (window.api?.request) return window.api.request(endpoint, method, body)

  const response = await fetch(`${CAMERA_API_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12_000)
  })
  return response.json() as Promise<CameraApiResponse>
}

function findOptionByValue(
  options: CameraOption[],
  value: number | null
): CameraOption | undefined {
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

function ProfileControls({
  values,
  options,
  disabled,
  onChange
}: {
  values: ExposureValues
  options: CameraOptions
  disabled: boolean
  onChange: (key: ExposureKey, value: number) => void
}): JSX.Element {
  return (
    <>
      <ExposureControl
        label="ISO"
        options={options.iso}
        value={values.iso}
        disabled={disabled}
        onChange={(value) => onChange('iso', value)}
      />
      <ExposureControl
        label="Aperture"
        options={options.aperture}
        value={values.aperture}
        disabled={disabled}
        onChange={(value) => onChange('aperture', value)}
      />
      <ExposureControl
        label="Shutter Speed"
        options={options.shutter}
        value={values.shutter}
        disabled={disabled}
        onChange={(value) => onChange('shutter', value)}
      />
      <CameraDropdown
        label="White Balance"
        options={options.white_balance}
        value={values.whiteBalance}
        disabled={disabled}
        onChange={(value) => onChange('whiteBalance', value)}
      />
      <CameraDropdown
        label="Picture Style"
        options={options.picture_style}
        value={values.pictureStyle}
        disabled={disabled}
        onChange={(value) => onChange('pictureStyle', value)}
      />
      <ExposureControl
        label="Exposure"
        options={options.exposure}
        value={values.exposure}
        disabled={disabled}
        onChange={(value) => onChange('exposure', value)}
      />
      <ExposureControl
        label="Contrast"
        options={options.contrast}
        value={values.contrast}
        disabled={disabled}
        onChange={(value) => onChange('contrast', value)}
      />
      <ExposureControl
        label="Saturation"
        options={options.saturation}
        value={values.saturation}
        disabled={disabled}
        onChange={(value) => onChange('saturation', value)}
      />
    </>
  )
}

function ProfileBadge({ active }: { active: boolean }): JSX.Element {
  return (
    <span
      className={`border-2 border-[var(--border)] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
        active
          ? 'bg-[var(--primary)] text-[var(--background)]'
          : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
      }`}
    >
      {active ? 'Aktif' : 'Siaga'}
    </span>
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
    iso: [],
    aperture: [],
    shutter: [],
    white_balance: [],
    picture_style: [],
    exposure: [],
    contrast: [],
    saturation: []
  })
  const [videoExposure, setVideoExposure] = useState<ExposureValues>(EMPTY_EXPOSURE_VALUES)
  const [photoExposure, setPhotoExposure] = useState<ExposureValues>(EMPTY_EXPOSURE_VALUES)
  const [activeProfile, setActiveProfile] = useState<ProfileKey>('video')
  const [serviceReady, setServiceReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [recording, setRecording] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testPhoto, setTestPhoto] = useState<string | null>(null)
  const [testVideo, setTestVideo] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const serviceReadyRef = useRef(false)
  const optionsRequestInFlight = useRef(false)
  const healthCheckInFlight = useRef(false)
  const canonConnectedRef = useRef(false)
  const mjpegImgRef = useRef<HTMLImageElement | null>(null)
  const isCanon = source === 'canon'
  const selectedWebcamId = source.startsWith('webcam:') ? source.slice(7) : null
  const eventConfiguration = useSessionStore((state) => state.eventConfiguration)

  useEffect(() => {
    serviceReadyRef.current = serviceReady
  }, [serviceReady])

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

  const applyAllCanonSettings = useCallback(async (opts: CameraOptions, values: ExposureValues) => {
    const props: Array<[string, number | null, CameraOption[]]> = [
      ['iso', values.iso, opts.iso],
      ['aperture', values.aperture, opts.aperture],
      ['shutter', values.shutter, opts.shutter],
      ['white_balance', values.whiteBalance, opts.white_balance],
      ['picture_style', values.pictureStyle, opts.picture_style],
      ['exposure', values.exposure, opts.exposure],
      ['contrast', values.contrast, opts.contrast],
      ['saturation', values.saturation, opts.saturation]
    ]
    for (const [property, val, available] of props) {
      if (val !== null && available.some((o) => o.value === val)) {
        await cameraRequest('/set_property', 'POST', { property, value: val })
      }
    }
  }, [])

  async function loadCanonOptions(): Promise<void> {
    if (optionsRequestInFlight.current) return
    optionsRequestInFlight.current = true
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
      const stored = await getCameraSettings()

      function resolveExposure(
        optKey: keyof CameraOptions,
        cameraValue: unknown,
        storedValue: { value: number } | null
      ): number | null {
        return (
          findOptionByValue(nextOptions[optKey], storedValue?.value ?? null)?.value ??
          findOptionByValue(
            nextOptions[optKey],
            cameraValue !== null && cameraValue !== undefined ? Number(cameraValue) : null
          )?.value ??
          nextOptions[optKey][0]?.value ??
          null
        )
      }

      const nextVideo: ExposureValues = {
        iso: resolveExposure('iso', camera?.iso ?? null, stored.video.iso),
        aperture: resolveExposure('aperture', camera?.aperture ?? null, stored.video.aperture),
        shutter: resolveExposure('shutter', camera?.shutter_speed ?? null, stored.video.shutter),
        whiteBalance: resolveExposure(
          'white_balance',
          camera?.white_balance ?? null,
          stored.video.whiteBalance
        ),
        pictureStyle: resolveExposure(
          'picture_style',
          camera?.picture_style ?? null,
          stored.video.pictureStyle
        ),
        exposure: resolveExposure('exposure', camera?.exposure ?? null, stored.video.exposure),
        contrast: resolveExposure('contrast', camera?.contrast ?? null, stored.video.contrast),
        saturation: resolveExposure(
          'saturation',
          camera?.saturation ?? null,
          stored.video.saturation
        )
      }
      const nextPhoto: ExposureValues = {
        iso: resolveExposure('iso', camera?.iso ?? null, stored.photo.iso),
        aperture: resolveExposure('aperture', camera?.aperture ?? null, stored.photo.aperture),
        shutter: resolveExposure('shutter', camera?.shutter_speed ?? null, stored.photo.shutter),
        whiteBalance: resolveExposure(
          'white_balance',
          camera?.white_balance ?? null,
          stored.photo.whiteBalance
        ),
        pictureStyle: resolveExposure(
          'picture_style',
          camera?.picture_style ?? null,
          stored.photo.pictureStyle
        ),
        exposure: resolveExposure('exposure', camera?.exposure ?? null, stored.photo.exposure),
        contrast: resolveExposure('contrast', camera?.contrast ?? null, stored.photo.contrast),
        saturation: resolveExposure(
          'saturation',
          camera?.saturation ?? null,
          stored.photo.saturation
        )
      }

      setVideoExposure(nextVideo)
      setPhotoExposure(nextPhoto)
      setServiceReady(true)
      // Reload elemen preview MJPEG supaya stream tersambung lagi setelah
      // layanan sempat mati/hang dan di-restart watchdog.
      setPreviewKey((key) => key + 1)

      // Preview mengikuti profil video; profil foto baru diterapkan saat capture.
      await applyAllCanonSettings(nextOptions, nextVideo)
      setActiveProfile('video')

      if (nextOptions.iso.length === 0) {
        setMessage({
          type: 'error',
          text: 'Layanan EDSDK aktif, tetapi Canon belum terhubung. Nyalakan kamera dan gunakan mode foto.'
        })
      }
    } catch (cause) {
      setServiceReady(false)
      const raw = cause instanceof Error ? cause.message : ''
      const looksLikeTimeout = /timeout|abort|network|failed/i.test(raw)
      setMessage({
        type: 'error',
        text:
          looksLikeTimeout || !raw
            ? 'Layanan kamera tidak merespons. Aplikasi akan mencoba menyambungkan ulang otomatis...'
            : raw
      })
    } finally {
      optionsRequestInFlight.current = false
    }
  }

  // Pantau kesehatan camera service: deteksi hang/crash dan pulihkan otomatis
  // (watchdog di Electron me-restart service; di sini kita deteksi lalu reload).
  const loadCanonOptionsRef = useRef(loadCanonOptions)
  useEffect(() => {
    loadCanonOptionsRef.current = loadCanonOptions
  })

  useEffect(() => {
    if (!isCanon) return

    const timer = window.setInterval(() => {
      if (healthCheckInFlight.current) return
      healthCheckInFlight.current = true
      void cameraRequest('/health')
        .then((data) => {
          const healthy = data.status === 'running'
          const connected = data.canon_connected === true
          const wasConnected = canonConnectedRef.current
          canonConnectedRef.current = connected
          if (healthy && (!serviceReadyRef.current || (connected && !wasConnected))) {
            // Layanan baru pulih, atau Canon baru tersambung lagi
            // (mis. dinyalakan ulang setelah auto-poweroff) → muat ulang opsi.
            void loadCanonOptionsRef.current()
          } else if (!healthy && serviceReadyRef.current) {
            setServiceReady(false)
            canonConnectedRef.current = false
            setMessage({
              type: 'error',
              text: 'Layanan kamera terputus. Menyambungkan ulang otomatis...'
            })
          }
        })
        .catch(() => undefined)
        .finally(() => {
          healthCheckInFlight.current = false
        })
    }, 5000)
    return () => window.clearInterval(timer)
  }, [isCanon])

  function exposureFromStored(exposure: CameraExposureSettings): ExposureValues {
    return {
      iso: exposure.iso?.value ?? null,
      aperture: exposure.aperture?.value ?? null,
      shutter: exposure.shutter?.value ?? null,
      whiteBalance: exposure.whiteBalance?.value ?? null,
      pictureStyle: exposure.pictureStyle?.value ?? null,
      exposure: exposure.exposure?.value ?? null,
      contrast: exposure.contrast?.value ?? null,
      saturation: exposure.saturation?.value ?? null
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
        setVideoExposure(exposureFromStored(stored.video))
        setPhotoExposure(exposureFromStored(stored.photo))
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
      function toExposureOptions(values: ExposureValues): CameraExposureSettings {
        return {
          iso: findOptionByValue(options.iso, values.iso) ?? null,
          aperture: findOptionByValue(options.aperture, values.aperture) ?? null,
          shutter: findOptionByValue(options.shutter, values.shutter) ?? null,
          whiteBalance: findOptionByValue(options.white_balance, values.whiteBalance) ?? null,
          pictureStyle: findOptionByValue(options.picture_style, values.pictureStyle) ?? null,
          exposure: findOptionByValue(options.exposure, values.exposure) ?? null,
          contrast: findOptionByValue(options.contrast, values.contrast) ?? null,
          saturation: findOptionByValue(options.saturation, values.saturation) ?? null
        }
      }
      await saveCameraSettings({
        source: isCanon ? 'canon' : 'webcam',
        deviceId,
        deviceLabel: webcamDevices.find((device) => device.deviceId === deviceId)?.label ?? null,
        orientation,
        mirror,
        video: toExposureOptions(videoExposure),
        photo: toExposureOptions(photoExposure)
      })
      setMessage({
        type: 'success',
        text: 'Pengaturan kamera (profil video & foto) berhasil disimpan.'
      })
    } catch (cause) {
      setMessage({
        type: 'error',
        text: cause instanceof Error ? cause.message : 'Pengaturan kamera gagal disimpan.'
      })
    } finally {
      setSaving(false)
    }
  }

  // Backend hanya menyimpan satu set eksposur; kirim profil foto sebagai
  // representasi capture (Opsi A: dua profil sepenuhnya di desktop).
  async function syncCameraToBackend(values: ExposureValues): Promise<void> {
    const cameraProfileId = eventConfiguration?.camera?.camera_profile_id
    if (!cameraProfileId) return
    try {
      await axios.put(`/v1/camera-profiles/${cameraProfileId}`, {
        partner_id: eventConfiguration?.event?.partner?.id ?? null,
        name: `Profile #${cameraProfileId}`,
        iso: values.iso !== null ? String(values.iso) : null,
        shutter_speed: values.shutter !== null ? String(values.shutter) : null,
        aperture: values.aperture !== null ? String(values.aperture) : null,
        white_balance: values.whiteBalance !== null ? String(values.whiteBalance) : null,
        picture_style: values.pictureStyle !== null ? String(values.pictureStyle) : null,
        contrast: values.contrast !== null ? String(values.contrast) : null,
        saturation: values.saturation !== null ? String(values.saturation) : null,
        exposure: values.exposure !== null ? String(values.exposure) : null,
        countdown_seconds: eventConfiguration?.camera?.countdown_seconds ?? 3,
        burst_count: eventConfiguration?.camera?.burst_count ?? 1,
        live_view: eventConfiguration?.camera?.live_view ?? true,
        is_active: true
      })
    } catch (cause) {
      console.error('Gagal sync kamera ke backend:', getApiErrorMessage(cause, 'Unknown'))
    }
  }

  async function selectSource(nextSource: CameraSource): Promise<void> {
    setSource(nextSource)
    setTestPhoto(null)
    setTestVideo(null)
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
    }
  }

  function updateExposure(profile: ProfileKey, key: ExposureKey, value: number): void {
    const next =
      profile === 'video' ? { ...videoExposure, [key]: value } : { ...photoExposure, [key]: value }
    if (profile === 'video') setVideoExposure(next)
    else setPhotoExposure(next)
    setActiveProfile(profile)
    void updateCanonProperty(EXPOSURE_TO_PROPERTY[key], value)
    if (profile === 'photo') void syncCameraToBackend(next)
  }

  async function applyProfileToCamera(profile: ProfileKey): Promise<void> {
    const values = profile === 'video' ? videoExposure : photoExposure
    setActiveProfile(profile)
    await applyAllCanonSettings(options, values)
    setMessage({
      type: 'success',
      text: `Profil ${profile === 'video' ? 'Video' : 'Foto'} diterapkan ke kamera.`
    })
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
        // Pastikan eksposur foto (lighting menyala) yang aktif saat shutter.
        await applyAllCanonSettings(options, photoExposure)
        setActiveProfile('photo')

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

  async function captureTestVideo(): Promise<void> {
    if (recording || busy) return
    setRecording(true)
    setMessage(null)
    setTestVideo(null)
    let stopDraw: (() => void) | null = null
    try {
      if (typeof MediaRecorder === 'undefined')
        throw new Error('MediaRecorder tidak didukung di perangkat ini.')

      if (isCanon) {
        // Rekam dengan eksposur profil video (tanpa lighting).
        await applyAllCanonSettings(options, videoExposure)
        setActiveProfile('video')
      }

      let stream: MediaStream | null = null
      if (isCanon) {
        const img = mjpegImgRef.current
        if (!img || img.naturalWidth === 0) throw new Error('Preview Canon belum siap.')
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas video tidak tersedia.')
        let drawing = true
        let rafId = 0
        const drawFrame = (): void => {
          if (!drawing) return
          try {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          } catch {
            // frame mungkin belum siap
          }
          rafId = requestAnimationFrame(drawFrame)
        }
        drawFrame()
        stopDraw = (): void => {
          drawing = false
          cancelAnimationFrame(rafId)
        }
        stream = canvas.captureStream(30) as unknown as MediaStream
      } else {
        const video = videoRef.current
        stream = (video?.srcObject as MediaStream | null) ?? null
        if (!stream) throw new Error('Preview webcam belum siap.')
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'
      const chunks: Blob[] = []
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 })
      recorder.ondataavailable = (event): void => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      const stopped = new Promise<void>((resolve) => {
        recorder.onstop = (): void => resolve()
      })
      recorder.start()
      setMessage({ type: 'success', text: `Merekam test video ${TEST_VIDEO_MS / 1000} detik...` })
      await new Promise((resolve) => setTimeout(resolve, TEST_VIDEO_MS))
      recorder.stop()
      await stopped

      if (chunks.length === 0) throw new Error('Rekaman video kosong.')
      const blob = new Blob(chunks, { type: 'video/webm' })
      const videoDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = (): void => {
          if (typeof reader.result === 'string') resolve(reader.result)
          else reject(new Error('Hasil rekaman video tidak terbaca.'))
        }
        reader.onerror = (): void => reject(new Error('Hasil rekaman video tidak terbaca.'))
        reader.readAsDataURL(blob)
      })

      setTestVideo(videoDataUrl)

      const appSettings = await getAppSettings()
      const { directory } = await window.session.prepareDirectory(
        appSettings.storageDirectory,
        'test'
      )
      await window.session.saveWebcamShots([], undefined, undefined, videoDataUrl, directory, {
        exactDirectory: true
      })
      setMessage({
        type: 'success',
        text: `Test video ${TEST_VIDEO_MS / 1000} detik berhasil disimpan di: ${directory}`
      })
    } catch (cause) {
      setMessage({
        type: 'error',
        text: cause instanceof Error ? cause.message : 'Test video gagal.'
      })
    } finally {
      stopDraw?.()
      setRecording(false)
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

      <div className="flex flex-wrap items-end gap-4 border-4 border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-neo)]">
        <div className="min-w-[200px] flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-black">Kamera</label>
            <button
              type="button"
              className="text-xs font-black underline"
              onClick={() => void refreshDevices()}
            >
              Refresh
            </button>
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

        <div className="w-44 space-y-2">
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

        <div className="flex items-center gap-3">
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
          className="border-[var(--border)] bg-[var(--surface)] text-sm font-black disabled:opacity-40"
        >
          Auto Focus
        </NeoButton>
      </div>

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
        <aside className="min-h-0 space-y-5 overflow-y-auto border-4 border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-neo)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">Profil Video</h2>
              <p className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                Dipakai saat countdown & rekaman video
              </p>
            </div>
            <ProfileBadge active={activeProfile === 'video'} />
          </div>

          <ProfileControls
            values={videoExposure}
            options={options}
            disabled={canonControlsDisabled}
            onChange={(key, value) => updateExposure('video', key, value)}
          />

          <NeoButton
            variant="outlined"
            disabled={canonControlsDisabled || recording}
            onClick={() => void applyProfileToCamera('video')}
            className="w-full border-[var(--border)] bg-[var(--surface)] text-sm font-black disabled:opacity-40"
          >
            Terapkan Profil Video
          </NeoButton>

          {message && <Alert type={message.type}>{message.text}</Alert>}
        </aside>

        <section className="relative flex min-h-[320px] items-center justify-center overflow-hidden border-4 border-[var(--border)] bg-[#181818] shadow-[var(--shadow-neo)]">
          <div
            className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
              orientation === 'portrait' ? 'mx-auto max-w-[58vh]' : ''
            }`}
          >
            {isCanon ? (
              <img
                key={previewKey}
                ref={mjpegImgRef}
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
            {isCanon && !serviceReady && (
              <div className="absolute inset-0 flex items-center justify-center p-5 text-center font-bold text-white">
                Menghubungkan kamera Canon...
              </div>
            )}
            {!isCanon && webcamStatus !== 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center p-5 text-center font-bold text-white">
                {webcamError || 'Menghubungkan kamera...'}
              </div>
            )}
            {recording && (
              <div className="absolute left-3 top-3 flex items-center gap-2 border-2 border-white bg-black/70 px-2 py-1 text-xs font-black uppercase tracking-widest text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                REC {TEST_VIDEO_MS / 1000}s
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
          {testVideo && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center p-3">
              <div className="relative overflow-hidden border-4 border-[var(--primary)] bg-black shadow-lg">
                <video src={testVideo} controls autoPlay loop muted className="max-h-[180px]" />
                <button
                  type="button"
                  onClick={() => setTestVideo(null)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/70 text-xs font-bold text-white"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="min-h-0 space-y-5 overflow-y-auto border-4 border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-neo)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black">Profil Foto</h2>
              <p className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                Dipakai saat shutter membuka (lighting nyala)
              </p>
            </div>
            <ProfileBadge active={activeProfile === 'photo'} />
          </div>

          <ProfileControls
            values={photoExposure}
            options={options}
            disabled={canonControlsDisabled}
            onChange={(key, value) => updateExposure('photo', key, value)}
          />

          <NeoButton
            variant="outlined"
            disabled={canonControlsDisabled || recording}
            onClick={() => void applyProfileToCamera('photo')}
            className="w-full border-[var(--border)] bg-[var(--surface)] text-sm font-black disabled:opacity-40"
          >
            Terapkan Profil Foto
          </NeoButton>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <NeoButton
              variant="outlined"
              disabled={recording}
              onClick={() => {
                setTestPhoto(null)
                setTestVideo(null)
                if (isCanon) void loadCanonOptions()
                else retryWebcam()
              }}
            >
              Muat Ulang
            </NeoButton>
            <NeoButton disabled={busy || recording} onClick={() => void captureTestPhoto()}>
              {busy ? 'Mengambil...' : 'Test Photo'}
            </NeoButton>
            <NeoButton
              className="col-span-2"
              variant="outlined"
              disabled={recording || busy}
              onClick={() => void captureTestVideo()}
            >
              {recording ? 'Merekam...' : 'Test Video (5 detik)'}
            </NeoButton>
            <NeoButton
              className="col-span-2"
              disabled={saving || recording || (!isCanon && !selectedWebcamId)}
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
