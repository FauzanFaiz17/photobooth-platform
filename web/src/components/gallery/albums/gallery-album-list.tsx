import { Archive, Ellipsis, FolderOpen, Globe2, Link2, Lock } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GalleryPublicationBadge } from "../shared/gallery-status-badge"
import type { GalleryAlbum, GalleryAlbumStatus } from "../types/gallery.types"
import { formatDate, formatMediaCount } from "../utils/gallery-formatters"

interface GalleryAlbumListProps {
  readonly albums: ReadonlyArray<GalleryAlbum>
  readonly onShare: (album: GalleryAlbum) => void
  readonly onPublicationChange: (albumId: string, status: GalleryAlbumStatus) => void
}

export function GalleryAlbumList({
  albums,
  onShare,
  onPublicationChange,
}: GalleryAlbumListProps): ReactElement {
  if (albums.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center border-y border-border text-sm text-muted-foreground">
        No albums yet.
      </div>
    )
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {albums.map((album) => (
        <li key={album.id}>
          <Card className="shadow-none">
            <CardContent>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FolderOpen className="size-5 text-foreground" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">{album.name}</h2>
                    <GalleryPublicationBadge status={album.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{album.description}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {formatMediaCount(album.mediaIds.length)} media · Created {formatDate(album.createdAt)} ·{" "}
                    {album.publicSlug ? "Public link active" : "Public gallery disabled"}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${album.name}`}
                      />
                    }
                  >
                    <Ellipsis aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={!album.publicSlug} onClick={() => onShare(album)}>
                      <Link2 aria-hidden="true" /> Share album
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onPublicationChange(album.id, "published")}>
                      <Globe2 aria-hidden="true" /> Publish
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPublicationChange(album.id, "private")}>
                      <Lock aria-hidden="true" /> Make private
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPublicationChange(album.id, "archived")}>
                      <Archive aria-hidden="true" /> Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
