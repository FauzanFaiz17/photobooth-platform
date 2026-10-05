import { CircleAlert, RefreshCw, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLog } from "./hooks/use-audit-log";
import type { ReactElement } from "react";
import { AuditDetail } from "./components/audit-detail";
import { AuditFilterBar } from "./components/audit-filter-bar";
import { AuditLogTable } from "./components/audit-log-table";
import { EventPagination } from "../events/components/event-pagination";
import SectionHeader from "../shared/section-header";

export function AuditLogPage(): ReactElement {
  const {
    response,
    partners,
    state,
    error,
    setRetry,
    detail,
    setDetail,
    partnerId,
    action,
    updateParams,
    reset,
    partnerName,
    filtered,
  } = useAuditLog();

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <SectionHeader
        heading="Audit Log"
        description="Riwayat aktivitas platform khusus Super Admin."
      />
      {state === "loading" && <Skeleton className="h-128" />}
      {state === "error" && (
        <Card>
          <CardContent className="grid min-h-64 place-items-center text-center">
            <div>
              <CircleAlert className="mx-auto size-10 text-destructive" />
              <p className="mt-3 font-medium">Audit Log gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setRetry((value) => value + 1)}
              >
                <RefreshCw aria-hidden="true" /> Coba lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {state === "success" && (
        <Card>
          <CardHeader className="gap-4 border-b">
            <div>
              <CardTitle>Aktivitas Sistem</CardTitle>
              <CardDescription>
                Login, pembayaran, voucher, transfer media, cetak, dan perubahan
                konfigurasi.
              </CardDescription>
            </div>

            <AuditFilterBar
              partnerId={partnerId}
              action={action}
              filtered={filtered}
              onReset={reset}
              onUpdate={updateParams}
              partners={partners}
            />
          </CardHeader>
          <CardContent className="px-0">
            {!response?.data.length ? (
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <ScrollText className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-3 font-medium">
                    {filtered
                      ? "Audit Log tidak ditemukan"
                      : "Belum ada Audit Log"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <AuditLogTable
                  log={response}
                  onDetail={setDetail}
                  partnerName={partnerName}
                />

                <EventPagination
                  meta={response.meta}
                  onUpdateQuery={updateParams}
                  label="Audit Log"
                />
              </>
            )}
          </CardContent>
        </Card>
      )}
      {detail && (
        <AuditDetail
          log={detail}
          partner={partnerName(detail.partner_id)}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}
