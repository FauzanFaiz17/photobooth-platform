import { Copy, Download, QrCode, Unlink } from "lucide-react"
import { useState, type ReactElement } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { GalleryPublicationStatus } from "../types/gallery.types"
import { copyGalleryLink } from "../utils/gallery-formatters"

interface GalleryShareDialogProps {
  readonly title: string
  readonly slug: string | null
  readonly status: GalleryPublicationStatus
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onDisablePublicAccess: () => void
}

export function GalleryShareDialog({
  title,
  slug,
  status,
  open,
  onOpenChange,
  onDisablePublicAccess,
}: GalleryShareDialogProps): ReactElement {
  const [showQr, setShowQr] = useState(false)
  const publicLink = slug ? `https://gallery.photobooth.local/${slug}` : ""
  const sharingEnabled = status === "published" && slug !== null

  const handleCopy = async (): Promise<void> => {
    const copied = await copyGalleryLink(publicLink)
    if (copied) toast.success("Public link copied")
    else toast.error("Clipboard unavailable", { description: "Copy the link manually from the field." })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next) setShowQr(false); onOpenChange(next) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {title}</DialogTitle>
          <DialogDescription>Manage the public link and QR sharing placeholder.</DialogDescription>
        </DialogHeader>
        {!sharingEnabled ? (
          <Alert>
            <AlertTitle>Public gallery disabled</AlertTitle>
            <AlertDescription>Publish this media or album before enabling public sharing.</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex gap-2">
              <Input readOnly value={publicLink} aria-label="Public gallery link" />
              <Button variant="outline" size="icon" aria-label="Copy public link" onClick={handleCopy}>
                <Copy aria-hidden="true" />
              </Button>
            </div>
            <Separator />
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-36 items-center justify-center border border-border bg-muted" aria-label="QR code placeholder">
                <QrCode className="size-20 text-foreground" aria-hidden="true" />
              </div>
              {showQr ? (
                <p className="text-sm text-muted-foreground">QR placeholder generated for the public link.</p>
              ) : (
                <Button variant="outline" onClick={() => setShowQr(true)}>
                  <QrCode aria-hidden="true" /> Generate QR
                </Button>
              )}
            </div>
          </>
        )}
        <DialogFooter>
          {sharingEnabled && (
            <Button variant="outline" onClick={onDisablePublicAccess}>
              <Unlink aria-hidden="true" /> Disable public access
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button disabled={!showQr} onClick={() => toast.info("QR download unavailable", { description: "Connect a QR generator to download a real code." })}>
            <Download aria-hidden="true" /> Download QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
