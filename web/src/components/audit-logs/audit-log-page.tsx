import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  RefreshCw,
  ScrollText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AUDIT_ACTIONS,
  type AuditLogPage,
} from "@/features/audit-logs/audit-log.types";
import { date, subjectName } from "@/lib/utils";
import { useAuditLog } from "./hooks/use-audit-log";
import type { ReactElement } from "react";
import { actionLabelsAudit } from "@/constants";
import { AuditDetail } from "./components/audit-detail";


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
    setParams,
    page
  } = useAuditLog()

  const partnerName = (id: number | null): string =>
    id
      ? (partners.find((partner) => partner.id === id)?.company_name ??
        `Partner #${id}`)
      : "Platform";
  const filtered = Boolean(partnerId || action);
  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Riwayat aktivitas platform khusus Super Admin.
        </p>
      </header>
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
            <div className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_auto]">
              <Select
                value={partnerId ? String(partnerId) : "all"}
                onValueChange={(value) =>
                  value &&
                  updateParams({
                    partner_id: value === "all" ? null : value,
                    page: null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Partner</SelectItem>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={String(partner.id)}>
                      {partner.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={action || "all"}
                onValueChange={(value) =>
                  value &&
                  updateParams({ action: value === "all" ? null : value, page: null })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Action</SelectItem>
                  {AUDIT_ACTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {actionLabelsAudit[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                disabled={!filtered}
                onClick={() =>
                  setParams(new URLSearchParams(), { replace: true })
                }
              >
                Reset
              </Button>
            </div>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {response.data.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{date(log.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {actionLabelsAudit[log.action] ?? log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{partnerName(log.partner_id)}</TableCell>
                        <TableCell>
                          {log.user_id ? `#${log.user_id}` : "—"}
                        </TableCell>
                        <TableCell>
                          {subjectName(log.subject_type)}
                          {log.subject_id ? ` #${log.subject_id}` : ""}
                        </TableCell>
                        <TableCell
                          className="max-w-80 truncate"
                          title={log.description ?? undefined}
                        >
                          {log.description ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Detail Audit Log ${log.id}`}
                            onClick={() => setDetail(log)}
                          >
                            <Eye aria-hidden="true" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    {response.meta.from ?? 0}–{response.meta.to ?? 0} dari{" "}
                    {response.meta.total} Audit Log
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() =>
                        updateParams({
                          page: page - 1 === 1 ? null : String(page - 1),
                        })
                      }
                    >
                      <ChevronLeft aria-hidden="true" /> Sebelumnya
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= response.meta.last_page}
                      onClick={() => updateParams({ page: String(page + 1) })}
                    >
                      Berikutnya <ChevronRight aria-hidden="true" />
                    </Button>
                  </div>
                </div>
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
