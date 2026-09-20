import { Search } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BoothRecord } from "@/features/booths/booth.types";
import { statusLabels } from "@/features/events/event.constants";

export function EventFilterBar({
  querySearch,
  status,
  boothId,
  dateFrom,
  dateTo,
  filtered,
  booths,
  onSubmitSearch,
  onUpdateQuery,
  onReset,
}: {
  readonly querySearch: string;
  readonly status: string;
  readonly boothId: number;
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly filtered: boolean;
  readonly booths: ReadonlyArray<BoothRecord>;
  readonly onSubmitSearch: (event: FormEvent<HTMLFormElement>) => void;
  readonly onUpdateQuery: (updates: Readonly<Record<string, string | null>>) => void;
  readonly onReset: () => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_repeat(4,minmax(9rem,auto))_auto]">
      <form key={querySearch} className="flex gap-2" onSubmit={onSubmitSearch}>
        <Label className="sr-only" htmlFor="event-search">
          Cari Event
        </Label>
        <Input
          id="event-search"
          name="search"
          defaultValue={querySearch}
          placeholder="Nama atau kode Event"
        />
        <Button type="submit" variant="outline" size="icon" aria-label="Cari">
          <Search aria-hidden="true" />
        </Button>
      </form>
      <Select<string>
        value={status}
        onValueChange={(value) =>
          value !== null &&
          onUpdateQuery({ status: value === "all" ? null : value, page: null })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua status</SelectItem>
          {Object.entries(statusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select<string>
        value={boothId ? String(boothId) : "all"}
        onValueChange={(value) =>
          value !== null &&
          onUpdateQuery({ booth_id: value === "all" ? null : value, page: null })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Booth</SelectItem>
          {booths.map((booth) => (
            <SelectItem key={booth.id} value={String(booth.id)}>
              {booth.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        aria-label="Tanggal mulai"
        value={dateFrom}
        max={dateTo || undefined}
        onChange={(event) =>
          onUpdateQuery({
            date_from: event.target.value || null,
            date_to:
              dateTo && event.target.value > dateTo ? null : dateTo || null,
            page: null,
          })
        }
      />
      <Input
        type="date"
        aria-label="Tanggal akhir"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={(event) =>
          onUpdateQuery({ date_to: event.target.value || null, page: null })
        }
      />
      <Button
        variant="ghost"
        disabled={!filtered}
        onClick={onReset}
      >
        Reset
      </Button>
    </div>
  );
}
