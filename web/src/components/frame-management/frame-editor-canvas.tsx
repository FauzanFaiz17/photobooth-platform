import {
  Grid3X3,
  ImagePlus,
  Maximize2,
  Moon,
  Pause,
  Play,
  Plus,
  QrCode,
  RotateCcw,
  RotateCw,
  Search,
  Sun,
} from "lucide-react"
import {
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
} from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import type {
  FrameCanvasBackground,
  FrameEditorMode,
  FrameRotation,
  ManagedFrameKind,
  ManagedFrameSlot,
  ManagedFrameSize,
} from "./frame-management.types"

interface FrameEditorCanvasProps {
  readonly kind: ManagedFrameKind
  readonly size: ManagedFrameSize
  readonly slots: ReadonlyArray<ManagedFrameSlot>
  readonly selectedSlotId: string | null
  readonly mode: FrameEditorMode
  readonly background: FrameCanvasBackground
  readonly rotation: FrameRotation
  readonly zoom: number
  readonly qrEnabled: boolean
  readonly assetPreviewUrl: string | null
  readonly assetName: string
  readonly isAnimating: boolean
  readonly onModeChange: (mode: FrameEditorMode) => void
  readonly onBackgroundChange: (background: FrameCanvasBackground) => void
  readonly onRotationChange: (rotation: FrameRotation) => void
  readonly onZoomChange: (zoom: number) => void
  readonly onQrChange: (enabled: boolean) => void
  readonly onAnimationChange: (animating: boolean) => void
  readonly onAddSlot: () => void
  readonly onSelectSlot: (id: string) => void
  readonly onSlotChange: (slot: ManagedFrameSlot) => void
  readonly onUploadClick: () => void
}

export function FrameEditorCanvas({
  kind,
  size,
  slots,
  selectedSlotId,
  mode,
  background,
  rotation,
  zoom,
  qrEnabled,
  assetPreviewUrl,
  assetName,
  isAnimating,
  onModeChange,
  onBackgroundChange,
  onRotationChange,
  onZoomChange,
  onQrChange,
  onAnimationChange,
  onAddSlot,
  onSelectSlot,
  onSlotChange,
  onUploadClick,
}: FrameEditorCanvasProps): ReactElement {
  const aspectRatio = size === "2R" ? "2 / 3" : size === "4R" ? "3 / 2" : "1 / 1"

  return (
    <div className="space-y-3 rounded-xl border p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs opacity-70">Latar Canvas:</span>
        {([
          ["light", Sun],
          ["dark", Moon],
          ["grid", Grid3X3],
        ] as const).map(([value, Icon]) => (
          <Button
            key={value}
            type="button"
            size="icon-sm"
            variant={background === value ? "secondary" : "ghost"}
            aria-label={`Latar ${value}`}
            aria-pressed={background === value}
            onClick={() => onBackgroundChange(value)}
          >
            <Icon aria-hidden="true" />
          </Button>
        ))}

        <span className="ml-1 text-xs opacity-70">Rotasi:</span>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Putar ke kiri" onClick={() => onRotationChange(rotation === -90 ? 0 : -90)}>
          <RotateCcw aria-hidden="true" />
        </Button>
        <Button type="button" size="icon-sm" variant={rotation === 0 ? "secondary" : "ghost"} aria-label="Rotasi normal" onClick={() => onRotationChange(0)}>
          <Maximize2 aria-hidden="true" />
        </Button>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Putar ke kanan" onClick={() => onRotationChange(rotation === 90 ? 0 : 90)}>
          <RotateCw aria-hidden="true" />
        </Button>

        <div className="ml-auto flex rounded-lg border p-0.5">
          <Button type="button" size="sm" variant={mode === "edit" ? "secondary" : "ghost"} onClick={() => onModeChange("edit")}>Ubah</Button>
          <Button type="button" size="sm" variant={mode === "preview" ? "secondary" : "ghost"} onClick={() => onModeChange("preview")}>Preview</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onQrChange(!qrEnabled)}>
          <QrCode aria-hidden="true" />
          {qrEnabled ? "Hapus QR Code" : "Tambah QR Code"}
        </Button>
        <div className="flex flex-wrap gap-2">
          {kind === "gif" && mode === "preview" && (
            <Button type="button" variant="outline" size="sm" onClick={() => onAnimationChange(!isAnimating)}>
              {isAnimating ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {isAnimating ? "Jeda GIF" : "Putar GIF"}
            </Button>
          )}
          <Button type="button" size="sm" onClick={onAddSlot}>
            <Plus aria-hidden="true" />
            Tambah Slot Foto
          </Button>
        </div>
      </div>

      <div className="flex min-h-[28rem] items-center justify-center overflow-auto rounded-xl border p-4 sm:min-h-[36rem]">
        <div
          data-frame-canvas
          className={`relative max-h-[52rem] w-full max-w-xl touch-none overflow-hidden rounded-lg border ${kind === "gif" && mode === "preview" && isAnimating ? "animate-pulse" : ""}`}
          style={{
            aspectRatio,
            transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
          }}
        >
          {!assetPreviewUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center opacity-60">
              <ImagePlus className="size-10" aria-hidden="true" />
              <p className="mt-3 font-medium">{assetName || "Upload frame untuk memulai"}</p>
              <p className="mt-1 text-xs">{background === "grid" ? "Latar grid" : background === "dark" ? "Latar gelap" : "Latar terang"}</p>
              {!assetName && <Button className="mt-4" type="button" variant="outline" onClick={onUploadClick}>Pilih Aset</Button>}
            </div>
          )}

          {slots.map((slot) => (
            <DraggableFrameSlot
              key={slot.id}
              slot={slot}
              selected={selectedSlotId === slot.id}
              disabled={mode === "preview"}
              onSelect={() => onSelectSlot(slot.id)}
              onChange={onSlotChange}
            />
          ))}

          {qrEnabled && (
            <div className="absolute right-[5%] bottom-[5%] z-40 flex size-[16%] min-h-12 min-w-12 items-center justify-center rounded border" aria-label="QR Code">
              <QrCode className="size-2/3" aria-hidden="true" />
            </div>
          )}

          {assetPreviewUrl && (
            <img
              src={assetPreviewUrl}
              alt={`Aset ${assetName}`}
              className="pointer-events-none absolute inset-0 z-30 size-full object-contain"
            />
          )}

          <span className="absolute bottom-2 left-2 z-50 rounded border px-2 py-1 text-[10px] font-medium">
            {size} · {rotation === 0 ? "Normal" : `${rotation}°`} · {zoom}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Search className="size-4 opacity-60" aria-hidden="true" />
        <Label htmlFor="frame-canvas-zoom" className="text-xs">Zoom Canvas</Label>
        <input
          id="frame-canvas-zoom"
          className="min-w-0 flex-1"
          type="range"
          min="60"
          max="140"
          step="10"
          value={zoom}
          onChange={(event) => onZoomChange(Number(event.target.value))}
        />
        <span className="w-10 text-right text-xs tabular-nums">{zoom}%</span>
      </div>
    </div>
  )
}

interface PointerInteraction {
  readonly mode: "drag" | "resize"
  readonly startX: number
  readonly startY: number
  readonly canvasWidth: number
  readonly canvasHeight: number
  readonly original: ManagedFrameSlot
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function DraggableFrameSlot({
  slot,
  selected,
  disabled,
  onSelect,
  onChange,
}: {
  readonly slot: ManagedFrameSlot
  readonly selected: boolean
  readonly disabled: boolean
  readonly onSelect: () => void
  readonly onChange: (slot: ManagedFrameSlot) => void
}): ReactElement {
  const interaction = useRef<PointerInteraction | null>(null)

  function beginInteraction(
    event: ReactPointerEvent<HTMLElement>,
    mode: PointerInteraction["mode"]
  ): void {
    if (disabled) return
    event.preventDefault()
    event.stopPropagation()
    const canvas = event.currentTarget.closest<HTMLElement>("[data-frame-canvas]")
    if (!canvas) return
    const bounds = canvas.getBoundingClientRect()
    interaction.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      canvasWidth: bounds.width,
      canvasHeight: bounds.height,
      original: slot,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    onSelect()
  }

  function moveInteraction(event: ReactPointerEvent<HTMLElement>): void {
    const current = interaction.current
    if (!current) return
    event.preventDefault()
    event.stopPropagation()
    const deltaX = ((event.clientX - current.startX) / current.canvasWidth) * 100
    const deltaY = ((event.clientY - current.startY) / current.canvasHeight) * 100

    if (current.mode === "drag") {
      onChange({
        ...current.original,
        x: clamp(current.original.x + deltaX, 0, 100 - current.original.width),
        y: clamp(current.original.y + deltaY, 0, 100 - current.original.height),
      })
      return
    }

    onChange({
      ...current.original,
      width: clamp(current.original.width + deltaX, 10, 100 - current.original.x),
      height: clamp(current.original.height + deltaY, 10, 100 - current.original.y),
    })
  }

  function endInteraction(event: ReactPointerEvent<HTMLElement>): void {
    if (!interaction.current) return
    interaction.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      className={`absolute flex cursor-move touch-none select-none items-center justify-center rounded border-2 font-semibold ${selected ? "ring-2 ring-offset-2" : ""}`}
      style={{
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width: `${slot.width}%`,
        height: `${slot.height}%`,
        zIndex: slot.layer + 1,
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Slot foto ${slot.label}`}
      onClick={onSelect}
      onPointerDown={(event) => beginInteraction(event, "drag")}
      onPointerMove={moveInteraction}
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
    >
      <span className="text-lg sm:text-2xl">{slot.label}</span>
      {!disabled && (
        <button
          type="button"
          className="absolute right-0 bottom-0 flex size-6 cursor-se-resize items-center justify-center rounded-tl border"
          aria-label={`Ubah ukuran slot ${slot.label}`}
          onPointerDown={(event) => beginInteraction(event, "resize")}
          onPointerMove={moveInteraction}
          onPointerUp={endInteraction}
          onPointerCancel={endInteraction}
        >
          <Maximize2 className="size-3" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
