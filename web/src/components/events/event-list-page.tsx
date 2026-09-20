import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEventList } from "./hooks/use-event-list";
import { EventFilterBar } from "./components/event-filter-bar";
import {
  EventListLoading,
  EventListError,
  EventListEmpty,
} from "./components/event-list-states";
import { EventTableRow } from "./components/event-table-row";
import { EventPagination } from "./components/event-pagination";

export function EventListPage() {
  const {
    response,
    booths,
    loadState,
    errorMessage,
    filtered,
    querySearch,
    status,
    boothId,
    dateFrom,
    dateTo,
    updateQuery,
    submitSearch,
    setRetryKey,
    setSearchParams,
  } = useEventList();

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola jadwal dan konfigurasi Event setiap Booth.
          </p>
        </div>
        <Button render={<Link to="/admin/events/create" />}>
          <Plus aria-hidden="true" /> Tambah Event
        </Button>
      </header>

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Daftar Event</CardTitle>
            <CardDescription>
              Pencarian dan filter diproses oleh backend.
            </CardDescription>
          </div>
          <EventFilterBar
            querySearch={querySearch}
            status={status}
            boothId={boothId}
            dateFrom={dateFrom}
            dateTo={dateTo}
            filtered={filtered}
            booths={booths}
            onSubmitSearch={submitSearch}
            onUpdateQuery={updateQuery}
            onReset={() =>
              setSearchParams(new URLSearchParams(), { replace: true })
            }
          />
        </CardHeader>

        <CardContent className="px-0">
          {loadState === "loading" && <EventListLoading />}
          {loadState === "error" && (
            <EventListError
              errorMessage={errorMessage}
              onRetry={() => setRetryKey((value) => value + 1)}
            />
          )}
          {loadState === "success" &&
            response &&
            response.data.length === 0 && <EventListEmpty filtered={filtered} />}
          {loadState === "success" && response && response.data.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Jadwal</TableHead>
                      <TableHead>Booth</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {response.data.map((event) => (
                      <EventTableRow key={event.id} event={event} />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <EventPagination
                meta={response.meta}
                onUpdateQuery={updateQuery}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
