import { Search, X } from "lucide-react"
import type { ReactElement } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { GalleryAlbum, GalleryFilters, GalleryMediaType, GalleryPublicationStatus, GalleryDownloadStatus, GallerySortOption } from "../types/gallery.types"
import { countActiveFilters } from "../utils/gallery-filters"

interface GalleryFilterBarProps {
  readonly filters: GalleryFilters
  readonly albums: ReadonlyArray<GalleryAlbum>
  readonly onChange: (filters: GalleryFilters) => void
  readonly onClear: () => void
}

const mediaTypes = [{ value: "all", label: "All types" }, { value: "photo", label: "Photos" }, { value: "gif", label: "GIFs" }, { value: "video", label: "Videos" }] satisfies ReadonlyArray<{ value: GalleryMediaType | "all"; label: string }>
const publicationStatuses = [{ value: "all", label: "All publication" }, { value: "published", label: "Published" }, { value: "private", label: "Private" }, { value: "archived", label: "Archived" }] satisfies ReadonlyArray<{ value: GalleryPublicationStatus | "all"; label: string }>
const downloadStatuses = [{ value: "all", label: "All downloads" }, { value: "downloaded", label: "Downloaded" }, { value: "not-downloaded", label: "Not downloaded" }] satisfies ReadonlyArray<{ value: GalleryDownloadStatus | "all"; label: string }>
const sortOptions = [{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }, { value: "name-asc", label: "Name A–Z" }, { value: "name-desc", label: "Name Z–A" }, { value: "largest", label: "Largest files" }, { value: "most-downloaded", label: "Most downloaded" }] satisfies ReadonlyArray<{ value: GallerySortOption; label: string }>

export function GalleryFilterBar({ filters, albums, onChange, onClear }: GalleryFilterBarProps): ReactElement {
  const activeCount = countActiveFilters(filters)
  return (
    <section aria-label="Gallery filters" className="space-y-3 border-y border-border py-4">
      <div className="flex flex-col gap-3 xl:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Label htmlFor="gallery-search" className="sr-only">Search gallery</Label>
          <Input id="gallery-search" className="pl-8" placeholder="Search file, customer, session, or album" value={filters.query} onChange={(event) => onChange({ ...filters, query: event.target.value })} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:flex">
          <Select<GalleryMediaType | "all"> value={filters.mediaType} items={mediaTypes} onValueChange={(value) => value !== null && onChange({ ...filters, mediaType: value })}><SelectTrigger aria-label="Filter media type" className="w-full xl:w-36"><SelectValue /></SelectTrigger><SelectContent>{mediaTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
          <Select<GalleryPublicationStatus | "all"> value={filters.publicationStatus} items={publicationStatuses} onValueChange={(value) => value !== null && onChange({ ...filters, publicationStatus: value })}><SelectTrigger aria-label="Filter publication status" className="w-full xl:w-40"><SelectValue /></SelectTrigger><SelectContent>{publicationStatuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
          <Select<GalleryDownloadStatus | "all"> value={filters.downloadStatus} items={downloadStatuses} onValueChange={(value) => value !== null && onChange({ ...filters, downloadStatus: value })}><SelectTrigger aria-label="Filter download status" className="w-full xl:w-40"><SelectValue /></SelectTrigger><SelectContent>{downloadStatuses.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
          <Select<string> value={filters.albumId} onValueChange={(value) => value !== null && onChange({ ...filters, albumId: value })}><SelectTrigger aria-label="Filter album" className="w-full xl:w-40"><SelectValue placeholder="All albums" /></SelectTrigger><SelectContent><SelectItem value="all">All albums</SelectItem>{albums.map((album) => <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>)}</SelectContent></Select>
          <Select<GallerySortOption> value={filters.sort} items={sortOptions} onValueChange={(value) => value !== null && onChange({ ...filters, sort: value })}><SelectTrigger aria-label="Sort gallery" className="w-full xl:w-40"><SelectValue /></SelectTrigger><SelectContent>{sortOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><Label htmlFor="gallery-date-from" className="text-xs">From</Label><Input id="gallery-date-from" type="date" value={filters.dateFrom ?? ""} onChange={(event) => onChange({ ...filters, dateFrom: event.target.value || null })} /></div>
        <div className="space-y-1"><Label htmlFor="gallery-date-to" className="text-xs">To</Label><Input id="gallery-date-to" type="date" value={filters.dateTo ?? ""} onChange={(event) => onChange({ ...filters, dateTo: event.target.value || null })} /></div>
        {activeCount > 0 && <Badge variant="secondary">{activeCount} active filters</Badge>}
        <Button variant="ghost" size="sm" onClick={onClear} disabled={activeCount === 0}><X aria-hidden="true" /> Clear Filters</Button>
      </div>
    </section>
  )
}
