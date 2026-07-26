import { WandSparkles } from "lucide-react"
import { useState, type ChangeEvent, type FormEvent, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { framePhotoKiosks } from "../data/frame-photo-data"
import type { PhotoFrame, PhotoFrameCategory, PhotoFrameFormValues, PhotoFrameLayout, PhotoFrameOrientation, PhotoFrameStatus, PhotoFrameUnit } from "../types/frame-photo.types"
import { createFrameFormValues } from "../utils/frame-photo-state"
import { generateFrameCode, getCategoryLabel, getLayoutLabel, getOrientationLabel, getStatusLabel, validateFrameFile } from "../utils/frame-photo-utils"

const categories = ["classic", "minimal", "wedding", "graduation", "birthday", "corporate", "seasonal"] satisfies ReadonlyArray<PhotoFrameCategory>
const layouts = ["single_photo", "vertical_strip", "horizontal_strip", "two_photo", "three_photo", "four_photo_grid", "postcard", "custom"] satisfies ReadonlyArray<PhotoFrameLayout>
const orientations = ["portrait", "landscape", "square"] satisfies ReadonlyArray<PhotoFrameOrientation>
const units = ["px", "mm", "inch"] satisfies ReadonlyArray<PhotoFrameUnit>
const statuses = ["active", "draft", "archived"] satisfies ReadonlyArray<PhotoFrameStatus>

type AssetField = "previewFile" | "overlayFile" | "backgroundFile"

export function FramePhotoFormDialog({ frame, existingFrames, open, onOpenChange, onSave }: { readonly frame: PhotoFrame | null; readonly existingFrames: ReadonlyArray<PhotoFrame>; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onSave: (values: PhotoFrameFormValues) => void }): ReactElement {
  const [values, setValues] = useState<PhotoFrameFormValues>(() => createFrameFormValues(frame))
  const [errors, setErrors] = useState<ReadonlyArray<string>>([])

  const setField = <Key extends keyof PhotoFrameFormValues>(key: Key, value: PhotoFrameFormValues[Key]): void => setValues((current) => ({ ...current, [key]: value }))
  const toggleKiosk = (kioskId: string, checked: boolean): void => setValues((current) => ({ ...current, assignedKioskIds: checked ? [...new Set([...current.assignedKioskIds, kioskId])] : current.assignedKioskIds.filter((id) => id !== kioskId) }))

  const handleAsset = (field: AssetField, event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null
    if (!file) return
    const validation = validateFrameFile(file)
    if (!validation.valid) { setErrors([validation.message]); event.target.value = ""; return }
    setField(field, file)
    setErrors([])
  }

  const validate = (): ReadonlyArray<string> => {
    const nextErrors: string[] = []
    const width = Number(values.width)
    const height = Number(values.height)
    const slots = Number(values.photoSlotCount)
    if (!values.name.trim()) nextErrors.push("Frame name is required.")
    if (!values.code.trim()) nextErrors.push("Frame code is required.")
    else if (!/^[A-Z0-9_-]+$/.test(values.code)) nextErrors.push("Frame code may contain uppercase letters, numbers, dashes, and underscores only.")
    else if (existingFrames.some((item) => item.code === values.code && item.id !== frame?.id)) nextErrors.push("Frame code must be unique.")
    if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) nextErrors.push("Width and height must be greater than zero.")
    if (!Number.isInteger(slots) || slots < 1) nextErrors.push("Photo slot count must be at least one.")
    for (const file of [values.previewFile, values.overlayFile, values.backgroundFile]) {
      if (file) { const validation = validateFrameFile(file); if (!validation.valid) nextErrors.push(validation.message) }
    }
    return nextErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const nextErrors = validate()
    if (nextErrors.length > 0) { setErrors(nextErrors); return }
    setErrors([])
    onSave(values)
  }

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[calc(100vh-2rem)] sm:max-w-3xl"><DialogHeader><DialogTitle>{frame ? "Edit Frame" : "Create Frame"}</DialogTitle><DialogDescription>{frame ? `Update ${frame.name} metadata and assignment.` : "Create a local frame configuration for your kiosks."}</DialogDescription></DialogHeader><ScrollArea className="h-[65vh] pr-3"><form id="frame-photo-form" onSubmit={handleSubmit} className="space-y-6"><section aria-labelledby="frame-basic-heading"><h3 id="frame-basic-heading" className="font-semibold text-foreground">Basic information</h3><div className="mt-3 grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="frame-name">Frame name</Label><Input id="frame-name" value={values.name} onChange={(event) => setField("name", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="frame-code">Frame code</Label><div className="flex gap-2"><Input id="frame-code" value={values.code} onChange={(event) => setField("code", event.target.value.toLocaleUpperCase("en-US"))} /><Button type="button" variant="outline" size="icon" aria-label="Generate frame code" onClick={() => setField("code", generateFrameCode(values.name))}><WandSparkles aria-hidden="true" /></Button></div></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="frame-description">Description</Label><Textarea id="frame-description" maxLength={300} value={values.description} onChange={(event) => setField("description", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="frame-category">Category</Label><Select<PhotoFrameCategory> value={values.category} onValueChange={(value) => value !== null && setField("category", value)}><SelectTrigger id="frame-category"><SelectValue /></SelectTrigger><SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{getCategoryLabel(category)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="frame-tags">Tags</Label><Input id="frame-tags" placeholder="clean, wedding, popular" value={values.tags} onChange={(event) => setField("tags", event.target.value)} /></div></div></section><Separator /><section aria-labelledby="frame-layout-heading"><h3 id="frame-layout-heading" className="font-semibold text-foreground">Layout</h3><div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="space-y-2"><Label htmlFor="frame-layout">Layout type</Label><Select<PhotoFrameLayout> value={values.layout} onValueChange={(value) => value !== null && setField("layout", value)}><SelectTrigger id="frame-layout"><SelectValue /></SelectTrigger><SelectContent>{layouts.map((layout) => <SelectItem key={layout} value={layout}>{getLayoutLabel(layout)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="frame-slots">Photo slots</Label><Input id="frame-slots" type="number" min="1" max="12" value={values.photoSlotCount} onChange={(event) => setField("photoSlotCount", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="frame-orientation">Orientation</Label><Select<PhotoFrameOrientation> value={values.orientation} onValueChange={(value) => value !== null && setField("orientation", value)}><SelectTrigger id="frame-orientation"><SelectValue /></SelectTrigger><SelectContent>{orientations.map((orientation) => <SelectItem key={orientation} value={orientation}>{getOrientationLabel(orientation)}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="frame-ratio">Aspect ratio</Label><Input id="frame-ratio" placeholder="2:3" value={values.aspectRatio} onChange={(event) => setField("aspectRatio", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="frame-width">Width</Label><Input id="frame-width" type="number" min="1" value={values.width} onChange={(event) => setField("width", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="frame-height">Height</Label><Input id="frame-height" type="number" min="1" value={values.height} onChange={(event) => setField("height", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="frame-unit">Unit</Label><Select<PhotoFrameUnit> value={values.unit} onValueChange={(value) => value !== null && setField("unit", value)}><SelectTrigger id="frame-unit"><SelectValue /></SelectTrigger><SelectContent>{units.map((unit) => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent></Select></div></div></section><Separator /><section aria-labelledby="frame-assets-heading"><h3 id="frame-assets-heading" className="font-semibold text-foreground">Design assets</h3><p className="mt-1 text-xs text-muted-foreground">PNG or SVG is recommended for transparent overlays. Maximum 10 MB per file.</p><div className="mt-3 grid gap-4 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="frame-preview-file">Preview image</Label><Input id="frame-preview-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleAsset("previewFile", event)} /><p className="text-xs text-muted-foreground">{values.previewFile?.name ?? frame?.previewAsset?.fileName ?? "No preview file"}</p></div><div className="space-y-2"><Label htmlFor="frame-overlay-file">Overlay image</Label><Input id="frame-overlay-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleAsset("overlayFile", event)} /><p className="text-xs text-muted-foreground">{values.overlayFile?.name ?? frame?.overlayAsset?.fileName ?? "No overlay file"}</p></div><div className="space-y-2"><Label htmlFor="frame-background-file">Background image <span className="text-muted-foreground">(optional)</span></Label><Input id="frame-background-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleAsset("backgroundFile", event)} /><p className="text-xs text-muted-foreground">{values.backgroundFile?.name ?? frame?.backgroundAsset?.fileName ?? "No background file"}</p></div></div></section><Separator /><section aria-labelledby="frame-assignment-heading"><h3 id="frame-assignment-heading" className="font-semibold text-foreground">Assignment and status</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{framePhotoKiosks.map((kiosk) => <label key={kiosk.id} className="flex items-start gap-3 border-b border-border py-2"><Checkbox checked={values.assignedKioskIds.includes(kiosk.id)} onCheckedChange={(checked) => toggleKiosk(kiosk.id, checked)} aria-label={`Assign ${kiosk.name}`} /><span><span className="block font-medium text-foreground">{kiosk.name}</span><span className="text-xs text-muted-foreground">{kiosk.location}</span></span></label>)}</div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="frame-default">Default frame</Label><Switch id="frame-default" checked={values.isDefault} onCheckedChange={(checked) => setField("isDefault", checked)} /></div><div className="space-y-2"><Label htmlFor="frame-status">Status</Label><Select<PhotoFrameStatus> value={values.status} onValueChange={(value) => value !== null && setField("status", value)}><SelectTrigger id="frame-status"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{getStatusLabel(status)}</SelectItem>)}</SelectContent></Select></div></div></section>{errors.length > 0 && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert"><p className="font-medium">Please fix the following:</p><ul className="mt-1 list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}</form></ScrollArea><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" form="frame-photo-form">{frame ? "Save Changes" : "Create Frame"}</Button></DialogFooter></DialogContent></Dialog>
}

