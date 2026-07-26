export type ManagedFrameKind = "photo" | "gif"

export type ManagedFrameSize = "2R" | "4R" | "square"

export interface ManagedFrameSlot {
  readonly id: string
  readonly label: number
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly layer: number
}

export interface ManagedFrame {
  readonly id: string
  readonly name: string
  readonly kind: ManagedFrameKind
  readonly size: ManagedFrameSize
  readonly slots: ReadonlyArray<ManagedFrameSlot>
  readonly assetName: string
  readonly updatedAt: string
}

export interface FrameSizeMeta {
  readonly label: string
  readonly resolution: string
  readonly width: number
  readonly height: number
}

export type FrameEditorMode = "edit" | "preview"

export type FrameCanvasBackground = "light" | "dark" | "grid"

export type FrameRotation = -90 | 0 | 90

export interface FrameEditorErrors {
  readonly name?: string
  readonly asset?: string
  readonly slots?: string
}
