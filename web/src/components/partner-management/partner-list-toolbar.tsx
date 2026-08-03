import { ArrowDown, ArrowUp, RotateCcw, Search } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  PartnerSortField,
  PartnerStatus,
  SortDirection,
} from "@/features/partners/partner.types"

export type PartnerStatusFilter = PartnerStatus | "all"

const SEARCH_DEBOUNCE_MS = 400

interface PartnerListToolbarProps {
  readonly initialSearch: string
  readonly status: PartnerStatusFilter
  readonly sort: PartnerSortField
  readonly direction: SortDirection
  readonly canReset: boolean
  readonly onSearchChange: (value: string) => void
  readonly onStatusChange: (value: PartnerStatusFilter) => void
  readonly onSortChange: (value: PartnerSortField) => void
  readonly onDirectionChange: (value: SortDirection) => void
  readonly onReset: () => void
}

export function PartnerListToolbar({
  initialSearch,
  status,
  sort,
  direction,
  canReset,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onDirectionChange,
  onReset,
}: PartnerListToolbarProps) {
  const [search, setSearch] = useState(initialSearch)
  const directionLabel =
    direction === "asc" ? "Urutan menaik" : "Urutan menurun"

  useEffect(() => {
    const normalizedSearch = search.trim()
    if (normalizedSearch === initialSearch) return

    const timeoutId = window.setTimeout(() => {
      onSearchChange(normalizedSearch)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [initialSearch, onSearchChange, search])

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_13rem_auto_auto]">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-9 pl-9"
          placeholder="Cari nama perusahaan atau brand"
          aria-label="Cari partner berdasarkan nama perusahaan atau brand"
        />
      </div>

      <Select<PartnerStatusFilter>
        value={status}
        onValueChange={(value) => {
          if (value !== null) onStatusChange(value)
        }}
      >
        <SelectTrigger
          className="h-9 w-full"
          aria-label="Filter status partner"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
          <SelectItem value="trial">Trial</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      <Select<PartnerSortField>
        value={sort}
        onValueChange={(value) => {
          if (value !== null) onSortChange(value)
        }}
      >
        <SelectTrigger
          className="h-9 w-full"
          aria-label="Urutkan daftar partner"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="company_name">Nama perusahaan</SelectItem>
          <SelectItem value="created_at">Tanggal dibuat</SelectItem>
          <SelectItem value="id">ID</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon-lg"
        aria-label={directionLabel}
        title={directionLabel}
        onClick={() =>
          onDirectionChange(direction === "asc" ? "desc" : "asc")
        }
      >
        {direction === "asc" ? (
          <ArrowUp aria-hidden="true" />
        ) : (
          <ArrowDown aria-hidden="true" />
        )}
      </Button>

      <Button
        variant="ghost"
        className="justify-self-start lg:justify-self-end"
        disabled={!canReset && search.trim().length === 0}
        onClick={() => {
          setSearch("")
          onReset()
        }}
      >
        <RotateCcw aria-hidden="true" />
        Reset
      </Button>
    </div>
  )
}
