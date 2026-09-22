import {
  CircleAlert,
  Images,
  RefreshCw,
} from "lucide-react";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import SectionHeader from "../shared/section-header";
import { GalleryCard } from "./components/gallery-card";
import { useGalleryList } from "./hooks/use-gallery-list";
import { EmptyState } from "./components/empty-state";
import { PartnerGrid } from "./components/partner-grid";
import { EventGrid } from "./components/event-grid";
import { Pagination } from "./components/pagination";



export function GalleryListPage(): ReactElement {
  const {
    loadState,
    errorMessage,
    response,
    events,
    superAdmin,
    filtered,
    selectedEventId,
    partnerParam,
    partnerOptions,
    eventGroups,
    visibleGalleries,
    updateQuery,
    openPartner,
    openEvent,
    resetFilters,
    refresh,
  } = useGalleryList();

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <SectionHeader
        heading="Gallery"
        description="Sesi foto yang sudah selesai beserta link Public Gallery untuk customer."
        onAction={refresh}
        actionDisabled={loadState === "loading"}
        actionLabel={
          <>
            <RefreshCw aria-hidden="true" /> Muat ulang
          </>
        }
      />

      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>
              {selectedEventId
                ? "Foto Event"
                : filtered
                  ? "Pilih Event"
                  : "Pilih Partner / Kiosk"}
            </CardTitle>
            <CardDescription>
              {selectedEventId
                ? "Sesi foto dari event yang dipilih."
                : filtered
                  ? "Pilih event untuk melihat foto gallery."
                  : "Pilih kiosk untuk melihat daftar event."}
            </CardDescription>
          </div>
          {superAdmin && (
            <div className="grid gap-3 sm:grid-cols-[16rem_auto]">
              <Select<string>
                value={partnerParam ?? "all"}
                onValueChange={(value) =>
                  value !== null &&
                  openPartner(value === "all" ? 0 : Number(value))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua partner</SelectItem>
                  {partnerOptions.map((partner) => (
                    <SelectItem key={partner.id} value={String(partner.id)}>
                      {partner.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                disabled={!filtered}
                onClick={resetFilters}
              >
                Reset
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {loadState === "loading" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          )}

          {loadState === "error" && (
            <EmptyState
              icon={CircleAlert}
              title="Daftar Gallery gagal dimuat"
              description={errorMessage}
            />
          )}

          {loadState === "success" && !filtered && (
            <PartnerGrid partners={partnerOptions} onSelect={openPartner} />
          )}

          {loadState === "success" && filtered && !selectedEventId && (
            <EventGrid
              eventGroups={eventGroups}
              galleries={response?.data ?? []}
              events={events}
              onSelect={openEvent}
            />
          )}

          {loadState === "success" && selectedEventId && (
            <>
              {visibleGalleries.length === 0 ? (
                <EmptyState
                  icon={Images}
                  title="Gallery tidak ditemukan"
                  description="Ubah atau reset filter partner."
                />
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleGalleries.map((gallery) => (
                      <GalleryCard key={gallery.id} gallery={gallery} />
                    ))}
                  </div>
                  {response && (
                    <Pagination
                      meta={response.meta}
                      onPageChange={(nextPage) =>
                        updateQuery({
                          page: nextPage === 1 ? null : String(nextPage),
                        })
                      }
                    />
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Toaster position="top-right" />
    </div>
  );
}
