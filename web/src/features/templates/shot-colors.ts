/** Warna pembeda tiap nomor foto; slot dengan `shot` sama selalu sewarna. */
export const SHOT_COLORS = [
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
] as const;

export function shotColor(shot: number): string {
  const safe = Number.isFinite(shot) ? Math.max(1, Math.trunc(shot)) : 1;
  return SHOT_COLORS[(safe - 1) % SHOT_COLORS.length];
}
