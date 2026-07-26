import { Film, ImageIcon } from "lucide-react"
import type { ReactElement } from "react"

import type { ManagedFrame } from "./frame-management.types"

export function FramePreview({
  frame,
  compact = false,
  animate = false,
}: {
  readonly frame: ManagedFrame
  readonly compact?: boolean
  readonly animate?: boolean
}): ReactElement {
  const Icon = frame.kind === "gif" ? Film : ImageIcon

  return (
    <div
      className={`relative overflow-hidden rounded-lg border ${compact ? "h-16 w-12" : "aspect-[2/3] w-full"} ${animate ? "animate-pulse" : ""}`}
      aria-label={`Preview ${frame.name}`}
    >
      <Icon className="absolute top-2 left-2 size-4 opacity-50" aria-hidden="true" />
      {frame.slots.slice(0, compact ? 3 : frame.slots.length).map((slot, index) => (
        <span
          key={slot.id}
          className="absolute flex items-center justify-center rounded border text-[10px] font-semibold"
          style={compact
            ? {
                left: `${12 + (index % 2) * 42}%`,
                top: `${22 + Math.floor(index / 2) * 32}%`,
                width: "34%",
                height: "25%",
              }
            : {
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                width: `${slot.width}%`,
                height: `${slot.height}%`,
              }}
        >
          {slot.label}
        </span>
      ))}
    </div>
  )
}
