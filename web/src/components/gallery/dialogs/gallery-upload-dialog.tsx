import { useState, type FormEvent, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GalleryMediaType, GalleryUploadFormValues } from "../types/gallery.types"

const initialUpload: GalleryUploadFormValues = { fileName: "", customerName: "", mediaType: "photo" }
const types = [{ value: "photo", label: "Photo" }, { value: "gif", label: "GIF" }, { value: "video", label: "Video" }] satisfies ReadonlyArray<{ value: GalleryMediaType; label: string }>

export function GalleryUploadDialog({ open, onOpenChange, onUpload }: { readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onUpload: (values: GalleryUploadFormValues) => void }): ReactElement {
  const [values, setValues] = useState<GalleryUploadFormValues>(initialUpload); const [error, setError] = useState<string | null>(null)
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => { event.preventDefault(); if (values.fileName.trim().length < 3 || values.customerName.trim().length < 2) { setError("File name dan customer wajib diisi."); return } onUpload({ ...values, fileName: values.fileName.trim(), customerName: values.customerName.trim() }); onOpenChange(false) }
  return <Dialog open={open} onOpenChange={(next) => { if (next) { setValues(initialUpload); setError(null) } onOpenChange(next) }}><DialogContent><form onSubmit={handleSubmit}><DialogHeader><DialogTitle>Upload dummy media</DialogTitle><DialogDescription>Add a local dummy record without sending a file to a server.</DialogDescription></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label htmlFor="upload-file-name">File name</Label><Input id="upload-file-name" placeholder="studio-session-016.jpg" value={values.fileName} onChange={(event) => { setValues((current) => ({ ...current, fileName: event.target.value })); setError(null) }} /></div><div className="space-y-2"><Label htmlFor="upload-customer">Customer</Label><Input id="upload-customer" value={values.customerName} onChange={(event) => setValues((current) => ({ ...current, customerName: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="upload-type">Media type</Label><Select<GalleryMediaType> value={values.mediaType} items={types} onValueChange={(value) => value !== null && setValues((current) => ({ ...current, mediaType: value }))}><SelectTrigger id="upload-type" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{types.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent></Select></div>{error && <p className="text-sm text-destructive">{error}</p>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Add Dummy Media</Button></DialogFooter></form></DialogContent></Dialog>
}
