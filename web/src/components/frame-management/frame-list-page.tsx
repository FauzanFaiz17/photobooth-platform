import { Plus } from "lucide-react";
import { useCallback, useState, type ReactElement } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TemplateRecord } from "@/features/templates/template.types";

import { FrameDeleteDialog } from "./frame-delete-dialog";
import { FrameListPagination } from "./components/frame-list-pagination";
import {
  FrameListEmptyState,
  FrameListErrorState,
  FrameListLoadingState,
} from "./components/frame-list-states";
import FrameCard from "./components/frame-card";
import { FrameListToolbar } from "./components/frame-list-toolbar";
import { useFrameList } from "./hooks/use-frame-list";
import SectionHeader from "../shared/section-header";

export function FrameListPage(): ReactElement {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteTarget, setDeleteTarget] = useState<TemplateRecord | null>(null);

  const {
    loadState,
    response,
    errorMessage,
    filtered,
    canCreate,
    activeType,
    activePaperSize,
    refresh,
    updateQuery,
    handleUnauthorized,
    handleForbidden,
  } = useFrameList();

  const querySearch = searchParams.get("search") ?? "";
  const statusParam = searchParams.get("status") ?? "all";

  const handleSearchChange = useCallback(
    (search: string) => {
      updateQuery({ search: search || null, page: null });
    },
    [updateQuery],
  );

  const handleStatusChange = useCallback(
    (nextStatus: string) => {
      updateQuery({
        status: nextStatus === "all" ? null : nextStatus,
        page: null,
      });
    },
    [updateQuery],
  );

  const handleTypeChange = useCallback(
    (nextType: string) => {
      updateQuery({
        type: nextType === "photo" ? null : nextType,
        page: null,
      });
    },
    [updateQuery],
  );

  const handlePaperSizeChange = useCallback(
    (nextSize: string) => {
      updateQuery({
        paper_size: nextSize === "all" ? null : nextSize,
        page: null,
      });
    },
    [updateQuery],
  );

  const handleReset = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <SectionHeader
        heading={activeType === "gif" ? "Frame GIF" : "Frame Photo"}
        description="Kelola Frame yang digunakan sebagai Template konfigurasi Event."
        onAction={() => navigate("/frame-photo/create")}
        actionDisabled={loadState !== "success" || !canCreate}
        actionLabel={
          <>
            <Plus aria-hidden="true" />
            {activeType === "gif" ? "Tambah Frame GIF" : "Tambah Frame"}
          </>
        }
      />

      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daftar Frame</CardTitle>
              <CardDescription>
                Frame Global bersifat read-only; Frame Partner dapat dikelola.
              </CardDescription>
            </div>
            <Tabs value={activeType} onValueChange={handleTypeChange}>
              <TabsList>
                <TabsTrigger value="photo">Photo</TabsTrigger>
                <TabsTrigger value="gif">GIF</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <FrameListToolbar
            initialSearch={querySearch}
            status={statusParam as "all" | "draft" | "published" | "archived"}
            paperSize={activePaperSize}
            canReset={filtered}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusChange}
            onPaperSizeChange={handlePaperSizeChange}
            onReset={handleReset}
          />
        </CardHeader>
        <CardContent>
          {loadState === "loading" && <FrameListLoadingState />}

          {loadState === "error" && (
            <FrameListErrorState message={errorMessage} onRetry={refresh} />
          )}

          {loadState === "success" && response && (
            <>
              {response.data.length === 0 ? (
                <FrameListEmptyState filtered={filtered} onReset={handleReset} />
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {response.data.map((frame) => (
                      <FrameCard
                        key={frame.id}
                        frame={frame}
                        onExpired={refresh}
                        onEdit={
                          frame.is_global
                            ? undefined
                            : () => navigate(`/frame-photo/${frame.id}/edit`)
                        }
                        onDelete={
                          frame.is_global
                            ? undefined
                            : () => setDeleteTarget(frame)
                        }
                      />
                    ))}
                  </div>
                  <FrameListPagination
                    meta={response.meta}
                    onPageChange={(nextPage) =>
                      updateQuery({
                        page: nextPage === 1 ? null : String(nextPage),
                      })
                    }
                  />
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {deleteTarget && (
        <FrameDeleteDialog
          frame={deleteTarget}
          open
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onDeleted={(deleted) => {
            setDeleteTarget(null);
            toast.success(`Frame ${deleted.name} dihapus.`);
            refresh();
          }}
          onUnauthorized={() => void handleUnauthorized()}
          onForbidden={handleForbidden}
        />
      )}
      <Toaster position="top-right" />
    </div>
  );
}
