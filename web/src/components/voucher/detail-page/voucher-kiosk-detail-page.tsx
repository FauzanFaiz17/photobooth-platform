import {
  ArrowLeft,
  Ban,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-context";
import { isSuperAdmin } from "@/features/auth/auth-access";
import { getPartner } from "@/features/partners/partner-service";
import {
  deleteVoucherPackage,
  getVoucherPackages,
  getVouchers,
  voidVoucher,
} from "@/features/vouchers/voucher-service";
import {
  VOUCHER_STATUSES,
  type VoucherListResponse,
  type VoucherPackageRecord,
  type VoucherRecord,
  type VoucherStatus,
} from "@/features/vouchers/voucher.types";
import { ApiError } from "@/lib/api-client";
import { VoucherIssueDialog } from "./voucher-issue-dialog";
import { VoucherPackageFormDialog } from "./voucher-package-form-dialog";

const statusLabels: Record<VoucherStatus, string> = {
  unused: "Belum dipakai",
  redeemed: "Sudah dipakai",
  expired: "Kedaluwarsa",
  void: "Dibatalkan",
};
function parseId(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
/** Voucher multi-sesi tetap berstatus "unused" sampai kuotanya habis, jadi pemakaian dihitung terpisah dari status. */
function voucherUsage(voucher: VoucherRecord): {
  used: number;
  limit: number;
  percent: number;
  partial: boolean;
} {
  const limit = Math.max(1, voucher.usage_limit ?? 1);
  const used = Math.min(limit, Math.max(0, voucher.usage_count ?? 0));
  return {
    used,
    limit,
    percent: Math.round((used / limit) * 100),
    partial: voucher.status === "unused" && used > 0,
  };
}

export function VoucherKioskDetailPage(): ReactElement {
  const { kioskId } = useParams<{ kioskId: string }>();
  const partnerId = parseId(kioskId);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { token, user, logout } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const page = Math.max(1, Number(params.get("page")) || 1);
  const statusParam = params.get("status");
  const status = VOUCHER_STATUSES.find((item) => item === statusParam);
  const packageFilter = Math.max(0, Number(params.get("package_id")) || 0);
  const search = params.get("search") ?? "";
  const [partnerName, setPartnerName] = useState("");
  const [packages, setPackages] = useState<ReadonlyArray<VoucherPackageRecord>>(
    [],
  );
  const [vouchers, setVouchers] = useState<VoucherListResponse | null>(null);
  const [state, setState] = useState<
    "loading" | "success" | "error" | "not-found"
  >("loading");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [packageDialog, setPackageDialog] = useState(false);
  const [editingPackage, setEditingPackage] =
    useState<VoucherPackageRecord | null>(null);
  const [deletingPackage, setDeletingPackage] =
    useState<VoucherPackageRecord | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [voidingVoucher, setVoidingVoucher] = useState<VoucherRecord | null>(
    null,
  );
  const [actionPending, setActionPending] = useState(false);

  const updateParams = useCallback(
    (updates: Readonly<Record<string, string | null>>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(updates)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  const unauthorized = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);
  const forbidden = useCallback(
    () =>
      navigate("/admin/forbidden", {
        replace: true,
        state: { from: `/voucher/${partnerId}` },
      }),
    [navigate, partnerId],
  );

  useEffect(() => {
    if (!token || !partnerId) return;
    const controller = new AbortController();
    const accessToken = token;
    async function load(): Promise<void> {
      setState("loading");
      setError("");
      try {
        const packageRequests = superAdmin
          ? [
              getVoucherPackages(
                accessToken,
                { partner_id: partnerId, per_page: 100 },
                controller.signal,
              ),
              getVoucherPackages(
                accessToken,
                { scope: "global", per_page: 100 },
                controller.signal,
              ),
            ]
          : [
              getVoucherPackages(
                accessToken,
                { per_page: 100 },
                controller.signal,
              ),
            ];
        const [partnerResult, packageResults, voucherResult] =
          await Promise.all([
            superAdmin
              ? getPartner(accessToken, partnerId, controller.signal)
              : Promise.resolve(null),
            Promise.all(packageRequests),
            getVouchers(
              accessToken,
              {
                partner_id: partnerId,
                status,
                voucher_package_id: packageFilter || undefined,
                search: search || undefined,
                per_page: 10,
                page,
              },
              controller.signal,
            ),
          ]);
        if (controller.signal.aborted) return;
        if (!superAdmin && user?.partner?.id !== partnerId) {
          setState("not-found");
          return;
        }
        if (page > Math.max(1, voucherResult.meta.last_page)) {
          updateParams({
            page:
              voucherResult.meta.last_page > 1
                ? String(voucherResult.meta.last_page)
                : null,
          });
          return;
        }
        const uniquePackages = Array.from(
          new Map(
            packageResults
              .flatMap((result) => result.data)
              .map((item) => [item.id, item]),
          ).values(),
        );
        setPartnerName(
          partnerResult?.brand_name ||
            partnerResult?.company_name ||
            user?.partner?.brand_name ||
            user?.partner?.company_name ||
            "Partner",
        );
        setPackages(uniquePackages);
        setVouchers(voucherResult);
        setState("success");
      } catch (caught: unknown) {
        if (controller.signal.aborted) return;
        if (caught instanceof ApiError && caught.status === 401)
          return void unauthorized();
        if (caught instanceof ApiError && caught.status === 403)
          return forbidden();
        if (caught instanceof ApiError && caught.status === 404)
          return setState("not-found");
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Tidak dapat terhubung ke server.",
        );
        setState("error");
      }
    }
    void load();
    return () => controller.abort();
  }, [
    forbidden,
    packageFilter,
    page,
    partnerId,
    retry,
    search,
    status,
    superAdmin,
    token,
    unauthorized,
    updateParams,
    user,
  ]);

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search");
    updateParams({
      search: typeof value === "string" ? value.trim() || null : null,
      page: null,
    });
  }
  async function confirmDelete(): Promise<void> {
    if (!token || !deletingPackage || actionPending) return;
    setActionPending(true);
    try {
      await deleteVoucherPackage(token, deletingPackage.id);
      setPackages((current) =>
        current.filter((item) => item.id !== deletingPackage.id),
      );
      toast.success(`Package ${deletingPackage.name} dihapus.`);
      setDeletingPackage(null);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401)
        return void unauthorized();
      if (caught instanceof ApiError && caught.status === 403)
        return forbidden();
      toast.error(
        caught instanceof ApiError
          ? (caught.validationErrors.voucher_package?.[0] ?? caught.message)
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setActionPending(false);
    }
  }
  async function confirmVoid(): Promise<void> {
    if (!token || !voidingVoucher || actionPending) return;
    setActionPending(true);
    try {
      const saved = await voidVoucher(token, voidingVoucher.id);
      setVouchers((current) =>
        current
          ? {
              ...current,
              data: current.data.map((item) =>
                item.id === saved.id ? saved : item,
              ),
            }
          : current,
      );
      toast.success(`Voucher ${saved.code} dibatalkan.`);
      setVoidingVoucher(null);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401)
        return void unauthorized();
      if (caught instanceof ApiError && caught.status === 403)
        return forbidden();
      toast.error(
        caught instanceof ApiError
          ? caught.message
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setActionPending(false);
    }
  }

  if (!partnerId || state === "not-found")
    return (
      <div className="p-6">
        <Card className="mx-auto max-w-lg">
          <CardContent className="p-8 text-center">
            <p className="font-medium">Partner tidak ditemukan</p>
            <Button className="mt-4" render={<Link to="/voucher" />}>
              <ArrowLeft /> Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-4">
        <Button variant="ghost" render={<Link to="/voucher" />}>
          <ArrowLeft /> Daftar Partner
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Voucher {partnerName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola package dan voucher berdasarkan data backend.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={state !== "success"}
              onClick={() => {
                setEditingPackage(null);
                setPackageDialog(true);
              }}
            >
              <Package /> Tambah Package
            </Button>
            <Button
              disabled={
                state !== "success" || packages.every((item) => !item.is_active)
              }
              onClick={() => setIssueOpen(true)}
            >
              <Plus /> Terbitkan Voucher
            </Button>
          </div>
        </div>
      </header>
      {state === "loading" && (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-96" />
        </div>
      )}
      {state === "error" && (
        <Card>
          <CardContent className="grid min-h-64 place-items-center p-6 text-center">
            <div>
              <p className="font-medium">Data Voucher gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
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
          <Card>
            <CardHeader>
              <CardTitle>Voucher Package</CardTitle>
              <CardDescription>
                Package global tersedia bagi seluruh Partner; hanya Super Admin
                yang dapat mengubahnya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {packages.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada Voucher Package.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {packages.map((item) => {
                    const mutable =
                      item.partner_id === partnerId ||
                      (superAdmin && item.partner_id === null);
                    return (
                      <Card key={item.id} className="shadow-none">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-base">
                                {item.name}
                              </CardTitle>
                              <CardDescription>
                                {item.partner_id === null
                                  ? "Package Global"
                                  : "Package Partner"}
                              </CardDescription>
                            </div>
                            <Badge
                              variant={item.is_active ? "default" : "secondary"}
                            >
                              {item.is_active ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-xl font-semibold">
                            {formatCurrency(item.price)}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <span>{item.persons} orang</span>
                            <span>{item.captures} capture</span>
                            <span>{item.print_count} cetak</span>
                            {item.session_count !== undefined && (
                              <span>{item.session_count} sesi</span>
                            )}
                            <span>{item.validity_days} hari</span>
                          </div>
                          {mutable && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  setEditingPackage(item);
                                  setPackageDialog(true);
                                }}
                              >
                                <Pencil /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={(item.vouchers_count ?? 0) > 0}
                                onClick={() => setDeletingPackage(item)}
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="gap-4 border-b">
              <div>
                <CardTitle>Daftar Voucher</CardTitle>
                <CardDescription>
                  Filter dan pencarian diproses oleh backend.
                </CardDescription>
              </div>
              <div className="grid gap-3 lg:grid-cols-[1fr_14rem_14rem_auto]">
                <form
                  key={search}
                  className="flex gap-2"
                  onSubmit={submitSearch}
                >
                  <Input
                    name="search"
                    defaultValue={search}
                    placeholder="Cari kode voucher"
                  />
                  <Button type="submit" variant="outline" size="icon">
                    <Search />
                  </Button>
                </form>
                <Select
                  value={status ?? "all"}
                  onValueChange={(value) =>
                    value &&
                    updateParams({
                      status: value === "all" ? null : value,
                      page: null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    {VOUCHER_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {statusLabels[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={packageFilter ? String(packageFilter) : "all"}
                  onValueChange={(value) =>
                    value &&
                    updateParams({
                      package_id: value === "all" ? null : value,
                      page: null,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua package</SelectItem>
                    {packages.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  disabled={!search && !status && !packageFilter}
                  onClick={() =>
                    setParams(new URLSearchParams(), { replace: true })
                  }
                >
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-0">
              {!vouchers || vouchers.data.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Voucher tidak ditemukan.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kode</TableHead>
                          <TableHead>Package</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Pemakaian</TableHead>
                          <TableHead>Kedaluwarsa</TableHead>
                          <TableHead>Dibuat</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vouchers.data.map((voucher) => {
                          const usage = voucherUsage(voucher);
                          return (
                            <TableRow key={voucher.id}>
                              <TableCell className="font-mono font-medium">
                                {voucher.code}
                              </TableCell>
                              <TableCell>
                                <div>{voucher.package.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(voucher.package.price)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    usage.partial
                                      ? "outline"
                                      : voucher.status === "unused"
                                        ? "default"
                                        : voucher.status === "expired" ||
                                            voucher.status === "void"
                                          ? "destructive"
                                          : "secondary"
                                  }
                                >
                                  {usage.partial
                                    ? "Terpakai sebagian"
                                    : statusLabels[voucher.status]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="w-28 space-y-1.5">
                                  <span className="text-xs text-muted-foreground">
                                    {usage.used}/{usage.limit} sesi
                                  </span>
                                  <Progress
                                    value={usage.percent}
                                    aria-label={`Pemakaian voucher ${voucher.code}`}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDate(voucher.expired_at)}
                              </TableCell>
                              <TableCell>
                                {formatDate(voucher.created_at)}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        aria-label={`Aksi ${voucher.code}`}
                                      />
                                    }
                                  >
                                    <Ellipsis />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      disabled={voucher.status !== "unused"}
                                      onClick={() => setVoidingVoucher(voucher)}
                                    >
                                      <Ban /> Batalkan Voucher
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t px-6 pt-4">
                    <p className="text-sm text-muted-foreground">
                      {vouchers.meta.from ?? 0}–{vouchers.meta.to ?? 0} dari{" "}
                      {vouchers.meta.total}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() =>
                          updateParams({
                            page: page - 1 === 1 ? null : String(page - 1),
                          })
                        }
                      >
                        <ChevronLeft /> Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= vouchers.meta.last_page}
                        onClick={() => updateParams({ page: String(page + 1) })}
                      >
                        Berikutnya <ChevronRight />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
      {packageDialog && (
        <VoucherPackageFormDialog
          partnerId={partnerId}
          item={editingPackage}
          open
          onOpenChange={setPackageDialog}
          onSaved={(saved) => {
            setPackages((current) =>
              current.some((item) => item.id === saved.id)
                ? current.map((item) => (item.id === saved.id ? saved : item))
                : [saved, ...current],
            );
            toast.success(`Package ${saved.name} disimpan.`);
          }}
          onUnauthorized={() => void unauthorized()}
          onForbidden={forbidden}
        />
      )}
      {issueOpen && (
        <VoucherIssueDialog
          partnerId={partnerId}
          packages={packages}
          open
          onOpenChange={setIssueOpen}
          onIssued={(issued) => {
            toast.success(`${issued.length} voucher berhasil diterbitkan.`);
            setRetry((value) => value + 1);
          }}
          onUnauthorized={() => void unauthorized()}
          onForbidden={forbidden}
        />
      )}
      <AlertDialog
        open={deletingPackage !== null}
        onOpenChange={(open) =>
          !open && !actionPending && setDeletingPackage(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Voucher Package?</AlertDialogTitle>
            <AlertDialogDescription>
              Package {deletingPackage?.name} akan dihapus. Package yang sudah
              memiliki voucher akan ditolak backend.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={actionPending}
              onClick={() => void confirmDelete()}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={voidingVoucher !== null}
        onOpenChange={(open) =>
          !open && !actionPending && setVoidingVoucher(null)
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              Voucher {voidingVoucher?.code} akan berstatus void dan tidak dapat
              digunakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={actionPending}
              onClick={() => void confirmVoid()}
            >
              Batalkan Voucher
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster position="top-right" />
    </div>
  );
}
