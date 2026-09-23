import { useParams } from "react-router-dom";
import { parseId } from "@/lib/utils";
import { useAuth } from "@/features/auth/auth-context";
import { isSuperAdmin } from "@/features/auth/auth-access";
import {
  VOUCHER_STATUSES,
  type VoucherListResponse,
  type VoucherPackageRecord,
  type VoucherRecord,
} from "@/features/vouchers/voucher.types";
import { useEffect, useState, type FormEvent } from "react";
import {
  deleteVoucherPackage,
  getVoucherPackages,
  getVouchers,
  voidVoucher,
} from "@/features/vouchers/voucher-service";
import { getPartner } from "@/features/partners/partner-service";
import { ApiError } from "@/lib/api-client";
import { toast } from "sonner";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";

export function useVoucherDetail() {
  const { kioskId } = useParams<{ kioskId: string }>();
  const partnerId = parseId(kioskId);
  const { params, setParams, updateParams } = useUpdateSearchParams();
  const { token, handleUnauthorized, handleForbidden, handleApiError } =
    useApiErrorHandler({ forbiddenFrom: `/voucher/${partnerId}` });
  const { user } = useAuth();
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
  const [detailVoucher, setDetailVoucher] = useState<VoucherRecord | null>(
    null,
  );
  const [actionPending, setActionPending] = useState(false);

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
                { partner_id: partnerId ?? undefined, per_page: 100 },
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
            superAdmin && partnerId !== null
              ? getPartner(accessToken, partnerId, controller.signal)
              : Promise.resolve(null),
            Promise.all(packageRequests),
            getVouchers(
              accessToken,
              {
                partner_id: partnerId ?? undefined,
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
        if (handleApiError(caught)) return;
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
    packageFilter,
    page,
    partnerId,
    retry,
    search,
    status,
    superAdmin,
    token,
    handleUnauthorized,
    handleForbidden,
    updateParams,
    user,
    handleApiError,
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
      if (handleApiError(caught)) return;
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
      if (handleApiError(caught)) return;
      toast.error(
        caught instanceof ApiError
          ? caught.message
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setActionPending(false);
    }
  }

  return {
    partnerName,
    partnerId,
    packages,
    page,
    setPackages,
    superAdmin,
    search,
    updateParams,
    packageFilter,
    setParams,
    setVoidingVoucher,
    handleUnauthorized,
    handleForbidden,
    actionPending,
    deletingPackage,
    voidingVoucher,
    vouchers,
    state,
    error,
    setRetry,
    packageDialog,
    setPackageDialog,
    editingPackage,
    setEditingPackage,
    issueOpen,
    setIssueOpen,
    detailVoucher,
    setDetailVoucher,
    submitSearch,
    confirmDelete,
    confirmVoid,
    setDeletingPackage,
  };
}
