import { useEffect, useMemo, useState } from "react";

import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import { getPartner } from "@/features/partners/partner-service";
import { ApiError } from "@/lib/api-client";

function extractIds(
  pathname: string,
  searchParams: URLSearchParams,
): ReadonlyArray<{ type: "partner" | "event"; id: number }> {
  const segments = pathname.split("/").filter(Boolean);
  const routeSegments = segments[0] === "admin" ? segments.slice(1) : segments;
  const section = routeSegments[0];
  const detail = routeSegments[1];

  const ids: Array<{ type: "partner" | "event"; id: number }> = [];

  if (section === "kiosk" && detail) {
    const parsed = Number(detail);
    if (Number.isInteger(parsed) && parsed > 0) {
      ids.push({ type: "partner", id: parsed });
    }
  }

  if (section === "gallery") {
    const partnerId = searchParams.get("partner_id");
    const eventId = searchParams.get("event_id");
    if (partnerId) {
      const parsed = Number(partnerId);
      if (Number.isInteger(parsed) && parsed > 0) {
        ids.push({ type: "partner", id: parsed });
      }
    }
    if (eventId) {
      const parsed = Number(eventId);
      if (Number.isInteger(parsed) && parsed > 0) {
        ids.push({ type: "event", id: parsed });
      }
    }
  }

  return ids;
}

export function useBreadcrumbLabels(
  pathname: string,
  searchParams: URLSearchParams,
): Map<string, string> {
  const { token, user } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const ids = useMemo(
    () => extractIds(pathname, searchParams),
    [pathname, searchParams],
  );
  const [labels, setLabels] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!token || !superAdmin || ids.length === 0) return;

    const controller = new AbortController();
    const accessToken = token;

    async function resolve(): Promise<void> {
      const next = new Map<string, string>();

      await Promise.all(
        ids.map(async (item) => {
          if (item.type === "partner") {
            try {
              const partner = await getPartner(
                accessToken,
                item.id,
                controller.signal,
              );
              if (!controller.signal.aborted) {
                const name = partner.brand_name || partner.company_name;
                next.set(`partner:${item.id}`, name);
              }
            } catch (error: unknown) {
              if (controller.signal.aborted) return;
              if (error instanceof ApiError && error.status === 404) {
                next.set(`partner:${item.id}`, `Partner #${item.id}`);
              }
            }
          }
        }),
      );

      if (!controller.signal.aborted) {
        setLabels(next);
      }
    }

    void resolve();
    return () => controller.abort();
  }, [ids, superAdmin, token]);

  return labels;
}
