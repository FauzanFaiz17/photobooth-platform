import { Gift, GraduationCap, Heart, Landmark, Leaf, PanelsTopLeft, RectangleHorizontal, RectangleVertical, Square, type LucideIcon } from "lucide-react"

import type { PhotoFrameCategory, PhotoFrameOrientation } from "../types/frame-photo.types"

function assertNever(value: never): never { throw new Error(`Unhandled frame metadata: ${String(value)}`) }

export function getCategoryIcon(category: PhotoFrameCategory): LucideIcon {
  switch (category) {
    case "classic": return PanelsTopLeft
    case "minimal": return Square
    case "wedding": return Heart
    case "graduation": return GraduationCap
    case "birthday": return Gift
    case "corporate": return Landmark
    case "seasonal": return Leaf
    default: return assertNever(category)
  }
}

export function getOrientationIcon(orientation: PhotoFrameOrientation): LucideIcon {
  switch (orientation) {
    case "portrait": return RectangleVertical
    case "landscape": return RectangleHorizontal
    case "square": return Square
    default: return assertNever(orientation)
  }
}

