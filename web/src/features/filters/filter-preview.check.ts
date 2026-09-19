/**
 * Cek cepat rumus pratinjau Filter. Jalankan dari folder `web`:
 *   node src/features/filters/filter-preview.check.ts
 */

import { filterPreviewStyle } from "./filter-preview.ts"

function check(condition: boolean, label: string): void {
  if (!condition) throw new Error(`GAGAL: ${label}`)
  console.log(`ok - ${label}`)
}

check(
  filterPreviewStyle({ brightness: 0, contrast: 0, saturation: 0, intensity: 100 }) ===
    "brightness(100.00%) contrast(100.00%) saturate(100.00%)",
  "nilai netral tidak mengubah gambar",
)

check(
  filterPreviewStyle({ brightness: 20, contrast: -10, saturation: 50, intensity: 50 }) ===
    "brightness(110.00%) contrast(95.00%) saturate(125.00%)",
  "intensity menskalakan brightness/contrast/saturation",
)

check(
  filterPreviewStyle({ brightness: 0, contrast: 0, saturation: -500, intensity: 100 }) ===
    "brightness(100.00%) contrast(100.00%) saturate(0.00%)",
  "saturation tidak pernah negatif",
)

check(
  filterPreviewStyle({ brightness: Number.NaN, contrast: 0, saturation: 0, intensity: 500 }) ===
    "brightness(100.00%) contrast(100.00%) saturate(100.00%)",
  "intensity dijepit 0-100 dan NaN dianggap 0",
)
