import { useState, type FormEvent, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { GalleryAlbumFormValues, GalleryAlbumStatus } from "../types/gallery.types"

const initialValues: GalleryAlbumFormValues = { name: "", description: "", status: "private", enablePublicGallery: false }
const statuses = [{ value: "published", label: "Published" }, { value: "private", label: "Private" }, { value: "archived", label: "Archived" }] satisfies ReadonlyArray<{ value: GalleryAlbumStatus; label: string }>

export function GalleryCreateAlbumDialog({ open, selectedCount, onOpenChange, onCreate }: { readonly open: boolean; readonly selectedCount: number; readonly onOpenChange: (open: boolean) => void; readonly onCreate: (values: GalleryAlbumFormValues) => void }): ReactElement {
  const [values, setValues] = useState<GalleryAlbumFormValues>(initialValues)
  const [error, setError] = useState<string | null>(null)
  const handleOpen = (next: boolean): void => { if (next) { setValues(initialValues); setError(null) } onOpenChange(next) }
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => { event.preventDefault(); const name = values.name.trim(); if (name.length < 3 || name.length > 80) { setError("Album name harus 3–80 karakter."); return } if (values.description.length > 300) { setError("Description maksimal 300 karakter."); return } onCreate({ ...values, name, enablePublicGallery: values.status === "published" && values.enablePublicGallery }); onOpenChange(false) }
  return <Dialog open={open} onOpenChange={handleOpen}><DialogContent><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>Create album</DialogTitle><DialogDescription>Create a gallery album{selectedCount > 0 ? ` with ${selectedCount} selected media.` : "."}</DialogDescription></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label htmlFor="album-name">Album name</Label><Input id="album-name" value={values.name} onChange={(event) => { setValues((current) => ({ ...current, name: event.target.value })); setError(null) }} aria-invalid={Boolean(error)} /></div><div className="space-y-2"><Label htmlFor="album-description">Description</Label><Textarea id="album-description" value={values.description} maxLength={300} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="album-status">Publication status</Label><Select<GalleryAlbumStatus> value={values.status} items={statuses} onValueChange={(value) => value !== null && setValues((current) => ({ ...current, status: value, enablePublicGallery: value === "published" ? current.enablePublicGallery : false }))}><SelectTrigger id="album-status" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectContent></Select></div><div className="flex items-start justify-between gap-4"><div><Label htmlFor="album-public">Enable public gallery</Label><p className="mt-1 text-sm text-muted-foreground">Available only for published albums.</p></div><Switch id="album-public" checked={values.enablePublicGallery} disabled={values.status !== "published"} onCheckedChange={(checked) => setValues((current) => ({ ...current, enablePublicGallery: checked }))} /></div>{error && <p className="text-sm text-destructive">{error}</p>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Create Album</Button></DialogFooter></form></DialogContent></Dialog>
}
