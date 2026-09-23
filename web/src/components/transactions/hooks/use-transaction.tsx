import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import { getPayments } from "@/features/payments/payment-service";
import {
  isPaymentGateway,
  isPaymentStatus,
  type PaymentListResponse,
  type PaymentRecord,
} from "@/features/payments/payment.types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";
import { ApiError } from "@/lib/api-client";
import { positiveInteger } from "@/lib/utils";
import { useEffect, useState } from "react";

export function useTransaction() {
  const { params, setParams, updateParams } = useUpdateSearchParams();
  const { handleForbidden, handleUnauthorized, handleApiError, token } =
    useApiErrorHandler();
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const page = positiveInteger(params.get("page"), 1);
  const perPage = positiveInteger(params.get("per_page"), 10);
  const search = params.get("search") ?? "";
  const gatewayParam = params.get("gateway");
  const gateway = isPaymentGateway(gatewayParam) ? gatewayParam : undefined;
  const statusParam = params.get("status");
  const status = isPaymentStatus(statusParam) ? statusParam : undefined;
  const partnerId = positiveInteger(params.get("partner_id"), 0);
  const [response, setResponse] = useState<PaymentListResponse | null>(null);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [detail, setDetail] = useState<PaymentRecord | null>(null);
  const [transitioning, setTransitioning] = useState<PaymentRecord | null>(
    null,
  );

  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    const controller = new AbortController();
    async function load(): Promise<void> {
      setState("loading");
      setError("");
      try {
        const [paymentsResult, partnersResult] = await Promise.all([
          getPayments(
            accessToken,
            {
              partner_id: partnerId || undefined,
              gateway,
              status,
              search: search || undefined,
              sort: "created_at",
              direction: "desc",
              per_page: perPage,
              page,
            },
            controller.signal,
          ),
          superAdmin
            ? getPartners(accessToken, { per_page: 100 }, controller.signal)
            : Promise.resolve(null),
        ]);
        if (controller.signal.aborted) return;
        if (page > Math.max(1, paymentsResult.meta.last_page)) {
          updateParams({
            page:
              paymentsResult.meta.last_page > 1
                ? String(paymentsResult.meta.last_page)
                : null,
          });
          return;
        }
        setResponse(paymentsResult);
        setPartners(partnersResult?.data ?? []);
        setState("success");
      } catch (caught: unknown) {
        if (controller.signal.aborted) return;
        if (handleApiError(caught)) return;
        setResponse(null);
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
    gateway,
    handleApiError,
    page,
    partnerId,
    perPage,
    retry,
    search,
    status,
    superAdmin,
    token,
    updateParams,
  ]);

  return {
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
  };
}
