import type { KioskStatus } from "../types/kiosk.types"

export interface KioskCatalogItem {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly frameCount: number
  readonly license: string
  readonly pricePerPrint: number
  readonly expiresAt: string
  readonly status: KioskStatus
  readonly applicationVersion: string
  readonly screenOrientation: "landscape-primary" | "portrait-primary"
  readonly lastHeartbeat: string
  readonly printer: {
    readonly name: string
    readonly status: "ready" | "offline"
  }
  readonly camera: {
    readonly name: string
    readonly connected: boolean
  }
  readonly paper: {
    readonly capacity: number
    readonly remaining: number
  }
}

export interface KioskPrintHistoryItem {
  readonly id: string
  readonly occurredAt: string
  readonly type: "SESSION" | "REPRINT"
  readonly copies: number
}

export type KioskDetailTab =
  | "info"
  | "general"
  | "frame"
  | "payment"
  | "timer"
  | "camera-display"
  | "idle-ads"

export interface KioskWelcomeSettings {
  readonly layout: "classic" | "centered" | "split"
  readonly backgroundColor: string
  readonly ornamentColor: string
  readonly borderColor: string
  readonly textColor: string
  readonly buttonBackgroundColor: string
  readonly buttonTextColor: string
  readonly title: string
  readonly tagline: string
  readonly logoHeight: number
  readonly galleryAccentColor: string
  readonly galleryBackgroundColor: string
  readonly instagram: string
  readonly tiktok: string
}
