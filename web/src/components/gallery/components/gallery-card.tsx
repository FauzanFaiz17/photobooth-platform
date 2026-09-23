import type { GalleryRecord } from "@/features/galleries/gallery.types";
import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { expiryState, formatDate, galleryPath, galleryToken, mediaSummary } from "../utils";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GalleryCover } from "./gallery-cover";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryDetailDialog } from "../gallery-detail-dialog";

export function GalleryCard({
  gallery,
}: {
  readonly gallery: GalleryRecord;
}): ReactElement {
  const navigate = useNavigate();
  const expiry = expiryState(gallery.expires_at);
  const path = gallery.gallery_url ? galleryPath(gallery.gallery_url) : null;
  const token = galleryToken(gallery.gallery_url);
  const [detailOpen, setDetailOpen] = useState(false);

  async function copyLink() {
    if (!gallery.gallery_url) return;
    try {
      await navigator.clipboard.writeText(gallery.gallery_url);
      toast.success("Link gallery disalin.");
    } catch {
      toast.error("Link gagal disalin. Salin manual dari kolom link.");
    }
  }

  return (
    <Card className="overflow-hidden pt-0">
      <GalleryCover gallery={gallery} />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">
              {gallery.customer?.name || `Sesi #${gallery.id}`}
            </CardTitle>
            <CardDescription className="mt-1 truncate">
              {gallery.customer?.email ||
                gallery.customer?.phone ||
                "Tanpa data customer"}
            </CardDescription>
          </div>
          <Badge variant={expiry.expired ? "destructive" : "secondary"}>
            {expiry.expired ? "Kedaluwarsa" : "Aktif"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Media</dt>
            <dd className="mt-1 font-medium">{gallery.media.length}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Selesai</dt>
            <dd className="mt-1 font-medium">
              {formatDate(gallery.completed_at)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Rincian</dt>
            <dd className="mt-1 font-medium">{mediaSummary(gallery.media)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Masa berlaku</dt>
            <dd className="mt-1 font-medium">{expiry.label}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">Link gallery</dt>
            <dd
              className="mt-1 truncate font-medium"
              title={gallery.gallery_url ?? undefined}
            >
              {gallery.gallery_url || "Belum dibuat"}
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!gallery.gallery_url}
          onClick={() => void copyLink()}
        >
          <Copy aria-hidden="true" /> Salin link
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!token || gallery.media.length === 0}
          onClick={() => setDetailOpen(true)}
        >
          <Images aria-hidden="true" /> Lihat media
        </Button>
        <Button
          size="sm"
          disabled={!path}
          onClick={() => path && navigate(path)}
        >
          <ExternalLink aria-hidden="true" /> Buka Gallery
        </Button>
      </CardFooter>

      {detailOpen && (
        <GalleryDetailDialog
          gallery={gallery}
          galleryToken={token}
          open
          onOpenChange={setDetailOpen}
        />
      )}
    </Card>
  );
}
