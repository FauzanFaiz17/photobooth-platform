import { useCallback, useEffect, useState } from "react";

import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import { getTemplates } from "@/features/templates/template-service";
import type {
  TemplateListResponse,
  TemplatePaperSize,
  TemplateStatus,
  TemplateType,
} from "@/features/templates/template.types";
import { ApiError } from "@/lib/api-client";

import { isStatus, parsePositiveInteger } from "../utils";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";

type LoadState = "loading" | "success" | "error";

interface UseFrameListResult {
  readonly loadState: LoadState;
  readonly response: TemplateListResponse | null;
  readonly partners: ReadonlyArray<PartnerRecord>;
  readonly errorMessage: string;
  readonly filtered: boolean;
  readonly canCreate: boolean;
  readonly activeType: TemplateType;
  readonly activePaperSize: TemplatePaperSize | "all";
  readonly querySearch: string;
  readonly status: TemplateStatus | "all";
  readonly refresh: () => void;
  readonly reset: () => void;
  readonly updateParams: (
    updates: Readonly<Record<string, string | null>>,
  ) => void;
  readonly handleUnauthorized: () => Promise<void>;
  readonly handleForbidden: () => void;
}

export function useFrameList(): UseFrameListResult {
  const {params, setParams, updateParams} = useUpdateSearchParams()
  const {handleForbidden, handleUnauthorized, handleApiError, token} =
    useApiErrorHandler({ forbiddenFrom: "/frame-photo" })
  const { user } = useAuth();
  const superAdmin = isSuperAdmin(user);

  const querySearch = params.get("search") ?? "";
  const statusParam = params.get("status");
  const status: TemplateStatus | "all" = isStatus(statusParam)
    ? statusParam
    : "all";
  const typeParam = params.get("type");
  const activeType: TemplateType = typeParam === "gif" ? "gif" : "photo";
  const paperSizeParam = params.get("paper_size");
  const activePaperSize: TemplatePaperSize | "all" =
    paperSizeParam === "2r" || paperSizeParam === "4r" ? paperSizeParam : "all";
  const page = parsePositiveInteger(params.get("page"), 1);

  const [response, setResponse] = useState<TemplateListResponse | null>(null);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);


  const refresh = useCallback(() => {
    setRetryKey((value) => value + 1);
  }, []);

  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    const controller = new AbortController();

    async function loadFrames() {
      setLoadState("loading");
      setErrorMessage("");
      try {
        const [framesResult, partnersResult] = await Promise.all([
          getTemplates(
            accessToken,
            {
              search: querySearch || undefined,
              status: status === "all" ? undefined : status,
              sort: "updated_at",
              direction: "desc",
              per_page: 100,
              page,
            },
            controller.signal,
          ),
          superAdmin
            ? getPartners(
                accessToken,
                { status: "active", per_page: 100 },
                controller.signal,
              )
            : Promise.resolve(null),
        ]);
        if (controller.signal.aborted) return;

        const filteredData = framesResult.data.filter(
          (t) =>
            (t.type ?? "photo") === activeType &&
            (activePaperSize === "all" || t.paper_size === activePaperSize),
        );
        const filteredResponse: TemplateListResponse = {
          ...framesResult,
          data: filteredData,
          meta: {
            ...framesResult.meta,
            total: filteredData.length,
            last_page: Math.max(1, Math.ceil(filteredData.length / 12)),
          },
        };

        if (page > Math.max(1, filteredResponse.meta.last_page)) {
          updateParams({
            page:
              filteredResponse.meta.last_page > 1
                ? String(filteredResponse.meta.last_page)
                : null,
          });
          return;
        }
        setResponse(filteredResponse);
        setPartners(partnersResult?.data ?? []);
        setLoadState("success");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (handleApiError(error)) return;
        setResponse(null);
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server.",
        );
        setLoadState("error");
      }
    }

    void loadFrames();
    return () => controller.abort();
  }, [
    activePaperSize,
    activeType,
    page,
    querySearch,
    retryKey,
    status,
    superAdmin,
    token,
    updateParams,
    handleApiError
  ]);

  const filtered = Boolean(querySearch || status !== "all" || activePaperSize !== "all");
  const defaultPartnerId = user?.partner?.id ?? null;
  const canCreate = !superAdmin
    ? defaultPartnerId !== null
    : partners.length > 0;

  return {
    loadState,
    response,
    partners,
    errorMessage,
    filtered,
    canCreate,
    activeType,
    activePaperSize,
    querySearch,
    status,
    refresh,
    reset,
    handleUnauthorized,
    handleForbidden,
    updateParams,
  };
}
