import { getBooths } from "@/features/booths/booth-service";
import type { BoothRecord } from "@/features/booths/booth.types";
import { getEvents } from "@/features/events/event-service";
import type { EventListResponse } from "@/features/events/event.types";
import { ApiError } from "@/lib/api-client";
import { useEffect, useState, type FormEvent } from "react";
import { isEventStatus } from "@/features/events/event.types";
import { useEventHandler } from "./use-event-handler";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function useEventList() {
  const { params, setParams, updateParams } = useUpdateSearchParams();
  const { token, handleApiError } = useEventHandler();

  const querySearch = params.get("search") ?? "";
  const statusParam = params.get("status");
  const status = isEventStatus(statusParam) ? statusParam : "all";
  const boothId = parsePositiveInteger(params.get("booth_id"), 0);
  const dateFrom = params.get("date_from") ?? "";
  const dateTo = params.get("date_to") ?? "";
  const page = parsePositiveInteger(params.get("page"), 1);

  const [response, setResponse] = useState<EventListResponse | null>(null);
  const [booths, setBooths] = useState<ReadonlyArray<BoothRecord>>([]);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    const controller = new AbortController();

    async function loadEvents() {
      setLoadState("loading");
      setErrorMessage("");
      try {
        const [eventsResult, boothsResult] = await Promise.all([
          getEvents(
            accessToken,
            {
              search: querySearch || undefined,
              status: status === "all" ? undefined : status,
              booth_id: boothId || undefined,
              date_from: dateFrom || undefined,
              date_to: dateTo || undefined,
              sort: "event_date",
              direction: "desc",
              per_page: 10,
              page,
            },
            controller.signal,
          ),
          getBooths(accessToken, { per_page: 100 }, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        if (page > Math.max(1, eventsResult.meta.last_page)) {
          updateParams({
            page:
              eventsResult.meta.last_page > 1
                ? String(eventsResult.meta.last_page)
                : null,
          });
          return;
        }
        setResponse(eventsResult);
        setBooths(boothsResult.data);
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

    void loadEvents();

    return () => controller.abort();
  }, [
    boothId,
    dateFrom,
    dateTo,
    handleApiError,
    page,
    querySearch,
    retryKey,
    status,
    token,
    updateParams,
  ]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search");
    updateParams({
      search: typeof value === "string" ? value.trim() || null : null,
      page: null,
    });
  }

  const filtered = Boolean(
    querySearch || status !== "all" || boothId || dateFrom || dateTo,
  );

  return {
    response,
    booths,
    loadState,
    errorMessage,
    retryKey,
    filtered,
    querySearch,
    status,
    boothId,
    dateFrom,
    dateTo,
    page,
    updateParams,
    submitSearch,
    setRetryKey,
    setParams,
  };
}
