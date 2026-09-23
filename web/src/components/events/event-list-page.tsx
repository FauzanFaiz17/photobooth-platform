import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import SectionHeader from "../shared/section-header";

export function EventListPage() {
  const navigate = useNavigate();
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
    updateParams,
    submitSearch,
    setRetryKey,
    setParams,
  } = useEventList();

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <SectionHeader
        heading="Events"
        description="Kelola jadwal dan konfigurasi Event setiap Booth."
        onAction={() => navigate("/admin/events/create")}
        actionLabel={
          <>
            <Plus aria-hidden="true" /> Tambah Event
          </>
        }
      />

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
            onUpdateQuery={updateParams}
            onReset={() =>
              setParams(new URLSearchParams(), { replace: true })
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
            response.data.length === 0 && (
              <EventListEmpty filtered={filtered} />
            )}
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
                onUpdateQuery={updateParams}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
