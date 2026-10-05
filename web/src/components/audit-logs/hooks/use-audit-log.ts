import { getAuditLogs } from "@/features/audit-logs/audit-log-service";
import type {
  AuditLogPage,
  AuditLogRecord,
} from "@/features/audit-logs/audit-log.types";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";
import { positiveInteger } from "@/lib/utils";
import { useState } from "react";

export function useAuditLog() {
  const { token } = useApiErrorHandler();
  const { params, updateParams, reset } = useUpdateSearchParams();
  const page = positiveInteger(params.get("page"), 1);
  const partnerId = positiveInteger(params.get("partner_id"));
  const action = params.get("action") ?? "";
  const [detail, setDetail] = useState<AuditLogRecord | null>(null);

  const { response, extra, state, error, setRetry } = usePaginatedList<
    AuditLogPage,
    ReadonlyArray<PartnerRecord>
  >({
    token,
    page,
    load: (accessToken, signal) =>
      getAuditLogs(
        accessToken,
        {
          partner_id: partnerId || undefined,
          action: action || undefined,
          page,
        },
        signal,
      ),
    loadExtra: (accessToken, signal) =>
      getPartners(accessToken, { per_page: 100 }, signal).then(
        (result) => result.data,
      ),
    onClampPage: (lastPage) =>
      updateParams({ page: lastPage > 1 ? String(lastPage) : null }),
    dependencies: [updateParams, action, partnerId],
  });

  const partners = extra ?? [];
  const partnerName = (id: number | null): string =>
    id
      ? (partners.find((partner) => partner.id === id)?.company_name ??
        `Partner #${id}`)
      : "Platform";
  const filtered = Boolean(partnerId || action);

  return {
    response,
    partners,
    state,
    error,
    setRetry,
    detail,
    setDetail,
    partnerId,
    reset,
    action,
    updateParams,
    partnerName,
    filtered,
  };
}
