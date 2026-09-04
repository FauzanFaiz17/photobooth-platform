import type { PhotoFilter } from '@/features/filter/types'
import type { PhotoTemplate } from '@/features/template/types'

export interface EventSummary {
  id: number
  event_name: string
  event_code: string
  status: 'scheduled' | 'ongoing'
  event_date: string
  start_time: string
  end_time: string
  price: number
  print_options?: EventPrintOption[]
  print_count_limit: number
  partner: {
    id: number
    company_name: string
  }
  booth: {
    id: number
    name: string
  }
}

export interface TemplateSnapshot {
  id: number
  template_id: number
  name: string
  paper_size: '2r' | '4r'
  preview_path: string | null
  thumbnail_path: string | null
  json_layout: Record<string, unknown>
  psd_path: string | null
  png_path: string | null
  png_url?: string | null
  version: number
}

export interface FilterSnapshot {
  id: number
  filter_id: number
  name: string
  lut_path: string | null
  brightness: number
  contrast: number
  saturation: number
  sharpness: number
  white_balance: number
  intensity: number
  version: number
}

export interface CameraSnapshot {
  id: number
  camera_profile_id: number
  iso: string | null
  shutter_speed: string | null
  aperture: string | null
  white_balance: string | null
  exposure: string | null
  focus_mode: string | null
  countdown_seconds: number
  burst_count: number
  image_quality: string | null
  live_view: boolean
  version: number
}

export interface PrinterSnapshot {
  id: number
  printer_profile_id: number
  printer_name: string
  copies: number
  paper_size: string
  orientation: string
  auto_print: boolean
  border: boolean
  bleed: number
  delay_ms: number
  version: number
}

export interface EventConfiguration {
  event: EventSummary
  template: TemplateSnapshot
  templates?: TemplateSnapshot[]
  filter: FilterSnapshot
  filters?: FilterSnapshot[]
  print_options?: EventPrintOption[]
  camera: CameraSnapshot
  printer: PrinterSnapshot
}

export interface EventPrintOption {
  id: number
  paper_size: '2r' | '4r'
  unit_quantity: number
  quantity_step: number
  price: number | string
  is_active: boolean
}

function recordValue(value: Record<string, unknown>, key: string): unknown {
  return value[key]
}

export function mapTemplateSnapshot(snapshot: TemplateSnapshot): PhotoTemplate {
  const frames = recordValue(snapshot.json_layout, 'frames')
  const configuredLayout = recordValue(snapshot.json_layout, 'layout')
  const slots = Array.isArray(frames) && frames.length > 0 ? frames.length : 1

  return {
    id: String(snapshot.id),
    sourceId: snapshot.template_id,
    name: snapshot.name,
    slots,
    previewColor: '#334155',
    layout:
      configuredLayout === 'strip' || snapshot.name.toLowerCase().includes('strip') || slots > 4
        ? 'strip'
        : 'grid',
    previewPath: snapshot.preview_path,
    thumbnailPath: snapshot.thumbnail_path,
    overlayPath: snapshot.png_url ?? snapshot.png_path,
    jsonLayout: snapshot.json_layout,
    version: snapshot.version
  }
}

export function mapFilterSnapshot(snapshot: FilterSnapshot): PhotoFilter {
  const intensity = Math.max(0, Math.min(100, snapshot.intensity)) / 100
  const brightness = 100 + snapshot.brightness * intensity
  const contrast = 100 + snapshot.contrast * intensity
  const saturation = Math.max(0, 100 + snapshot.saturation * intensity)

  return {
    id: String(snapshot.id),
    sourceId: snapshot.filter_id,
    name: snapshot.name,
    cssFilter: [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`
    ].join(' '),
    version: snapshot.version
  }
}
