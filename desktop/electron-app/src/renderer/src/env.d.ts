/// <reference types="vite/client" />

declare module 'gifenc' {
  type Palette = number[][]

  interface GifEncoder {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options: { palette: Palette; delay?: number; repeat?: number }
    ): void
    finish(): void
    bytes(): Uint8Array
  }

  export function GIFEncoder(): GifEncoder
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number): Palette
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette): Uint8Array
}

export {}

declare global {
  interface Window {
    api?: {
      request: (endpoint: string, method?: string, body?: unknown) => Promise<any>
    }
    electron: any
  }
}
