import {
  Download,
  RefreshCw,
  WalletCards,
} from "lucide-react";
import {
  useMemo,
  type FormEvent,
  type ReactElement,
} from "react";
import { toast } from "sonner";

import { PaymentDetailDialog } from "@/components/transactions/detail/payment-detail-dialog";
import { PaymentTransitionDialog } from "@/components/transactions/dialogs/payment-transition-dialog";
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
import SectionHeader from "@/components/shared/section-header";
import { useTransaction } from "../hooks/use-transaction";
import { exportPayments } from "../utils";
import { statusLabelsPayment } from "@/constants";
import { TransactionStats } from "./components/transaction-stats";
import { TransactionFilters } from "./components/transaction-filters";
import { TransactionTable } from "./components/transaction-table";
import { TransactionPagination } from "./components/transaction-pagination";

export function TransactionsPageContent(): ReactElement {
  const {
    superAdmin,
    partnerId,
    search,
    gateway,
    status,
    page,
    perPage,
    response,
    partners,
    state,
    error,
    detail,
    transitioning,
    setDetail,
    setRetry,
    setTransitioning,
    updateParams,
    setParams,
    handleUnauthorized,
    setResponse,
    handleForbidden,
  } = useTransaction();

  const summary = useMemo(() => {
    const data = response?.data ?? [];
    return {
      net: data
        .filter((item) => item.status === "paid")
        .reduce((total, item) => total + item.net_amount, 0),
      paid: data.filter((item) => item.status === "paid").length,
      pending: data.filter((item) => item.status === "pending").length,
      failed: data.filter(
        (item) => item.status === "failed" || item.status === "expired",
      ).length,
      voucher: data.filter((item) => item.gateway === "voucher").length,
    };
  }, [response]);

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search");
    updateParams({
      search: typeof value === "string" ? value.trim() || null : null,
      page: null,
    });
  }

  const filtered = Boolean(search || gateway || status || partnerId);

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <SectionHeader
        heading="Transactions"
        description="Pantau Payment tunai, QRIS, Voucher, dan gateway lainnya."
        onAction={() => exportPayments(response?.data ?? [])}
        actionDisabled={!response?.data.length}
        actionLabel={
          <>
            <Download /> Export Halaman Ini
          </>
        }
      />

      {state === "loading" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </>
      )}

      {state === "error" && (
        <Card>
          <CardContent className="grid min-h-64 place-items-center p-6 text-center">
            <div>
              <p className="font-medium">Payment gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setRetry((value) => value + 1)}
              >
                <RefreshCw /> Coba lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state === "success" && (
        <>
          <TransactionStats summary={summary} />

          <Card>
            <CardHeader className="gap-4 border-b">
              <div>
                <CardTitle>Daftar Payment</CardTitle>
                <CardDescription>
                  Pencarian dan filter diproses oleh backend.
                </CardDescription>
              </div>
              <TransactionFilters
                superAdmin={superAdmin}
                search={search}
                gateway={gateway}
                status={status}
                partnerId={partnerId}
                filtered={filtered}
                partners={partners}
                onFilterChange={(values) => updateParams(values)}
                onReset={() =>
                  setParams(new URLSearchParams(), { replace: true })
                }
                onSearch={submitSearch}
              />
            </CardHeader>
            <CardContent className="px-0">
              {!response || response.data.length === 0 ? (
                <div className="grid min-h-64 place-items-center p-6 text-center">
                  <div>
                    <WalletCards className="mx-auto size-10 text-muted-foreground" />
                    <p className="mt-3 font-medium">
                      {filtered
                        ? "Payment tidak ditemukan"
                        : "Belum ada Payment"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <TransactionTable
                    payments={response.data}
                    superAdmin={superAdmin}
                    onViewDetail={(payment) => setDetail(payment)}
                    onTransition={(payment) => setTransitioning(payment)}
                  />
                  <TransactionPagination
                    meta={response.meta}
                    page={page}
                    perPage={perPage}
                    onPageChange={(nextPage) =>
                      updateParams({
                        page: nextPage === null ? null : String(nextPage),
                      })
                    }
                    onPerPageChange={(value) =>
                      updateParams({
                        per_page: value === "10" ? null : value,
                        page: null,
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
        <PaymentDetailDialog
          payment={detail}
          open
          onOpenChange={(open) => !open && setDetail(null)}
          onUnauthorized={() => void handleUnauthorized()}
          onForbidden={handleForbidden}
        />
      )}

      {transitioning && (
        <PaymentTransitionDialog
          payment={transitioning}
          open
          onOpenChange={(open) => !open && setTransitioning(null)}
          onSaved={(saved) => {
            setResponse((current) =>
              current
                ? {
                    ...current,
                    data: current.data.map((item) =>
                      item.id === saved.id ? saved : item,
                    ),
                  }
                : current,
            );
            setDetail((current) =>
              current?.id === saved.id ? saved : current,
            );
            toast.success(
              `Payment ${saved.reference} menjadi ${statusLabelsPayment[saved.status]}.`,
            );
          }}
          onUnauthorized={() => void handleUnauthorized()}
          onForbidden={handleForbidden}
        />
      )}

      <Toaster position="top-right" />
    </div>
  );
}
