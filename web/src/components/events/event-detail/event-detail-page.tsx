import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { EventDeleteDialog } from "@/components/events/event-delete/event-delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { formatDate, formatPrice, parseId } from "../utils";
import { useEventDetail } from "../hooks/use-event-detail";
import { statusLabels } from "@/features/events/event.constants";
import { DetailItem } from "./detail-item";
import { ConfigurationItems } from "./configuration-item";




export function EventDetailPage() {
  const eventId = parseId(useParams<{ eventId: string }>().eventId);
  const { event, loadState, errorMessage, handleUnauthorized, handleForbidden, handleRetry } = useEventDetail(eventId);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const navigate = useNavigate()


  if (eventId === null)
    return <div className="p-6">Alamat Event tidak valid.</div>;

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      {loadState === "loading" && (
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-16 w-80" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      )}
      {loadState === "not-found" && (
        <Card>
          <CardContent className="grid min-h-72 place-items-center text-center">
            <div>
              <CalendarDays className="mx-auto size-10 text-muted-foreground" />
              <h1 className="mt-4 text-xl font-semibold">
                Event tidak ditemukan
              </h1>
              <Button
                className="mt-5"
                variant="outline"
                render={<Link to="/admin/events" />}
              >
                <ArrowLeft aria-hidden="true" /> Daftar Event
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {loadState === "error" && (
        <Card>
          <CardContent className="grid min-h-72 place-items-center text-center">
            <div>
              <CircleAlert className="mx-auto size-10 text-destructive" />
              <h1 className="mt-4 text-xl font-semibold">
                Detail Event gagal dimuat
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <Button
                className="mt-5"
                onClick={() => handleRetry()}
              >
                <RefreshCw aria-hidden="true" /> Coba lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loadState === "success" && event && (
        <>
          <header className="space-y-5">
            <Button
              variant="ghost"
              className="-ml-2"
              render={<Link to="/admin/events" />}
            >
              <ArrowLeft aria-hidden="true" /> Daftar Event
            </Button>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-muted-foreground">
                  {event.event_code}
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                  {event.event_name}
                </h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  render={<Link to={`/admin/events/${event.id}/edit`} />}
                >
                  <Pencil aria-hidden="true" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 aria-hidden="true" /> Hapus
                </Button>
              </div>
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Jadwal Event</CardTitle>
                    <CardDescription>
                      Waktu pelaksanaan dan status.
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      event.status === "cancelled"
                        ? "destructive"
                        : event.status === "completed"
                          ? "secondary"
                          : "default"
                    }
                  >
                    {statusLabels[event.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <DetailItem label="Tanggal">
                    {formatDate(event.event_date)}
                  </DetailItem>
                  <DetailItem label="Waktu">
                    {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}
                  </DetailItem>
                  <DetailItem label="Harga">
                    {formatPrice(event.price)}
                  </DetailItem>
                  <DetailItem label="Batas cetak">
                    {event.print_count_limit === 0
                      ? "Tanpa batas"
                      : `${event.print_count_limit} cetak`}
                  </DetailItem>
                </dl>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Booth dan Partner</CardTitle>
                <CardDescription>
                  Lokasi Event serta pembuatnya.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-5 sm:grid-cols-2">
                  <DetailItem label="Booth">{event.booth.name}</DetailItem>
                  <DetailItem label="Lokasi">
                    {event.booth.location || "—"}
                  </DetailItem>
                  <DetailItem label="Partner">
                    {event.partner.brand_name || event.partner.company_name}
                  </DetailItem>
                  <DetailItem label="Dibuat oleh">
                    {event.created_by.name}
                  </DetailItem>
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Snapshot konfigurasi</CardTitle>
              <CardDescription>
                Konfigurasi disalin ketika Event dibuat sehingga perubahan
                profile tidak mengubah Event ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-medium">Frame tersedia</h3>
                <ConfigurationItems
                  items={(
                    event.configuration.templates ?? [
                      event.configuration.template,
                    ]
                  ).map((template) => ({
                    name: template.name,
                    detail: `Versi ${template.version}`,
                  }))}
                />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-medium">Filter tersedia</h3>
                <ConfigurationItems
                  items={(
                    event.configuration.filters ?? [event.configuration.filter]
                  ).map((filter) => ({
                    name: filter.name,
                    detail: `Intensitas ${filter.intensity}% · Versi ${filter.version}`,
                  }))}
                />
              </div>
              <dl className="grid gap-5 sm:grid-cols-2 lg:col-span-2">
                <DetailItem label="Camera">
                  Profile #{event.configuration.camera.camera_profile_id} · ISO{" "}
                  {event.configuration.camera.iso || "—"} ·{" "}
                  {event.configuration.camera.burst_count} foto
                </DetailItem>
                <DetailItem label="Printer">
                  {event.configuration.printer.printer_name} ·{" "}
                  {event.configuration.printer.copies} salinan ·{" "}
                  {event.configuration.printer.paper_size}
                </DetailItem>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paket cetak</CardTitle>
              <CardDescription>
                Pilihan jumlah dan harga cetak yang tersedia untuk Event ini.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(event.configuration.print_options ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Event ini belum memiliki paket cetak.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {(event.configuration.print_options ?? []).map((option) => (
                    <div key={option.id} className="rounded-md border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">
                          {option.paper_size.toUpperCase()}
                        </p>
                        <Badge
                          variant={option.is_active ? "default" : "secondary"}
                        >
                          {option.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <p className="mt-3 text-lg font-semibold">
                        {formatPrice(option.price)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {option.unit_quantity} cetak dasar · tambah per{" "}
                        {option.quantity_step}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {deleteOpen && (
            <EventDeleteDialog
              event={event}
              open
              onOpenChange={setDeleteOpen}
              onDeleted={() => {
                toast.success(`Event ${event.event_name} dihapus.`);
                navigate("/admin/events", { replace: true });
              }}
              onUnauthorized={() => void handleUnauthorized()}
              onForbidden={handleForbidden}
            />
          )}
        </>
      )}
      <Toaster position="top-right" />
    </div>
  );
}
