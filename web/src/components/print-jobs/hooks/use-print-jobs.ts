import { useEffect, useMemo, useState } from "react";

import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import { getPrintJobs } from "@/features/print-jobs/print-job-service";
import {
  PRINT_JOB_STATUSES,
  isPrintJobStatus,
  type PrintJobListResponse,
  type PrintJobRecord,
  type PrintJobStatus,
} from "@/features/print-jobs/print-job.types";
import { getPrinters } from "@/features/printers/printer-service";
import type { PrinterRecord } from "@/features/printers/printer.types";
import { ApiError } from "@/lib/api-client";
import { positive } from "../utils";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";

export function usePrintJobs() {
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const { params, updateParams } = useUpdateSearchParams();
  const { handleApiError, handleForbidden, handleUnauthorized, token } =
    useApiErrorHandler();

  const page = positive(params.get("page"), 1);
  const statusParam = params.get("status");
  const status = isPrintJobStatus(statusParam) ? statusParam : undefined;
  const partnerId = positive(params.get("partner_id"), 0);
  const printerId = positive(params.get("printer_id"), 0);

  const [response, setResponse] = useState<PrintJobListResponse | null>(null);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [printers, setPrinters] = useState<ReadonlyArray<PrinterRecord>>([]);
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [detail, setDetail] = useState<PrintJobRecord | null>(null);
  const [action, setAction] = useState<PrintJobRecord | null>(null);

  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    const controller = new AbortController();

    async function load(): Promise<void> {
      setState("loading");
      setError("");
      try {
        const [jobs, partnerResult, printerResult] = await Promise.all([
          getPrintJobs(
            accessToken,
            {
              partner_id: partnerId || undefined,
              printer_id: printerId || undefined,
              status,
              per_page: 10,
              page,
            },
            controller.signal,
          ),
          superAdmin
            ? getPartners(accessToken, { per_page: 100 }, controller.signal)
            : Promise.resolve(null),
          getPrinters(
            accessToken,
            { partner_id: partnerId || undefined, per_page: 100 },
            controller.signal,
          ),
        ]);
        if (controller.signal.aborted) return;
        if (page > Math.max(1, jobs.meta.last_page)) {
          updateParams({
            page: jobs.meta.last_page > 1 ? String(jobs.meta.last_page) : null,
          });
          return;
        }
        setResponse(jobs);
        setPartners(partnerResult?.data ?? []);
        setPrinters(printerResult.data);
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
    printerId,
    retryKey,
    status,
    superAdmin,
    token,
    updateParams,
  ]);

  const counts = useMemo(() => {
    const rows = response?.data ?? [];
    return Object.fromEntries(
      PRINT_JOB_STATUSES.map((item) => [
        item,
        rows.filter((job) => job.status === item).length,
      ]),
    ) as Record<PrintJobStatus, number>;
  }, [response]);

  const filtered = Boolean(status || partnerId || printerId);

  return {
    response,
    partners,
    printers,
    state,
    error,
    detail,
    action,
    superAdmin,
    page,
    partnerId,
    printerId,
    status,
    counts,
    filtered,
    updateParams,
    setRetryKey,
    setDetail,
    setAction,
    handleUnauthorized,
    handleForbidden,
  };
}
