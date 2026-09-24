import { getEvent } from "@/features/events/event-service";
import type { EventRecord } from "@/features/events/event.types";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { ApiError } from "@/lib/api-client";
import { useEffect, useState } from "react";

export function useEventDetail(eventId: number | null) {
  const { token, handleUnauthorized, handleForbidden, handleApiError } =
    useApiErrorHandler();
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [loadState, setLoadState] = useState<
    "loading" | "success" | "not-found" | "error"
  >("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = () => {
    setRetryKey((value) => value + 1);
  };

  useEffect(() => {
    if (!token || eventId === null) return;
    const accessToken = token;
    const requestedEventId = eventId;
    const controller = new AbortController();

    async function loadEvent() {
      setLoadState("loading");
      setErrorMessage("");
      try {
        const result = await getEvent(
          accessToken,
          requestedEventId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setEvent(result);
        setLoadState("success");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (handleApiError(error)) return;
        if (error instanceof ApiError && error.status === 404)
          return setLoadState("not-found");
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server.",
        );
        setLoadState("error");
      }
    }

    void loadEvent();
    return () => controller.abort();
  }, [eventId, handleApiError, retryKey, token]);

  return {
    event,
    loadState,
    errorMessage,
    retryKey,
    handleUnauthorized,
    handleForbidden,
    handleRetry,
  };
}
