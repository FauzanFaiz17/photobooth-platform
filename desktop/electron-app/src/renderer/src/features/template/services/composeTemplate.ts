import type { CapturedShot } from '@/store/sessionStore'

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

interface ComposeTemplateOptions {
  shots: CapturedShot[]
  jsonLayout: Record<string, unknown>
  layout: 'strip' | 'grid'
  overlayPath: string | null
  cssFilter?: string
}

export interface ComposedImage {
  dataUrl: string
  width: number
  height: number
}

const DEFAULT_CANVAS: CanvasSize = {
  width: 1200,
  height: 1800
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function getCanvasSize(jsonLayout: Record<string, unknown>): CanvasSize {
  const canvas = jsonLayout.canvas

  if (!isRecord(canvas)) return DEFAULT_CANVAS

  return {
    width: positiveNumber(canvas.width) ?? DEFAULT_CANVAS.width,
    height: positiveNumber(canvas.height) ?? DEFAULT_CANVAS.height
  }
}

function createFallbackFrames(
  count: number,
  canvas: CanvasSize,
  layout: 'strip' | 'grid'
): TemplateFrame[] {
  const gap = Math.max(16, Math.round(Math.min(canvas.width, canvas.height) * 0.02))
  const columns = layout === 'strip' ? 1 : Math.min(2, count)
  const rows = Math.ceil(count / columns)
  const frameWidth = (canvas.width - gap * (columns + 1)) / columns
  const frameHeight = (canvas.height - gap * (rows + 1)) / rows

  return Array.from({ length: count }, (_, index) => ({
    x: gap + (index % columns) * (frameWidth + gap),
    y: gap + Math.floor(index / columns) * (frameHeight + gap),
    width: frameWidth,
    height: frameHeight
  }))
}

export function getFrames(
  jsonLayout: Record<string, unknown>,
  count: number,
  canvas: CanvasSize,
  layout: 'strip' | 'grid'
): TemplateFrame[] {
  const fallbacks = createFallbackFrames(count, canvas, layout)
  const configuredFrames = Array.isArray(jsonLayout.frames) ? jsonLayout.frames : []

  return fallbacks.map((fallback, index) => {
    const configured = configuredFrames[index]

    if (!isRecord(configured)) return fallback

    return {
      x: finiteNumber(configured.x) ?? fallback.x,
      y: finiteNumber(configured.y) ?? fallback.y,
      width: positiveNumber(configured.width) ?? fallback.width,
      height: positiveNumber(configured.height) ?? fallback.height
    }
  })
}

function resolveOverlayUrl(path: string): string {
  if (/^(data:|blob:|https?:)/i.test(path)) return path

  const apiUrl = import.meta.env.VITE_API_URL as string | undefined

  if (!apiUrl) return path

  const baseUrl = new URL(apiUrl)

  if (path.startsWith('/')) {
    return new URL(path, baseUrl.origin).toString()
  }

  const normalizedPath = path.replace(/^storage\//, '')
  return new URL(`/storage/${normalizedPath}`, baseUrl.origin).toString()
}

export async function loadTemplateOverlayDataUrl(path: string): Promise<string> {
  const source = resolveOverlayUrl(path)

  if (source.startsWith('data:') || source.startsWith('blob:')) {
    return source
  }

  return window.asset.loadImage(source)
}

async function loadOverlay(path: string): Promise<HTMLImageElement> {
  const dataUrl = await loadTemplateOverlayDataUrl(path)
  return loadImage(dataUrl, 'Overlay template')
}

function loadImage(source: string, label: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    if (!source.startsWith('data:') && !source.startsWith('blob:')) {
      image.crossOrigin = 'anonymous'
    }

    image.onload = (): void => resolve(image)
    image.onerror = (): void => reject(new Error(`${label} tidak dapat dimuat.`))
    image.src = source
  })
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: TemplateFrame,
  cssFilter: string
): void {
  const scale = Math.max(frame.width / image.naturalWidth, frame.height / image.naturalHeight)
  const sourceWidth = frame.width / scale
  const sourceHeight = frame.height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2

  context.save()
  context.filter = cssFilter
  context.beginPath()
  context.rect(frame.x, frame.y, frame.width, frame.height)
  context.clip()
  context.drawImage(
    image,
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

export async function composeTemplateImage({
  shots,
  jsonLayout,
  layout,
  overlayPath,
  cssFilter = 'none'
}: ComposeTemplateOptions): Promise<ComposedImage> {
  if (shots.length === 0) throw new Error('Tidak ada foto untuk dikomposisikan.')

  const canvasSize = getCanvasSize(jsonLayout)
  const frames = getFrames(jsonLayout, shots.length, canvasSize, layout)
  const canvas = document.createElement('canvas')
  canvas.width = canvasSize.width
  canvas.height = canvasSize.height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas komposisi tidak tersedia.')

  const canvasConfiguration = isRecord(jsonLayout.canvas) ? jsonLayout.canvas : null
  const background =
    (canvasConfiguration && typeof canvasConfiguration.background === 'string'
      ? canvasConfiguration.background
      : null) ?? (typeof jsonLayout.background === 'string' ? jsonLayout.background : '#ffffff')

  context.fillStyle = background
  context.fillRect(0, 0, canvas.width, canvas.height)

  const shotImages = await Promise.all(
    shots.map((shot, index) => loadImage(shot.dataUrl, `Foto ${index + 1}`))
  )

  shotImages.forEach((image, index) => drawCover(context, image, frames[index], cssFilter))

  if (overlayPath) {
    const overlay = await loadOverlay(overlayPath)
    context.drawImage(overlay, 0, 0, canvas.width, canvas.height)
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height
  }
}
