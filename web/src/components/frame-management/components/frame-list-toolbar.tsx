import { RotateCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPLATE_STATUSES, type TemplateStatus } from "@/features/templates/template.types";
import { statusLabels } from "@/constants";

export type FrameStatusFilter = TemplateStatus | "all";

const SEARCH_DEBOUNCE_MS = 400;

interface FrameListToolbarProps {
  readonly initialSearch: string;
  readonly status: FrameStatusFilter;
  readonly canReset: boolean;
  readonly onSearchChange: (value: string) => void;
  readonly onStatusChange: (value: FrameStatusFilter) => void;
  readonly onReset: () => void;
}

export function FrameListToolbar({
  initialSearch,
  status,
  canReset,
  onSearchChange,
  onStatusChange,
  onReset,
}: FrameListToolbarProps) {
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    const normalizedSearch = search.trim();
    if (normalizedSearch === initialSearch) return;

    const timeoutId = window.setTimeout(() => {
      onSearchChange(normalizedSearch);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [initialSearch, onSearchChange, search]);

  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_12rem_auto]">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-9 pl-9"
          placeholder="Nama Frame"
          aria-label="Cari frame berdasarkan nama"
        />
      </div>

      <Select<FrameStatusFilter>
        value={status}
        onValueChange={(value) => {
          if (value !== null) onStatusChange(value);
        }}
      >
        <SelectTrigger className="h-9 w-full" aria-label="Filter status frame">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua status</SelectItem>
          {TEMPLATE_STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {statusLabels[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        disabled={!canReset}
        onClick={onReset}
      >
        <RotateCcw aria-hidden="true" />
        Reset
      </Button>
    </div>
  );
}
