import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import {
  getCustomers,
} from "@/features/customers/customer-service";
import type {
  CustomerListResponse,
  CustomerRecord,
} from "@/features/customers/customer.types";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import { ApiError } from "@/lib/api-client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useEventHandler } from "@/components/events/hooks/use-event-handler";

function positive(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function useCustomerList() {
  const [params, setParams] = useSearchParams();
  const { token, user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const { handleApiError, handleUnauthorized, handleForbidden } = useEventHandler();

  const page = positive(params.get("page"), 1);
  const search = params.get("search") ?? "";
  const partnerId = positive(params.get("partner_id"), 0);

  const [response, setResponse] = useState<CustomerListResponse | null>(null);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [detail, setDetail] = useState<CustomerRecord | null>(null);

  const update = useCallback(
    (values: Readonly<Record<string, string | null>>) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(values)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  const reset = useCallback(
    () => setParams(new URLSearchParams(), { replace: true }),
    [setParams],
  );

  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    const controller = new AbortController();
    async function load(): Promise<void> {
      setState("loading");
      setError("");
      try {
        const [customers, partnerResult] = await Promise.all([
          getCustomers(
            accessToken,
            {
              search: search || undefined,
              partner_id: superAdmin && partnerId ? partnerId : undefined,
              page,
            },
            controller.signal,
          ),
          superAdmin
            ? getPartners(accessToken, { per_page: 100 }, controller.signal)
            : Promise.resolve(null),
        ]);
        if (controller.signal.aborted) return;
        if (page > Math.max(1, customers.meta.last_page)) {
          update({
            page:
              customers.meta.last_page > 1
                ? String(customers.meta.last_page)
                : null,
          });
          return;
        }
        setResponse(customers);
        setPartners(partnerResult?.data ?? []);
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
    handleApiError,
    page,
    partnerId,
    retry,
    search,
    superAdmin,
    token,
    update,
  ]);

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search");
    update({
      search: typeof value === "string" ? value.trim() || null : null,
      page: null,
    });
  }

  const partnerName = (id: number | null): string =>
    id
      ? (partners.find((partner) => partner.id === id)?.company_name ??
        `Partner #${id}`)
      : "Tanpa Partner";

  const filtered = Boolean(search || (superAdmin && partnerId));

  return {
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
    update,
    reset,
    submitSearch,
    setRetry,
    setDetail,
    handleUnauthorized,
    handleForbidden,
  };
}
