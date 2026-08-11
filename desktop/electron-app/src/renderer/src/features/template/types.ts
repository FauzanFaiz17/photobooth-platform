export interface PhotoTemplate {
  id: string
  sourceId: number
  name: string
  /** jumlah foto yang dibutuhkan untuk mengisi layout template ini */
  slots: number
  /** warna preview sederhana, sebelum ada asset asli dari backend */
  previewColor: string
  layout: 'strip' | 'grid'
  previewPath: string | null
  thumbnailPath: string | null
  overlayPath: string | null
  jsonLayout: Record<string, unknown>
  version: number
}
