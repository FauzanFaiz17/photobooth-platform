import type {
  GalleryAlbum,
  GalleryFilters,
  GalleryMedia,
  GalleryPaginationState,
} from "../types/gallery.types"

export const filterGalleryMedia = (
  items: ReadonlyArray<GalleryMedia>,
  albums: ReadonlyArray<GalleryAlbum>,
  filters: GalleryFilters
): GalleryMedia[] => {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase("id-ID")

  return items.filter((item) => {
    const albumNames = item.albumIds
      .map((albumId) => albums.find((album) => album.id === albumId)?.name ?? "")
      .join(" ")
      .toLocaleLowerCase("id-ID")
    const searchableText = [
      item.fileName,
      item.customerName,
      item.sessionId,
      albumNames,
    ]
      .join(" ")
      .toLocaleLowerCase("id-ID")

    if (normalizedQuery && !searchableText.includes(normalizedQuery)) return false
    if (filters.mediaType !== "all" && item.type !== filters.mediaType) return false
    if (
      filters.publicationStatus !== "all" &&
      item.publicationStatus !== filters.publicationStatus
    ) {
      return false
    }
    if (
      filters.downloadStatus !== "all" &&
      item.downloadStatus !== filters.downloadStatus
    ) {
      return false
    }
    if (filters.albumId !== "all" && !item.albumIds.includes(filters.albumId)) {
      return false
    }

    const createdDate = item.createdAt.slice(0, 10)
    if (filters.dateFrom && createdDate < filters.dateFrom) return false
    if (filters.dateTo && createdDate > filters.dateTo) return false
    return true
  })
}

export const sortGalleryMedia = (
  items: ReadonlyArray<GalleryMedia>,
  sort: GalleryFilters["sort"]
): GalleryMedia[] => {
  const sortedItems = [...items]
  switch (sort) {
    case "newest":
      return sortedItems.sort((first, second) =>
        second.createdAt.localeCompare(first.createdAt)
      )
    case "oldest":
      return sortedItems.sort((first, second) =>
        first.createdAt.localeCompare(second.createdAt)
      )
    case "name-asc":
      return sortedItems.sort((first, second) =>
        first.fileName.localeCompare(second.fileName)
      )
    case "name-desc":
      return sortedItems.sort((first, second) =>
        second.fileName.localeCompare(first.fileName)
      )
    case "largest":
      return sortedItems.sort(
        (first, second) => second.fileSizeBytes - first.fileSizeBytes
      )
    case "most-downloaded":
      return sortedItems.sort(
        (first, second) => second.downloadCount - first.downloadCount
      )
  }
}

export const paginateGalleryMedia = (
  items: ReadonlyArray<GalleryMedia>,
  pagination: GalleryPaginationState
): GalleryMedia[] => {
  const startIndex = (pagination.page - 1) * pagination.pageSize
  return items.slice(startIndex, startIndex + pagination.pageSize)
}

export const getTotalPages = (
  totalItems: number,
  pageSize: GalleryPaginationState["pageSize"]
): number => Math.max(1, Math.ceil(totalItems / pageSize))

export const countActiveFilters = (filters: GalleryFilters): number => {
  let count = filters.query.trim() ? 1 : 0
  if (filters.mediaType !== "all") count += 1
  if (filters.publicationStatus !== "all") count += 1
  if (filters.downloadStatus !== "all") count += 1
  if (filters.albumId !== "all") count += 1
  if (filters.dateFrom) count += 1
  if (filters.dateTo) count += 1
  return count
}
