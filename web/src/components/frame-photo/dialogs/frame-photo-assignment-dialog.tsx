import { Search } from "lucide-react"
import { useState, type ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FramePhotoKiosk, FramePhotoKioskStatus } from "../types/frame-photo.types"

function getKioskStatusMeta(status: FramePhotoKioskStatus): { readonly label: string; readonly variant: "default" | "secondary" | "destructive" } {
  switch (status) {
    case "online": return { label: "Online", variant: "default" }
    case "maintenance": return { label: "Maintenance", variant: "secondary" }
    case "offline": return { label: "Offline", variant: "destructive" }
  }
}

export function FramePhotoAssignmentDialog({ frameCount, kiosks, initialKioskIds, open, onOpenChange, onSave }: { readonly frameCount: number; readonly kiosks: ReadonlyArray<FramePhotoKiosk>; readonly initialKioskIds: ReadonlyArray<string>; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onSave: (kioskIds: ReadonlyArray<string>) => void }): ReactElement {
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set(initialKioskIds))
  const visibleKiosks = kiosks.filter((kiosk) => `${kiosk.name} ${kiosk.location}`.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID")))
  const toggle = (id: string, checked: boolean): void => setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next })
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Assign to Kiosk</DialogTitle><DialogDescription>Choose which kiosks will use {frameCount} selected frame{frameCount === 1 ? "" : "s"}.</DialogDescription></DialogHeader><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Label htmlFor="assign-kiosk-search" className="sr-only">Search kiosks</Label><Input id="assign-kiosk-search" className="pl-8" placeholder="Search kiosk or location" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{selectedIds.size} kiosks selected</p><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setSelectedIds((current) => new Set([...current, ...visibleKiosks.map((kiosk) => kiosk.id)]))}>Select all</Button><Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear selection</Button></div></div><ul className="divide-y divide-border">{visibleKiosks.map((kiosk) => { const meta = getKioskStatusMeta(kiosk.status); return <li key={kiosk.id} className="flex items-start gap-3 py-3"><Checkbox checked={selectedIds.has(kiosk.id)} onCheckedChange={(checked) => toggle(kiosk.id, checked)} aria-label={`Assign to ${kiosk.name}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{kiosk.name}</p><Badge variant={meta.variant}>{meta.label}</Badge></div><p className="text-xs text-muted-foreground">{kiosk.location} · Active frame: {kiosk.activeFrameName}</p></div></li>})}</ul><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => onSave([...selectedIds])}>Save Assignment</Button></DialogFooter></DialogContent></Dialog>
}

