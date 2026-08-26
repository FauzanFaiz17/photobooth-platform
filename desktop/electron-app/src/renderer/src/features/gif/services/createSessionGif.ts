import { applyPalette, GIFEncoder, quantize } from 'gifenc'

import type { CapturedShot } from '@/store/sessionStore'

export interface AnimatedGif {
  dataUrl: string
  width: number
  height: number
  durationSeconds: number
}

const MAX_GIF_WIDTH = 640
const FRAME_DELAY_MS = 800

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = (): void => resolve(image)
    image.onerror = (): void => reject(new Error('Foto untuk GIF tidak dapat dimuat.'))
    image.src = source
  })
}

function bytesToDataUrl(bytes: Uint8Array): string {
  const chunkSize = 0x8000
  let binary = ''

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return `data:image/gif;base64,${btoa(binary)}`
}

export async function createSessionGif(shots: CapturedShot[]): Promise<AnimatedGif> {
  if (shots.length === 0) throw new Error('Tidak ada foto untuk membuat GIF.')

  const images = await Promise.all(shots.map((shot) => loadImage(shot.dataUrl)))
  const firstImage = images[0]
  const scale = Math.min(1, MAX_GIF_WIDTH / firstImage.naturalWidth)
  const width = Math.max(1, Math.round(firstImage.naturalWidth * scale))
  const height = Math.max(1, Math.round(firstImage.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas GIF tidak tersedia.')

  const gif = GIFEncoder()

  images.forEach((image) => {
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)

    const rgba = context.getImageData(0, 0, width, height).data
    const palette = quantize(rgba, 256)
    const indexed = applyPalette(rgba, palette)

    gif.writeFrame(indexed, width, height, {
      palette,
      delay: FRAME_DELAY_MS,
      repeat: 0
    })
  })

  gif.finish()

  return {
    dataUrl: bytesToDataUrl(gif.bytes()),
    width,
    height,
    durationSeconds: (shots.length * FRAME_DELAY_MS) / 1000
  }
}
