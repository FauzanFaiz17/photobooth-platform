import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import { getCustomers } from "@/features/customers/customer-service";
import type {
  CustomerListResponse,
  CustomerRecord,
} from "@/features/customers/customer.types";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";
import { positiveInteger } from "@/lib/utils";
import { useState } from "react";

export function useCustomerList() {
  const { params, updateParams, reset, submitSearch } = useUpdateSearchParams();
  const { token, user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const { handleUnauthorized, handleForbidden } = useApiErrorHandler();

  const page = positiveInteger(params.get("page"), 1);
  const search = params.get("search") ?? "";
  const partnerId = positiveInteger(params.get("partner_id"), 0);

  const [detail, setDetail] = useState<CustomerRecord | null>(null);

  const { response, extra, state, error, setRetry } = usePaginatedList<
    CustomerListResponse,
    ReadonlyArray<PartnerRecord>
  >({
    token,
    page,
    load: (accessToken, signal) =>
      getCustomers(
        accessToken,
        {
          search: search || undefined,
          partner_id: superAdmin && partnerId ? partnerId : undefined,
          page,
        },
        signal,
      ),
    loadExtra: superAdmin
      ? (accessToken, signal) =>
          getPartners(accessToken, { per_page: 100 }, signal).then(
            (result) => result.data,
          )
      : undefined,
    onClampPage: (lastPage) =>
      updateParams({ page: lastPage > 1 ? String(lastPage) : null }),
    dependencies: [updateParams, search, partnerId, superAdmin],
  });

  const partners = extra ?? [];
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
    updateParams,
    reset,
    submitSearch,
    setRetry,
    setDetail,
    handleUnauthorized,
    handleForbidden,
  };
}
