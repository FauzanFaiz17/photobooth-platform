import { CircleAlert, Plus, RefreshCw, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { getFilters } from "@/features/filters/filter-service";
import type { FilterRecord } from "@/features/filters/filter.types";
import { ApiError } from "@/lib/api-client";

import { FilterCard } from "./filter-card";
import { FilterDeleteDialog } from "./filter-delete-dialog";
import { FilterFormDialog } from "./filter-form-dialog";

export function FilterTab({
  partnerId,
  onUnauthorized,
  onForbidden,
}: {
  readonly partnerId: number;
  readonly onUnauthorized: () => void;
  readonly onForbidden: () => void;
}) {
  const { token } = useAuth();
  const [filters, setFilters] = useState<ReadonlyArray<FilterRecord>>([]);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [formFilter, setFormFilter] = useState<FilterRecord | null | undefined>(
    undefined,
  );
  const [deleteTarget, setDeleteTarget] = useState<FilterRecord | null>(null);
  const refresh = useCallback(() => setRetryKey((value) => value + 1), []);

  useEffect(() => {
    if (!token) return;
    const accessToken = token;
    const controller = new AbortController();

    async function loadFilters() {
      setLoadState("loading");
      setErrorMessage("");
      try {
        const [partnerFilters, globalFilters] = await Promise.all([
          getFilters(
            accessToken,
            { scope: "partner", partner_id: partnerId, per_page: 100 },
            controller.signal,
          ),
          getFilters(
            accessToken,
            { scope: "global", per_page: 100 },
            controller.signal,
          ),
        ]);
        if (controller.signal.aborted) return;
        setFilters([...partnerFilters.data, ...globalFilters.data]);
        setLoadState("success");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401)
          return onUnauthorized();
        if (error instanceof ApiError && error.status === 403)
          return onForbidden();
        setFilters([]);
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : "Tidak dapat terhubung ke server.",
        );
        setLoadState("error");
      }
    }

    void loadFilters();
    return () => controller.abort();
  }, [onForbidden, onUnauthorized, partnerId, retryKey, token]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Filters</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter Partner berlaku untuk seluruh Booth; Filter Global hanya
            ditampilkan sebagai referensi.
          </p>
        </div>
        <Button onClick={() => setFormFilter(null)}>
          <Plus aria-hidden="true" /> Tambah Filter
        </Button>
      </div>
      {loadState === "loading" && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-80 rounded-xl" />
          ))}
        </div>
      )}
      {loadState === "error" && (
        <Card>
          <CardContent className="grid min-h-56 place-items-center text-center">
            <div>
              <CircleAlert className="mx-auto size-9 text-destructive" />
              <p className="mt-3 font-medium">Filter gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <Button className="mt-4" variant="outline" onClick={refresh}>
                <RefreshCw aria-hidden="true" /> Coba lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {loadState === "success" && filters.length === 0 && (
        <Card>
          <CardContent className="grid min-h-56 place-items-center text-center">
            <div>
              <SlidersHorizontal className="mx-auto size-9 text-muted-foreground" />
              <p className="mt-3 font-medium">Belum ada Filter</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tambahkan Filter pertama untuk Partner ini.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {loadState === "success" && filters.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filters.map((filter) => (
            <FilterCard
              key={filter.id}
              filter={filter}
              onEdit={
                filter.is_global ? undefined : () => setFormFilter(filter)
              }
              onDelete={
                filter.is_global ? undefined : () => setDeleteTarget(filter)
              }
            />
          ))}
        </div>
      )}
      <div className="rounded-lg border p-3 text-sm text-muted-foreground">
        <SlidersHorizontal className="mr-2 inline size-4" aria-hidden="true" />
        Filter aktif dapat dipilih ketika membuat Event dan disimpan sebagai
        snapshot konfigurasi.
      </div>

      {formFilter !== undefined && (
        <FilterFormDialog
          key={formFilter?.id ?? "new-filter"}
          partnerId={partnerId}
          filter={formFilter}
          open
          onOpenChange={(open) => !open && setFormFilter(undefined)}
          onSaved={(saved, isNew) => {
            toast.success(
              isNew
                ? `Filter ${saved.name} ditambahkan.`
                : `Filter ${saved.name} diperbarui.`,
            );
            refresh();
          }}
          onUnauthorized={onUnauthorized}
          onForbidden={onForbidden}
        />
      )}
      {deleteTarget && (
        <FilterDeleteDialog
          key={deleteTarget.id}
          filter={deleteTarget}
          open
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onDeleted={(deleted) => {
            setDeleteTarget(null);
            toast.success(`Filter ${deleted.name} dihapus.`);
            refresh();
          }}
          onUnauthorized={onUnauthorized}
          onForbidden={onForbidden}
        />
      )}
    </div>
  );
}
