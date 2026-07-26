import { useState } from "react"

export interface GallerySelection {
  readonly selectedIds: ReadonlySet<string>
  readonly selectedCount: number
  readonly toggleOne: (id: string, selected: boolean) => void
  readonly selectVisible: (ids: ReadonlyArray<string>) => void
  readonly clearSelection: () => void
  readonly removeSelectedIds: (ids: ReadonlyArray<string>) => void
  readonly isAllVisibleSelected: (ids: ReadonlyArray<string>) => boolean
  readonly isSomeVisibleSelected: (ids: ReadonlyArray<string>) => boolean
}

export function useGallerySelection(): GallerySelection {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set<string>()
  )

  const toggleOne = (id: string, selected: boolean): void => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const selectVisible = (ids: ReadonlyArray<string>): void => {
    setSelectedIds((current) => new Set([...current, ...ids]))
  }

  const clearSelection = (): void => setSelectedIds(new Set<string>())

  const removeSelectedIds = (ids: ReadonlyArray<string>): void => {
    const removedIds = new Set(ids)
    setSelectedIds((current) =>
      new Set([...current].filter((id) => !removedIds.has(id)))
    )
  }

  const isAllVisibleSelected = (ids: ReadonlyArray<string>): boolean =>
    ids.length > 0 && ids.every((id) => selectedIds.has(id))

  const isSomeVisibleSelected = (ids: ReadonlyArray<string>): boolean =>
    ids.some((id) => selectedIds.has(id)) && !isAllVisibleSelected(ids)

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleOne,
    selectVisible,
    clearSelection,
    removeSelectedIds,
    isAllVisibleSelected,
    isSomeVisibleSelected,
  }
}
