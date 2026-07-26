import { Archive, CheckCircle2, Copy, Edit3, Ellipsis, Eye, MonitorCheck, Trash2 } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { PhotoFrame } from "../types/frame-photo.types"

export interface FramePhotoActions {
  readonly onPreview: (frame: PhotoFrame) => void
  readonly onEdit: (frame: PhotoFrame) => void
  readonly onDuplicate: (frame: PhotoFrame) => void
  readonly onAssign: (frame: PhotoFrame) => void
  readonly onActivate: (frame: PhotoFrame) => void
  readonly onArchive: (frame: PhotoFrame) => void
  readonly onDelete: (frame: PhotoFrame) => void
}

export function FramePhotoActionMenu({ frame, actions }: { readonly frame: PhotoFrame; readonly actions: FramePhotoActions }): ReactElement {
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${frame.name}`} />}><Ellipsis aria-hidden="true" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => actions.onPreview(frame)}><Eye aria-hidden="true" /> Preview</DropdownMenuItem><DropdownMenuItem onClick={() => actions.onEdit(frame)}><Edit3 aria-hidden="true" /> Edit</DropdownMenuItem><DropdownMenuItem onClick={() => actions.onDuplicate(frame)}><Copy aria-hidden="true" /> Duplicate</DropdownMenuItem><DropdownMenuItem onClick={() => actions.onAssign(frame)}><MonitorCheck aria-hidden="true" /> Assign to Kiosk</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem disabled={frame.status === "active"} onClick={() => actions.onActivate(frame)}><CheckCircle2 aria-hidden="true" /> Set as Active</DropdownMenuItem><DropdownMenuItem disabled={frame.status === "archived"} onClick={() => actions.onArchive(frame)}><Archive aria-hidden="true" /> Archive</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => actions.onDelete(frame)}><Trash2 aria-hidden="true" /> Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
}

