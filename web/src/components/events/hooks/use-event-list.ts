import { getBooths } from "@/features/booths/booth-service";
import type { BoothRecord } from "@/features/booths/booth.types";
import { getEvents } from "@/features/events/event-service";
import {
  isEventStatus,
  type EventListResponse,
} from "@/features/events/event.types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { useUpdateSearchParams } from "@/hooks/use-update-search-params";
import { positiveInteger } from "@/lib/utils";

export function useEventList() {
  const { params, updateParams, reset, submitSearch } = useUpdateSearchParams();
  const { token } = useApiErrorHandler();

  const querySearch = params.get("search") ?? "";
  const statusParam = params.get("status");
  const status = isEventStatus(statusParam) ? statusParam : "all";
  const boothId = positiveInteger(params.get("booth_id"), 0);
  const dateFrom = params.get("date_from") ?? "";
  const dateTo = params.get("date_to") ?? "";
  const page = positiveInteger(params.get("page"), 1);

  const { response, extra, state, error, retry, setRetry } = usePaginatedList<
    EventListResponse,
    ReadonlyArray<BoothRecord>
  >({
    token,
    page,
    load: (accessToken, signal) =>
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
        signal,
      ),
    loadExtra: (accessToken, signal) =>
      getBooths(accessToken, { per_page: 100 }, signal).then(
        (result) => result.data,
      ),
    onClampPage: (lastPage) =>
      updateParams({ page: lastPage > 1 ? String(lastPage) : null }),
    dependencies: [updateParams, querySearch, status, boothId, dateFrom, dateTo],
  });

  const filtered = Boolean(
    querySearch || status !== "all" || boothId || dateFrom || dateTo,
  );

  return {
    response,
    booths: extra ?? [],
    loadState: state,
    errorMessage: error,
    retryKey: retry,
    filtered,
    querySearch,
    status,
    boothId,
    dateFrom,
    dateTo,
    page,
    updateParams,
    submitSearch,
    setRetryKey: setRetry,
    reset,
  };
}
