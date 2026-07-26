import { Archive, CheckCircle2, MonitorCheck, Trash2, X } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"

export function FramePhotoBulkActions({ count, onActivate, onArchive, onAssign, onDelete, onClear }: { readonly count: number; readonly onActivate: () => void; readonly onArchive: () => void; readonly onAssign: () => void; readonly onDelete: () => void; readonly onClear: () => void }): ReactElement | null {
  if (count === 0) return null
  return <section aria-live="polite" className="flex flex-col gap-3 border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-medium text-foreground">{count} frames selected</p><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={onActivate}><CheckCircle2 aria-hidden="true" /> Activate</Button><Button variant="outline" size="sm" onClick={onArchive}><Archive aria-hidden="true" /> Archive</Button><Button variant="outline" size="sm" onClick={onAssign}><MonitorCheck aria-hidden="true" /> Assign to Kiosk</Button><Button variant="destructive" size="sm" onClick={onDelete}><Trash2 aria-hidden="true" /> Delete</Button><Button variant="ghost" size="sm" onClick={onClear}><X aria-hidden="true" /> Clear selection</Button></div></section>
}

