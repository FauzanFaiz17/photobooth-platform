import {
  CircleAlert,
  Info,
  Printer,
  RefreshCw,
} from "lucide-react";
import { type ReactElement } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { PrintDetailDialog } from "./components/print-detail-dialog";
import { PrintActionDialog } from "./components/print-action-dialog";
import { PrintJobsStats } from "./components/print-jobs-stats";
import { PrintJobsFilters } from "./components/print-jobs-filters";
import { PrintJobsTable } from "./components/print-jobs-table";
import { PrintJobsPagination } from "./components/print-jobs-pagination";
import { usePrintJobs } from "./hooks/use-print-jobs";

export function PrintJobsPage(): ReactElement {
  const {
    response,
    partners,
    printers,
    state,
    error,
    detail,
    action,
    superAdmin,
    page,
    partnerId,
    printerId,
    status,
    counts,
    filtered,
    updateParams,
    setRetryKey,
    setDetail,
    setAction,
    handleUnauthorized,
    handleForbidden,
  } = usePrintJobs();

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Print Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pantau antrean dan hasil cetak dari printer fisik.
        </p>
      </header>
      <Alert role="note">
        <Info aria-hidden="true" />
        <AlertTitle>Sumber data print job</AlertTitle>
        <AlertDescription>
          Cetak lokal kiosk dicatat lewat POST /v1/desktop/print-jobs/record
          sebagai status success; antrean remote muncul sebagai queued. Pastikan
          printer aktif di Kiosk → Printer agar device/booth match.
        </AlertDescription>
      </Alert>

      {state === "loading" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </>
      )}

      {state === "error" && (
        <Card>
          <CardContent className="grid min-h-64 place-items-center text-center">
            <div>
              <CircleAlert className="mx-auto size-10 text-destructive" />
              <p className="mt-3 font-medium">Print Jobs gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setRetryKey((value) => value + 1)}
              >
                <RefreshCw aria-hidden="true" /> Coba lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state === "success" && (
        <>
          <PrintJobsStats counts={counts} />

          <PrintJobsFilters
            superAdmin={superAdmin}
            partnerId={partnerId}
            printerId={printerId}
            status={status}
            filtered={filtered}
            partners={partners}
            printers={printers}
            onFilterChange={(values) => updateParams(values)}
            onReset={() => updateParams({
              partner_id: null,
              printer_id: null,
              status: null,
              page: null,
            })}
          />

          <Card>
            <CardContent className="px-0">
              {!response?.data.length ? (
                <div className="grid min-h-64 place-items-center text-center">
                  <div>
                    <Printer className="mx-auto size-10 text-muted-foreground" />
                    <p className="mt-3 font-medium">
                      {filtered
                        ? "Print Job tidak ditemukan"
                        : "Belum ada Print Job"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <PrintJobsTable
                    jobs={response.data}
                    superAdmin={superAdmin}
                    partners={partners}
                    onViewDetail={(job) => setDetail(job)}
                    onAction={(job) => setAction(job)}
                  />
                  <PrintJobsPagination
                    meta={response.meta}
                    page={page}
                    onPageChange={(nextPage) =>
                      updateParams({
                        page: nextPage === null ? null : String(nextPage),
                      })
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {detail && (
        <PrintDetailDialog
          job={detail}
          onClose={() => setDetail(null)}
          onUnauthorized={() => void handleUnauthorized()}
          onForbidden={handleForbidden}
        />
      )}

      {action && (
        <PrintActionDialog
          job={action}
          onClose={() => setAction(null)}
          onDone={(saved) => {
            toast.success(
              saved.status === "queued"
                ? `Print Job #${saved.id} kembali ke antrean.`
                : `Print Job #${saved.id} dibatalkan.`,
            );
            setRetryKey((value) => value + 1);
          }}
          onUnauthorized={() => void handleUnauthorized()}
          onForbidden={handleForbidden}
        />
      )}

      <Toaster position="top-right" />
    </div>
  );
}
