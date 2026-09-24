import { CircleAlert, RefreshCw, UsersRound } from "lucide-react";
import { type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-context";
import { EventPagination } from "@/components/events/components/event-pagination";
import { useCustomerList } from "./hooks/use-customer-list";
import { CustomerDetailDialog } from "./components/customer-detail-dialog";
import { CustomerFilterBar } from "./components/customer-filter-bar";
import { CustomerTableRow } from "./components/customer-table-row";
import SectionHeader from "../shared/section-header";

export function CustomerListPage(): ReactElement {
  const { user } = useAuth();
  const {
    response,
    partners,
    state,
    error,
    detail,
    superAdmin,
    search,
    partnerId,
    filtered,
    partnerName,
    updateParams,
    reset,
    submitSearch,
    setRetry,
    setDetail,
    handleUnauthorized,
    handleForbidden,
  } = useCustomerList();

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <SectionHeader 
      heading="Customers"
      description=" Data Customer yang dicatat melalui aplikasi desktop. Halaman ini hanya
          dapat dibaca."
      />

      {state === "loading" && <Skeleton className="h-128" />}

      {state === "error" && (
        <Card>
          <CardContent className="grid min-h-64 place-items-center text-center">
            <div>
              <CircleAlert className="mx-auto size-10 text-destructive" />
              <p className="mt-3 font-medium">Customers gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setRetry((value) => value + 1)}
              >
                <RefreshCw aria-hidden="true" />
                Coba lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state === "success" && (
        <Card>
          <CardHeader className="gap-4 border-b">
            <div>
              <CardTitle>Daftar Customer</CardTitle>
              <CardDescription>
                Customer anonim tidak muncul karena sesi tanpa identitas tidak
                membuat record Customer.
              </CardDescription>
            </div>
            <CustomerFilterBar
              search={search}
              partnerId={partnerId}
              superAdmin={superAdmin}
              filtered={filtered}
              partners={partners}
              onSubmitSearch={submitSearch}
              onUpdate={updateParams}
              onReset={reset}
            />
          </CardHeader>
          <CardContent className="px-0">
            {!response?.data.length ? (
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <UsersRound className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-3 font-medium">
                    {filtered
                      ? "Customer tidak ditemukan"
                      : "Belum ada Customer"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Email</TableHead>
                      {superAdmin && <TableHead>Partner</TableHead>}
                      <TableHead className="text-right">
                        Photo Session
                      </TableHead>
                      <TableHead>Terdaftar</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {response.data.map((customer) => (
                      <CustomerTableRow
                        key={customer.id}
                        customer={customer}
                        partnerName={partnerName}
                        superAdmin={superAdmin}
                        onDetail={() => setDetail(customer)}
                      />
                    ))}
                  </TableBody>
                </Table>
                <EventPagination
                  meta={response.meta}
                  onUpdateQuery={updateParams}
                  label="Customer"
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {detail && (
        <CustomerDetailDialog
          customer={detail}
          partner={
            superAdmin
              ? partnerName(detail.partner_id)
              : (user?.partner?.company_name ?? "Partner")
          }
          onClose={() => setDetail(null)}
          onUnauthorized={() => void handleUnauthorized()}
          onForbidden={handleForbidden}
        />
      )}
    </div>
  );
}
