import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import { getGalleries } from "@/features/galleries/gallery-service";
import type { GalleryListResponse } from "@/features/galleries/gallery.types";
import { getEvents } from "@/features/events/event-service";
import type { EventRecord } from "@/features/events/event.types";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import { ApiError } from "@/lib/api-client";

import { parsePositiveInteger } from "../utils";

type LoadState = "loading" | "success" | "error";

export function useGalleryList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user, logout } = useAuth();
  const superAdmin = isSuperAdmin(user);

  const partnerParam = searchParams.get("partner_id");
  const eventParam = searchParams.get("event_id");
  const page = parsePositiveInteger(searchParams.get("page"), 1);

  const [response, setResponse] = useState<GalleryListResponse | null>(null);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [events, setEvents] = useState<ReadonlyArray<EventRecord>>([]);
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
    const partnerId = superAdmin ? parsePositiveInteger(partnerParam, 0) : 0;

    async function loadGalleries() {
      setLoadState("loading");
      setErrorMessage("");
      try {
        const [galleriesResult, partnersResult, eventsResult] =
          await Promise.all([
            getGalleries(
              accessToken,
              { partner_id: partnerId || undefined, per_page: 12, page },
              controller.signal,
            ),
            superAdmin
              ? getPartners(
                  accessToken,
                  { status: "active", per_page: 100 },
                  controller.signal,
                )
              : Promise.resolve(null),
            partnerId
              ? getEvents(
                  accessToken,
                  { partner_id: partnerId, per_page: 100 },
                  controller.signal,
                )
              : Promise.resolve(null),
          ]);
        if (controller.signal.aborted) return;
        if (page > Math.max(1, galleriesResult.meta.last_page)) {
          updateQuery({
            page:
              galleriesResult.meta.last_page > 1
                ? String(galleriesResult.meta.last_page)
                : null,
          });
          return;
        }
        setResponse(galleriesResult);
        setPartners(partnersResult?.data ?? []);
        setEvents(eventsResult?.data ?? []);
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

    void loadGalleries();
    return () => controller.abort();
  }, [
    eventParam,
    handleForbidden,
    handleUnauthorized,
    page,
    partnerParam,
    retryKey,
    superAdmin,
    token,
    updateQuery,
  ]);

  const filtered = Boolean(partnerParam);
  const selectedEventId = eventParam ? Number(eventParam) : null;

  const partnerOptions = superAdmin
    ? partners
    : user?.partner
      ? [
          {
            id: user.partner.id,
            company_name: user.partner.company_name,
            brand_name: user.partner.brand_name,
          },
        ]
      : [];

  const eventGroups = [
    ...new Set(
      (response?.data ?? [])
        .map((gallery) => gallery.event_id)
        .filter((id): id is number => id !== null),
    ),
  ];

  const visibleGalleries = selectedEventId
    ? (response?.data ?? []).filter(
        (gallery) => gallery.event_id === selectedEventId,
      )
    : [];

  function openPartner(id: number) {
    updateQuery({ partner_id: String(id), page: null });
  }

  function openEvent(id: number) {
    updateQuery({ event_id: String(id), page: null });
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  return {
    loadState,
    errorMessage,
    response,
    partners,
    events,
    superAdmin,
    filtered,
    selectedEventId,
    partnerParam,
    partnerOptions,
    eventGroups,
    visibleGalleries,
    updateQuery,
    openPartner,
    openEvent,
    resetFilters,
    refresh,
    handleUnauthorized,
    handleForbidden,
  };
}
