import { applyPalette, GIFEncoder, quantize } from 'gifenc'

import {
  getCanvasSize,
  getFrameCount,
  getFrames,
  loadTemplateOverlayDataUrl
} from '@/features/template/services/composeTemplate'

import type { CapturedShot } from '@/store/sessionStore'

export interface AnimatedGif {
  dataUrl: string
  width: number
  height: number
  durationSeconds: number
}

export interface GifTemplateContext {
  jsonLayout: Record<string, unknown>
  overlayPath: string | null
}

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

const MAX_GIF_WIDTH = 640
const FRAME_DELAY_MS = 800

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

async function loadOverlay(path: string): Promise<HTMLImageElement> {
  const source = await loadTemplateOverlayDataUrl(path)
  return loadImage(source, 'Overlay GIF template')
}

function resolveBackground(jsonLayout: Record<string, unknown>): string {
  const canvasConfiguration = isRecord(jsonLayout.canvas) ? jsonLayout.canvas : null

  return (
    (canvasConfiguration && typeof canvasConfiguration.background === 'string'
      ? canvasConfiguration.background
      : null) ?? (typeof jsonLayout.background === 'string' ? jsonLayout.background : '#ffffff')
  )
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: TemplateFrame
): void {
  const scale = Math.max(frame.width / image.naturalWidth, frame.height / image.naturalHeight)
  const sourceWidth = frame.width / scale
  const sourceHeight = frame.height / scale
  const sourceX = (image.naturalWidth - sourceWidth) / 2
  const sourceY = (image.naturalHeight - sourceHeight) / 2

  context.save()
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

function bytesToDataUrl(bytes: Uint8Array): string {
  const chunkSize = 0x8000
  let binary = ''

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return `data:image/gif;base64,${btoa(binary)}`
}

/**
 * Menyusun GIF dari seluruh foto sesi.
 * Bila template GIF tersedia, setiap frame dirender di atas canvas template
 * (background + slot foto + overlay PNG) persis seperti hasil cetak.
 * Slot terisi bergiliran: frame pertama menampilkan foto 1..N, frame berikutnya
 * menggeser rotasi sehingga semua foto tampil di setiap slot.
 */
export async function createSessionGif(
  shots: CapturedShot[],
  template?: GifTemplateContext | null
): Promise<AnimatedGif> {
  if (shots.length === 0) throw new Error('Tidak ada foto untuk membuat GIF.')

  const shotImages = await Promise.all(
    shots.map((shot, index) => loadImage(shot.dataUrl, `Foto ${index + 1}`))
  )

  const jsonLayout = template?.jsonLayout ?? null
  const hasTemplate = jsonLayout !== null
  const firstImage = shotImages[0]

  const canvasSize: CanvasSize = hasTemplate
    ? getCanvasSize(jsonLayout)
    : { width: firstImage.naturalWidth, height: firstImage.naturalHeight }

  const frames: TemplateFrame[] = hasTemplate
    ? getFrames(
        jsonLayout,
        getFrameCount(jsonLayout),
        canvasSize,
        isRecord(jsonLayout) && jsonLayout.layout === 'strip' ? 'strip' : 'grid'
      )
    : []

  let overlay: HTMLImageElement | null = null
  if (template?.overlayPath) {
    overlay = await loadOverlay(template.overlayPath)
  }

  const canvas = document.createElement('canvas')
  canvas.width = canvasSize.width
  canvas.height = canvasSize.height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas GIF tidak tersedia.')

  const scale = Math.min(1, MAX_GIF_WIDTH / canvasSize.width)
  const width = Math.max(1, Math.round(canvasSize.width * scale))
  const height = Math.max(1, Math.round(canvasSize.height * scale))

  const encodeCanvas = document.createElement('canvas')
  encodeCanvas.width = width
  encodeCanvas.height = height

  const encodeContext = encodeCanvas.getContext('2d', { willReadFrequently: true })
  if (!encodeContext) throw new Error('Canvas GIF tidak tersedia.')

  const background = hasTemplate ? resolveBackground(jsonLayout) : null
  const gif = GIFEncoder()

  for (let index = 0; index < shotImages.length; index += 1) {
    context.clearRect(0, 0, canvas.width, canvas.height)

    if (hasTemplate && background !== null) {
      context.fillStyle = background
      context.fillRect(0, 0, canvas.width, canvas.height)

      frames.forEach((frame, slot) => {
        const image = shotImages[(index + slot) % shotImages.length]
        drawCover(context, image, frame)
      })

      if (overlay) {
        context.drawImage(overlay, 0, 0, canvas.width, canvas.height)
      }
    } else {
      context.drawImage(shotImages[index], 0, 0, canvas.width, canvas.height)
      if (overlay) {
        context.drawImage(overlay, 0, 0, canvas.width, canvas.height)
      }
    }

    encodeContext.clearRect(0, 0, width, height)
    encodeContext.drawImage(canvas, 0, 0, width, height)

    const rgba = encodeContext.getImageData(0, 0, width, height).data
    const palette = quantize(rgba, 256)
    const indexed = applyPalette(rgba, palette)

    gif.writeFrame(indexed, width, height, {
      palette,
      delay: FRAME_DELAY_MS,
      repeat: 0
    })
  }

  gif.finish()

  return {
    dataUrl: bytesToDataUrl(gif.bytes()),
    width,
    height,
    durationSeconds: (shotImages.length * FRAME_DELAY_MS) / 1000
  }
}
