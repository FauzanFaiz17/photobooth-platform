/**
 * Pratinjau Filter di web memakai rumus CSS yang sama dengan pemutar desktop
 * (`desktop/electron-app/src/renderer/src/features/event/types.ts`), jadi angka
 * yang terlihat di kartu sama dengan yang nanti dipakai saat memotret.
 */
export interface FilterPreviewParams {
  brightness: number
  contrast: number
  saturation: number
  intensity: number
}

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0
}

export function filterPreviewStyle(params: FilterPreviewParams): string {
  const intensity = Math.min(100, Math.max(0, finite(params.intensity))) / 100
  const brightness = 100 + finite(params.brightness) * intensity
  const contrast = 100 + finite(params.contrast) * intensity
  const saturation = Math.max(0, 100 + finite(params.saturation) * intensity)

  // ponytail: LUT (lut_path) belum dirender di browser; desktop juga hanya memakai tiga nilai ini.
  return `brightness(${brightness.toFixed(2)}%) contrast(${contrast.toFixed(2)}%) saturate(${saturation.toFixed(2)}%)`
}
