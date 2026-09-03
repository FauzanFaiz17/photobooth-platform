import type { CapturedShot } from '@/store/sessionStore'

import { getCanvasSize, getFrames, loadTemplateOverlayDataUrl } from './composeTemplate'

interface CanvasSize {
  width: number
  height: number
}

interface TemplateFrame {
  x: number
  y: number
  width: number
  height: number
}

interface ComposeTemplateVideoOptions {
  shots: CapturedShot[]
  jsonLayout: Record<string, unknown>
  layout: 'strip' | 'grid'
  overlayPath: string | null
  cssFilter?: string
  shotDurationSeconds?: number
  mirror?: boolean
}

export interface ComposedVideo {
  dataUrl: string
  width: number
  height: number
  durationSeconds: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function loadVideo(source: string): Promise<HTMLVideoElement | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    const timeout = window.setTimeout(() => resolve(null), 15_000)

    const finish = (): void => {
      window.clearTimeout(timeout)
      resolve(video)
    }

    video.onerror = (): void => {
      window.clearTimeout(timeout)
      resolve(null)
    }

    video.onloadedmetadata = (): void => {
      // WebM hasil MediaRecorder tidak menyimpan metadata durasi, sehingga
      // `video.duration` bernilai Infinity. Trik standar: seek ke waktu yang
      // sangat besar agar browser menghitung durasi sebenarnya, lalu kembali
      // ke frame awal.
      if (!Number.isFinite(video.duration) || video.duration <= 0) {
        video.ontimeupdate = (): void => {
          video.ontimeupdate = null
          video.onseeked = (): void => {
            video.onseeked = null
            finish()
          }
          video.currentTime = 0
        }
        // Sebagian WebM hasil MediaRecorder tidak memiliki duration metadata.
        // Jangan seek ke Infinity karena Chromium dapat memicu error dan
        // membuat video dianggap gagal dimuat.
        video.currentTime = 0
        finish()
        return
      }
      finish()
    }

    video.onloadeddata = (): void => {
      if (video.readyState >= 2) finish()
    }

    video.src = source
  })
}

function loadOverlayImage(path: string): Promise<HTMLImageElement | null> {
  if (!path) return Promise.resolve(null)
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = (): void => resolve(image)
    image.onerror = (): void => resolve(null)
    void loadTemplateOverlayDataUrl(path)
      .then((dataUrl) => {
        image.src = dataUrl
      })
      .catch(() => resolve(null))
  })
}

function drawVideoCover(
  context: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  frame: TemplateFrame,
  cssFilter: string,
  mirror: boolean
): void {
  const videoWidth = video.videoWidth || 1
  const videoHeight = video.videoHeight || 1
  const scale = Math.max(frame.width / videoWidth, frame.height / videoHeight)
  const sourceWidth = frame.width / scale
  const sourceHeight = frame.height / scale
  const sourceX = (videoWidth - sourceWidth) / 2
  const sourceY = (videoHeight - sourceHeight) / 2

  context.save()
  context.filter = cssFilter
  context.beginPath()
  context.rect(frame.x, frame.y, frame.width, frame.height)
  context.clip()
  if (mirror) {
    context.translate(frame.x * 2 + frame.width, 0)
    context.scale(-1, 1)
  }
  context.drawImage(
    video,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    frame.x,
    frame.y,
    frame.width,
    frame.height
  )
  context.restore()
}

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ]

  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate
  }

  return 'video/webm'
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = (): void => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Video template tidak dapat dibaca.'))
    }
    reader.onerror = (): void => reject(new Error('Video template tidak dapat dibaca.'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Menyusun video template: setiap slot frame template memutar rekaman video
 * pendek milik shot masing-masing secara bersamaan (tanpa audio).
 * Durasi hasil mengikuti video shot terpanjang.
 */
export async function composeTemplateVideo({
  shots,
  jsonLayout,
  layout,
  overlayPath,
  cssFilter = 'none'
  ,mirror = shots[0]?.mirror ?? false
  ,shotDurationSeconds
}: ComposeTemplateVideoOptions): Promise<ComposedVideo | null> {
  const clips = shots
    .map((shot, index) => ({ shot, index }))
    .filter((entry) => Boolean(entry.shot.videoDataUrl))

  if (clips.length === 0 || typeof MediaRecorder === 'undefined') return null

  const loaded = await Promise.all(
    clips.map(async (entry) => ({
      ...entry,
      video: entry.shot.videoDataUrl ? await loadVideo(entry.shot.videoDataUrl) : null
    }))
  )

  const playable = loaded.filter((entry) => entry.video !== null) as Array<{
    shot: CapturedShot
    index: number
    video: HTMLVideoElement
  }>

  if (playable.length === 0) return null

  const canvasSize = getCanvasSize(jsonLayout)
  const frames = getFrames(jsonLayout, shots.length, canvasSize as CanvasSize, layout)

  const canvas = document.createElement('canvas')
  canvas.width = canvasSize.width
  canvas.height = canvasSize.height

  const context = canvas.getContext('2d')
  if (!context) return null

  const canvasConfiguration = isRecord(jsonLayout.canvas) ? jsonLayout.canvas : null
  const background =
    (canvasConfiguration && typeof canvasConfiguration.background === 'string'
      ? canvasConfiguration.background
      : null) ?? (typeof jsonLayout.background === 'string' ? jsonLayout.background : '#ffffff')

  const overlayImage = await loadOverlayImage(overlayPath ?? '')

  // Putar semua klip secara bersamaan (bisu), lalu hentikan rekaman canvas
  // setelah klip terpanjang selesai.
  const rawDurations = playable.map((entry) =>
    Number.isFinite(entry.video.duration) ? entry.video.duration : 0
  )

  // Durasi mengikuti klip terpanjang, dibatasi 0.5–30 detik agar selalu
  // terhindar dari nilai Infinity/NaN yang membuat rekaman langsung berhenti
  // atau berjalan tanpa akhir.
  const durationSeconds = Math.min(
    Math.max(shotDurationSeconds ?? Math.max(...rawDurations, 0.5), 0.5),
    30
  )
  const closingPhotoSeconds = 0.35

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(canvas.captureStream(30), {
    mimeType: pickMimeType(),
    videoBitsPerSecond: 4_000_000
  })

  const recorded = new Promise<Blob>((resolve) => {
    recorder.ondataavailable = (event): void => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = (): void => resolve(new Blob(chunks, { type: 'video/webm' }))
  })

  recorder.start()

  await Promise.all(playable.map((entry) => entry.video.play().catch(() => undefined)))

  const renderLoop = (): void => {
    context.fillStyle = background
    context.fillRect(0, 0, canvas.width, canvas.height)

    playable.forEach((entry) => {
      const frame = frames[entry.index]
      if (!frame) return
      if (entry.video.readyState >= 2) {
        drawVideoCover(context, entry.video, frame, cssFilter, mirror)
      }
    })

    if (overlayImage) {
      context.drawImage(overlayImage, 0, 0, canvas.width, canvas.height)
    }

    requestAnimationFrame(renderLoop)
  }

  const rafId = requestAnimationFrame(renderLoop)

  // Durasi ditentukan secara eksplisit. Event `ended` pada WebM hasil
  // MediaRecorder tidak konsisten di Electron dan dapat membuat komposisi
  // menunggu terlalu lama atau berhenti pada waktu yang berbeda.
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, (durationSeconds + closingPhotoSeconds) * 1000)
  })

  cancelAnimationFrame(rafId)
  recorder.stop()

  const blob = await recorded
  playable.forEach((entry) => {
    entry.video.pause()
    entry.video.src = ''
  })

  if (blob.size === 0) return null

  return {
    dataUrl: await blobToDataUrl(blob),
    width: canvas.width,
    height: canvas.height,
    durationSeconds
  }
}
