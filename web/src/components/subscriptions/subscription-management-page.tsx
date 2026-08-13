import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Ellipsis,
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
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import {
  activatePartnerSubscription,
  cancelPartnerSubscription,
  deleteSubscriptionPlan,
  expirePartnerSubscription,
  getPartnerSubscriptions,
  getSubscriptionPlans,
} from "@/features/subscriptions/subscription-service";
import {
  SUBSCRIPTION_STATUSES,
  isSubscriptionStatus,
  type PartnerSubscriptionListResponse,
  type PartnerSubscriptionRecord,
  type SubscriptionPlanListResponse,
  type SubscriptionPlanRecord,
  type SubscriptionStatus,
} from "@/features/subscriptions/subscription.types";
import { ApiError } from "@/lib/api-client";
import { PartnerSubscriptionDialog } from "./partner-subscription-dialog";
import { SubscriptionPlanDialog } from "./subscription-plan-dialog";

const statusLabels: Record<SubscriptionStatus, string> = {
  pending: "Pending",
  active: "Aktif",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
};
function money(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
function date(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
    new Date(value),
  );
}
function positive(value: string | null): number {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 1;
}

export function SubscriptionManagement(): ReactElement {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { token, user, logout } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const tab = params.get("tab") === "subscriptions" ? "subscriptions" : "plans";
  const page = positive(params.get("page"));
  const search = params.get("search") ?? "";
  const statusParam = params.get("status");
  const status = isSubscriptionStatus(statusParam) ? statusParam : undefined;
  const [plans, setPlans] = useState<SubscriptionPlanListResponse | null>(null);
  const [subscriptions, setSubscriptions] =
    useState<PartnerSubscriptionListResponse | null>(null);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [planDialog, setPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanRecord | null>(
    null,
  );
  const [deletingPlan, setDeletingPlan] =
    useState<SubscriptionPlanRecord | null>(null);
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [renewing, setRenewing] = useState<PartnerSubscriptionRecord | null>(
    null,
  );
  const [confirmAction, setConfirmAction] = useState<{
    item: PartnerSubscriptionRecord;
    action: "activate" | "cancel" | "expire";
  } | null>(null);
  const [pending, setPending] = useState(false);
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
        state: { from: "/admin/subscriptions" },
      }),
    [navigate],
  );
  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    const controller = new AbortController();
    async function load(): Promise<void> {
      setState("loading");
      setError("");
      try {
        if (tab === "plans") {
          const result = await getSubscriptionPlans(
            accessToken,
            { search: search || undefined, per_page: 10, page },
            controller.signal,
          );
          if (controller.signal.aborted) return;
          setPlans(result);
        } else {
          const [result, planResult, partnerResult] = await Promise.all([
            getPartnerSubscriptions(
              accessToken,
              { status, per_page: 10, page },
              controller.signal,
            ),
            getSubscriptionPlans(
              accessToken,
              { per_page: 100 },
              controller.signal,
            ),
            superAdmin
              ? getPartners(accessToken, { per_page: 100 }, controller.signal)
              : Promise.resolve(null),
          ]);
          if (controller.signal.aborted) return;
          setSubscriptions(result);
          setPlans(planResult);
          setPartners(partnerResult?.data ?? []);
        }
        setState("success");
      } catch (caught: unknown) {
        if (controller.signal.aborted) return;
        if (caught instanceof ApiError && caught.status === 401)
          return void unauthorized();
        if (caught instanceof ApiError && caught.status === 403)
          return forbidden();
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
    page,
    retry,
    search,
    status,
    superAdmin,
    tab,
    token,
    unauthorized,
  ]);
  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search");
    updateParams({
      search: typeof value === "string" ? value.trim() || null : null,
      page: null,
    });
  }
  async function removePlan(): Promise<void> {
    if (!token || !deletingPlan) return;
    setPending(true);
    try {
      await deleteSubscriptionPlan(token, deletingPlan.id);
      setPlans((current) =>
        current
          ? {
              ...current,
              data: current.data.filter((item) => item.id !== deletingPlan.id),
            }
          : current,
      );
      toast.success(`Plan ${deletingPlan.name} dihapus.`);
      setDeletingPlan(null);
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
      setPending(false);
    }
  }
  async function runAction(): Promise<void> {
    if (!token || !confirmAction) return;
    setPending(true);
    try {
      const saved =
        confirmAction.action === "activate"
          ? await activatePartnerSubscription(token, confirmAction.item.id)
          : confirmAction.action === "cancel"
            ? await cancelPartnerSubscription(token, confirmAction.item.id)
            : await expirePartnerSubscription(token, confirmAction.item.id);
      setSubscriptions((current) =>
        current
          ? {
              ...current,
              data: current.data.map((item) =>
                item.id === saved.id ? saved : item,
              ),
            }
          : current,
      );
      toast.success(
        `Subscription ${saved.partner?.company_name ?? "Partner tidak tersedia"} diperbarui.`,
      );
      setConfirmAction(null);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401)
        return void unauthorized();
      if (caught instanceof ApiError && caught.status === 403)
        return forbidden();
      toast.error(
        caught instanceof ApiError
          ? (Object.values(caught.validationErrors).flat()[0] ?? caught.message)
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola plan dan lifecycle subscription Partner.
          </p>
        </div>
        {superAdmin && (
          <Button
            onClick={() => {
              if (tab === "plans") {
                setEditingPlan(null);
                setPlanDialog(true);
              } else {
                setRenewing(null);
                setSubscriptionDialog(true);
              }
            }}
          >
            <Plus />
            {tab === "plans" ? "Tambah Plan" : "Assign Subscription"}
          </Button>
        )}
      </header>
      <Tabs
        value={tab}
        onValueChange={(value) =>
          updateParams({
            tab: value === "plans" ? null : value,
            page: null,
            search: null,
            status: null,
          })
        }
      >
        <TabsList>
          <TabsTrigger value="plans">Subscription Plan</TabsTrigger>
          <TabsTrigger value="subscriptions">Partner Subscription</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="space-y-4">
          {state === "loading" ? (
            <Skeleton className="h-96" />
          ) : state === "error" ? (
            <ErrorCard
              message={error}
              onRetry={() => setRetry((value) => value + 1)}
            />
          ) : (
            <Card>
              <CardHeader className="gap-4 border-b">
                <div>
                  <CardTitle>Daftar Plan</CardTitle>
                  <CardDescription>
                    Plan dapat dibaca semua role yang memiliki permission
                    subscription.
                  </CardDescription>
                </div>
                <form
                  key={search}
                  className="flex max-w-md gap-2"
                  onSubmit={submitSearch}
                >
                  <Input
                    name="search"
                    defaultValue={search}
                    placeholder="Cari nama Plan"
                  />
                  <Button type="submit" variant="outline" size="icon">
                    <Search />
                  </Button>
                </form>
              </CardHeader>
              <CardContent className="px-0">
                {!plans?.data.length ? (
                  <Empty text="Belum ada Subscription Plan." />
                ) : (
                  <>
                    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                      {plans.data.map((plan) => (
                        <Card key={plan.id} className="shadow-none">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle>{plan.name}</CardTitle>
                              <Badge
                                variant={
                                  plan.is_active ? "default" : "secondary"
                                }
                              >
                                {plan.is_active ? "Aktif" : "Nonaktif"}
                              </Badge>
                            </div>
                            <CardDescription>
                              {plan.billing_cycle === "monthly"
                                ? "Bulanan"
                                : "Tahunan"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-2xl font-semibold">
                              {money(plan.price)}
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div>
                                <b>{plan.max_booths}</b>
                                <br />
                                Booth
                              </div>
                              <div>
                                <b>{plan.max_devices}</b>
                                <br />
                                Device
                              </div>
                              <div>
                                <b>{plan.max_operators}</b>
                                <br />
                                Operator
                              </div>
                            </div>
                            {plan.features?.length ? (
                              <ul className="space-y-1 text-sm text-muted-foreground">
                                {plan.features.map((feature) => (
                                  <li key={feature} className="flex gap-2">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            {superAdmin && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  className="flex-1"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingPlan(plan);
                                    setPlanDialog(true);
                                  }}
                                >
                                  <Pencil /> Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeletingPlan(plan)}
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Pagination
                      response={plans}
                      page={page}
                      onPage={(next) =>
                        updateParams({ page: next === 1 ? null : String(next) })
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="subscriptions" className="space-y-4">
          {state === "loading" ? (
            <Skeleton className="h-96" />
          ) : state === "error" ? (
            <ErrorCard
              message={error}
              onRetry={() => setRetry((value) => value + 1)}
            />
          ) : (
            <Card>
              <CardHeader className="gap-4 border-b">
                <div>
                  <CardTitle>Riwayat Partner Subscription</CardTitle>
                  <CardDescription>
                    {superAdmin
                      ? "Kelola subscription seluruh Partner."
                      : "Riwayat subscription Partner Anda."}
                  </CardDescription>
                </div>
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
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua status</SelectItem>
                    {SUBSCRIPTION_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {statusLabels[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="px-0">
                {!subscriptions?.data.length ? (
                  <Empty text="Belum ada Partner Subscription." />
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Partner</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Periode</TableHead>
                            <TableHead>Auto Renew</TableHead>
                            <TableHead>Sisa Hari</TableHead>
                            {superAdmin && (
                              <TableHead className="text-right">Aksi</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscriptions.data.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.partner?.company_name ??
                                  "Partner tidak tersedia"}
                              </TableCell>
                              <TableCell>
                                <div>{item.plan.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {money(item.plan.price)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    item.status === "active"
                                      ? "default"
                                      : item.status === "cancelled"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {statusLabels[item.status]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {date(item.starts_at)} – {date(item.ends_at)}
                              </TableCell>
                              <TableCell>
                                {item.auto_renew ? "Ya" : "Tidak"}
                              </TableCell>
                              <TableCell>{item.remaining_days}</TableCell>
                              {superAdmin && (
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button
                                          variant="ghost"
                                          size="icon-sm"
                                        />
                                      }
                                    >
                                      <Ellipsis />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {item.status === "pending" && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            setConfirmAction({
                                              item,
                                              action: "activate",
                                            })
                                          }
                                        >
                                          Aktifkan
                                        </DropdownMenuItem>
                                      )}
                                      {(item.status === "active" ||
                                        item.status === "expired") && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setRenewing(item);
                                            setSubscriptionDialog(true);
                                          }}
                                        >
                                          Renew
                                        </DropdownMenuItem>
                                      )}
                                      {item.status === "active" && (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            setConfirmAction({
                                              item,
                                              action: "expire",
                                            })
                                          }
                                        >
                                          Expire
                                        </DropdownMenuItem>
                                      )}
                                      {(item.status === "pending" ||
                                        item.status === "active") && (
                                        <DropdownMenuItem
                                          variant="destructive"
                                          onClick={() =>
                                            setConfirmAction({
                                              item,
                                              action: "cancel",
                                            })
                                          }
                                        >
                                          Cancel
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <Pagination
                      response={subscriptions}
                      page={page}
                      onPage={(next) =>
                        updateParams({ page: next === 1 ? null : String(next) })
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      {planDialog && (
        <SubscriptionPlanDialog
          item={editingPlan}
          open
          onOpenChange={setPlanDialog}
          onSaved={(saved) => {
            setPlans((current) =>
              current
                ? {
                    ...current,
                    data: current.data.some((item) => item.id === saved.id)
                      ? current.data.map((item) =>
                          item.id === saved.id ? saved : item,
                        )
                      : [saved, ...current.data],
                  }
                : current,
            );
            toast.success(`Plan ${saved.name} disimpan.`);
          }}
          onUnauthorized={() => void unauthorized()}
          onForbidden={forbidden}
        />
      )}
      {subscriptionDialog && (
        <PartnerSubscriptionDialog
          item={renewing}
          partners={partners}
          plans={plans?.data ?? []}
          open
          onOpenChange={setSubscriptionDialog}
          onSaved={(saved) => {
            setSubscriptions((current) =>
              current
                ? {
                    ...current,
                    data: current.data.some((item) => item.id === saved.id)
                      ? current.data.map((item) =>
                          item.id === saved.id ? saved : item,
                        )
                      : [saved, ...current.data],
                  }
                : current,
            );
            toast.success(
              `Subscription ${saved.partner?.company_name ?? "Partner tidak tersedia"} disimpan.`,
            );
          }}
          onUnauthorized={() => void unauthorized()}
          onForbidden={forbidden}
        />
      )}
      <AlertDialog
        open={deletingPlan !== null}
        onOpenChange={(open) => !open && !pending && setDeletingPlan(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Subscription Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Plan {deletingPlan?.name} akan dihapus. Backend menolak jika plan
              pernah digunakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => void removePlan()}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && !pending && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Konfirmasi perubahan Subscription
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction
                ? `${confirmAction.action} subscription ${confirmAction.item.partner?.company_name ?? "Partner tidak tersedia"}?`
                : "Ubah subscription?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={() => void runAction()}
            >
              Konfirmasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster position="top-right" />
    </div>
  );
}

function Empty({ text }: { readonly text: string }): ReactElement {
  return (
    <div className="grid min-h-56 place-items-center p-6 text-center text-muted-foreground">
      {text}
    </div>
  );
}
function ErrorCard({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}): ReactElement {
  return (
    <Card>
      <CardContent className="grid min-h-56 place-items-center p-6 text-center">
        <div>
          <p className="font-medium">Subscription gagal dimuat</p>
          <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          <Button className="mt-4" variant="outline" onClick={onRetry}>
            <RefreshCw /> Coba lagi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
function Pagination({
  response,
  page,
  onPage,
}: {
  readonly response: {
    readonly meta: {
      readonly from: number | null;
      readonly to: number | null;
      readonly total: number;
      readonly last_page: number;
    };
  };
  readonly page: number;
  readonly onPage: (page: number) => void;
}): ReactElement {
  return (
    <div className="flex items-center justify-between gap-3 border-t px-6 pt-4">
      <p className="text-sm text-muted-foreground">
        {response.meta.from ?? 0}–{response.meta.to ?? 0} dari{" "}
        {response.meta.total}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft /> Sebelumnya
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= response.meta.last_page}
          onClick={() => onPage(page + 1)}
        >
          Berikutnya <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
