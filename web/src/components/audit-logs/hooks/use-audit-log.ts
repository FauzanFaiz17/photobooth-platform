import { getAuditLogs } from "@/features/audit-logs/audit-log-service";
import type {
  AuditLogPage,
  AuditLogRecord,
} from "@/features/audit-logs/audit-log.types";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";
import { ApiError } from "@/lib/api-client";
import { positiveInteger } from "@/lib/utils";
import { useEffect, useState } from "react";

export function useAuditLog() {
  const { handleApiError, token } = useApiErrorHandler();
  const { params, updateParams, reset } = useUpdateSearchParams();
  const page = positiveInteger(params.get("page"), 1);
  const partnerId = positiveInteger(params.get("partner_id"));
  const action = params.get("action") ?? "";
  const [response, setResponse] = useState<AuditLogPage | null>(null);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [detail, setDetail] = useState<AuditLogRecord | null>(null);

  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    const controller = new AbortController();
    async function load(): Promise<void> {
      setState("loading");
      setError("");
      try {
        const [logs, partnerResult] = await Promise.all([
          getAuditLogs(
            accessToken,
            {
              partner_id: partnerId || undefined,
              action: action || undefined,
              page,
            },
            controller.signal,
          ),
          getPartners(accessToken, { per_page: 100 }, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (page > Math.max(1, logs.meta.last_page)) {
          updateParams({
            page: logs.meta.last_page > 1 ? String(logs.meta.last_page) : null,
          });
          return;
        }
        setResponse(logs);
        setPartners(partnerResult.data);
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
  }, [action, page, partnerId, retry, token, updateParams, handleApiError]);

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
    filtered
  }
}
