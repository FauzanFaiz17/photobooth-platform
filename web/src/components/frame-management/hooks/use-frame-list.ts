import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

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
  readonly refresh: () => void;
  readonly updateQuery: (
    updates: Readonly<Record<string, string | null>>,
  ) => void;
  readonly handleUnauthorized: () => Promise<void>;
  readonly handleForbidden: () => void;
}

export function useFrameList(): UseFrameListResult {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user, logout } = useAuth();
  const superAdmin = isSuperAdmin(user);

  const querySearch = searchParams.get("search") ?? "";
  const statusParam = searchParams.get("status");
  const status: TemplateStatus | "all" = isStatus(statusParam)
    ? statusParam
    : "all";
  const typeParam = searchParams.get("type");
  const activeType: TemplateType = typeParam === "gif" ? "gif" : "photo";
  const paperSizeParam = searchParams.get("paper_size");
  const activePaperSize: TemplatePaperSize | "all" =
    paperSizeParam === "2r" || paperSizeParam === "4r" ? paperSizeParam : "all";
  const page = parsePositiveInteger(searchParams.get("page"), 1);

  const [response, setResponse] = useState<TemplateListResponse | null>(null);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const updateQuery = useCallback(
    (updates: Readonly<Record<string, string | null>>) => {
      setSearchParams(
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
    [setSearchParams],
  );

  const handleUnauthorized = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true, state: { from: location } });
  }, [location, logout, navigate]);

  const handleForbidden = useCallback(() => {
    navigate("/admin/forbidden", {
      replace: true,
      state: { from: location.pathname },
    });
  }, [location.pathname, navigate]);

  const refresh = useCallback(() => {
    setRetryKey((value) => value + 1);
  }, []);

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
          updateQuery({
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
        if (error instanceof ApiError && error.status === 401)
          return void handleUnauthorized();
        if (error instanceof ApiError && error.status === 403)
          return handleForbidden();
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
    handleForbidden,
    handleUnauthorized,
    page,
    querySearch,
    retryKey,
    status,
    superAdmin,
    token,
    updateQuery,
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
    refresh,
    updateQuery,
    handleUnauthorized,
    handleForbidden,
  };
}
