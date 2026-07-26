import type {
  FrameSizeMeta,
  ManagedFrame,
  ManagedFrameSize,
  ManagedFrameSlot,
} from "./frame-management.types"

export const frameSizeMeta: Record<ManagedFrameSize, FrameSizeMeta> = {
  "2R": {
    label: "2R (4×6 CUT)",
    resolution: "1200 × 1800 px",
    width: 1200,
    height: 1800,
  },
  "4R": {
    label: "4R (4×6)",
    resolution: "1800 × 1200 px",
    width: 1800,
    height: 1200,
  },
  square: {
    label: "Square",
    resolution: "1500 × 1500 px",
    width: 1500,
    height: 1500,
  },
}

function createSlots(count: number): ReadonlyArray<ManagedFrameSlot> {
  return Array.from({ length: count }, (_, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    return {
      id: `slot-${index + 1}`,
      label: index + 1,
      x: 7 + column * 48,
      y: 7 + row * 30,
      width: 38,
      height: 24,
      layer: index,
    }
  })
}

const frameSeeds = [
  ["ameho-15", "AMEHO 15", "photo", "2R", 6, "ameho-15.png"],
  ["ameho-14", "AMEHO 14", "photo", "2R", 6, "ameho-14.png"],
  ["ameho-13", "AMEHO 13", "photo", "2R", 8, "ameho-13.png"],
  ["ameho-12", "AMEHO 12", "photo", "2R", 8, "ameho-12.png"],
  ["wedding-minimal", "Wedding Minimal", "photo", "4R", 2, "wedding-minimal.png"],
  ["birthday-pop", "Birthday Pop", "photo", "square", 4, "birthday-pop.png"],
  ["graduation-day", "Graduation Day", "photo", "2R", 3, "graduation-day.png"],
  ["classic-film", "Classic Film Strip", "photo", "2R", 4, "classic-film.png"],
  ["corporate-clean", "Corporate Clean", "photo", "4R", 1, "corporate-clean.png"],
  ["floral-story", "Floral Story", "photo", "square", 4, "floral-story.png"],
  ["summer-card", "Summer Postcard", "photo", "4R", 2, "summer-card.png"],
  ["monochrome-cut", "Monochrome Four Cut", "photo", "2R", 4, "monochrome-cut.png"],
  ["sparkle-loop", "Sparkle Loop", "gif", "2R", 3, "sparkle-loop.gif"],
  ["confetti-motion", "Confetti Motion", "gif", "square", 4, "confetti-motion.gif"],
  ["wedding-glow", "Wedding Glow", "gif", "4R", 2, "wedding-glow.gif"],
  ["retro-countdown", "Retro Countdown", "gif", "2R", 3, "retro-countdown.gif"],
  ["neon-party", "Neon Party", "gif", "square", 1, "neon-party.gif"],
  ["graduation-loop", "Graduation Loop", "gif", "4R", 2, "graduation-loop.gif"],
] as const

export const initialManagedFrames: ReadonlyArray<ManagedFrame> = frameSeeds.map(
  ([id, name, kind, size, slotCount, assetName], index) => ({
    id,
    name,
    kind,
    size,
    slots: createSlots(slotCount),
    assetName,
    updatedAt: new Date(2026, 6, 18 - index, 10, 30).toISOString(),
  })
)

export const frameKioskOptions = [
  { id: "kiosk-ameho", name: "AMEHO" },
  { id: "kiosk-kolase-central", name: "Kolase Central Park" },
  { id: "kiosk-senja", name: "Studio Senja" },
  { id: "kiosk-pik", name: "Kolase PIK" },
] as const
