import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Frame,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { isSuperAdmin } from "@/features/auth/auth-access";
import { useAuth } from "@/features/auth/auth-context";
import { getPartners } from "@/features/partners/partner-service";
import type { PartnerRecord } from "@/features/partners/partner.types";
import { getTemplates } from "@/features/templates/template-service";
import { shotColor } from "@/features/templates/shot-colors";
import {
  TEMPLATE_STATUSES,
  type TemplateListResponse,
  type TemplatePaperSize,
  type TemplateRecord,
  type TemplateStatus,
} from "@/features/templates/template.types";
import { ApiError, resolveStorageUrl } from "@/lib/api-client";

import { FrameDeleteDialog } from "./frame-delete-dialog";

const statusLabels: Record<TemplateStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isStatus(value: string | null): value is TemplateStatus {
  return TEMPLATE_STATUSES.some((status) => status === value);
}

interface LayoutSlot {
  x: number;
  y: number;
  width: number;
  height: number;
  shot: number;
}

interface FrameLayoutInfo {
  width: number;
  height: number;
  paperSize: TemplatePaperSize;
  slotsInFront: boolean;
  slots: ReadonlyArray<LayoutSlot>;
}

/** Tinggi acuan pratinjau; lebarnya menyusul dari rasio kanvas Frame. */
const PREVIEW_HEIGHT = 240;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Slot dibaca apa adanya dalam koordinat kanvas tersimpan — kartu menampilkannya
 * sebagai persen, jadi tidak perlu dikonversi ke ukuran kertas mana pun.
 */
function readLayout(frame: TemplateRecord): FrameLayoutInfo {
  const layout = isRecord(frame.json_layout) ? frame.json_layout : null;
  const canvas = layout && isRecord(layout.canvas) ? layout.canvas : null;
  const width = Number(canvas?.width) > 0 ? Number(canvas?.width) : 1200;
  const height = Number(canvas?.height) > 0 ? Number(canvas?.height) : 1800;
  // TemplateResource tidak selalu mengirim paper_size; penandanya ikut tersimpan di layout.
  const storedPaperSize = layout?.paper_size;
  const paperSize: TemplatePaperSize =
    frame.paper_size ??
    (storedPaperSize === "2r" || storedPaperSize === "4r"
      ? storedPaperSize
      : "4r");
  const frames = layout && Array.isArray(layout.frames) ? layout.frames : [];
  const slots = frames.flatMap((item, index): ReadonlyArray<LayoutSlot> => {
    if (!isRecord(item)) return [];
    const x = Number(item.x);
    const y = Number(item.y);
    const slotWidth = Number(item.width);
    const slotHeight = Number(item.height);
    if (!Number.isFinite(x + y + slotWidth + slotHeight)) return [];
    if (slotWidth <= 0 || slotHeight <= 0) return [];
    const shot = Number(item.shot);
    return [
      {
        x,
        y,
        width: slotWidth,
        height: slotHeight,
        shot: Number.isFinite(shot) && shot >= 1 ? Math.round(shot) : index + 1,
      },
    ];
  });
  return {
    width,
    height,
    paperSize,
    slotsInFront: layout?.slots_on_top === true,
    slots,
  };
}

/**
 * Kotak preview dikunci absolut supaya PNG 1200x1800 tidak meluber menutupi isi kartu,
 * dan gagal-muat jatuh ke ikon — bukan teks alt mentah, karena asset masih dibalas 403.
 */
function FramePreview({
  frame,
  layout,
  onExpired,
}: {
  readonly frame: TemplateRecord;
  readonly layout: FrameLayoutInfo;
  readonly onExpired: () => void;
}): ReactElement {
  const previewUrl =
    frame.thumbnail_url ??
    frame.preview_url ??
    frame.png_url ??
    resolveStorageUrl(
      frame.thumbnail_path ?? frame.preview_path ?? frame.png_path,
    );
  const [broken, setBroken] = useState(false);
  const ratio = layout.width / layout.height;

  return (
    <div
      className="flex items-center justify-center border-b bg-muted/40 p-3"
      style={{
        minHeight: PREVIEW_HEIGHT + 24,
        backgroundImage:
          "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%)",
        backgroundSize: "16px 16px",
      }}
    >
      <div
        className="relative overflow-hidden rounded-sm bg-white shadow-md ring-1 ring-black/10"
        style={{
          width: `min(100%, ${Math.round(PREVIEW_HEIGHT * ratio)}px)`,
          aspectRatio: `${layout.width} / ${layout.height}`,
        }}
      >
        {previewUrl && !broken ? (
          <>
            {layout.slots.map((slot, index) => (
              <span
                key={`${slot.x}-${slot.y}-${index}`}
                className="absolute grid place-items-center text-[10px] font-bold text-white"
                style={{
                  left: `${(slot.x / layout.width) * 100}%`,
                  top: `${(slot.y / layout.height) * 100}%`,
                  width: `${(slot.width / layout.width) * 100}%`,
                  height: `${(slot.height / layout.height) * 100}%`,
                  backgroundColor: shotColor(slot.shot),
                  zIndex: layout.slotsInFront ? 2 : 1,
                }}
              >
                {slot.shot}
              </span>
            ))}
            <img
              src={previewUrl}
              alt={`Preview ${frame.name}`}
              loading="lazy"
              className="absolute inset-0 size-full"
              style={{ zIndex: layout.slotsInFront ? 1 : 2 }}
              onError={() => setBroken(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center gap-1 text-center">
            <Frame className="size-10 text-muted-foreground" aria-hidden="true" />
            {broken && (
              <>
                <span className="px-3 text-[11px] leading-tight text-muted-foreground">
                  Preview kedaluwarsa atau belum bisa dimuat.
                </span>
                <Button size="sm" variant="outline" onClick={onExpired}>
                  Muat ulang
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FrameCard({
  frame,
  onEdit,
  onDelete,
  onExpired,
}: {
  readonly frame: TemplateRecord;
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
  readonly onExpired: () => void;
}) {
  const layout = readLayout(frame);
  const shots = [...new Set(layout.slots.map((slot) => slot.shot))].sort(
    (a, b) => a - b,
  );

  return (
    <Card className="overflow-hidden pt-0">
      <FramePreview
        key={
          frame.thumbnail_url ??
          frame.preview_url ??
          frame.png_url ??
          frame.thumbnail_path ??
          frame.preview_path ??
          frame.png_path ??
          "missing"
        }
        frame={frame}
        layout={layout}
        onExpired={onExpired}
      />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{frame.name}</CardTitle>
            <CardDescription className="mt-1">
              {frame.is_global ? "Frame Global" : frame.partner?.company_name}
            </CardDescription>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {frame.is_global && <Badge variant="outline">Global</Badge>}
            <Badge
              variant={frame.status === "published" ? "default" : "secondary"}
            >
              {statusLabels[frame.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">
            {layout.paperSize === "2r" ? "2R" : "4R"}
          </Badge>
          <Badge variant="outline">{layout.slots.length} slot foto</Badge>
          <Badge variant="outline">{shots.length} foto</Badge>
          <Badge variant="outline">versi {frame.version}</Badge>
        </div>
        {shots.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Nomor foto:</span>
            {shots.map((shot) => (
              <span key={shot} className="inline-flex items-center gap-1.5">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: shotColor(shot) }}
                />
                foto {shot}
              </span>
            ))}
          </div>
        )}
        {layout.slots.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Belum ada slot foto pada layout.
          </p>
        )}
      </CardContent>
      {!frame.is_global && onEdit && onDelete && (
        <CardFooter className="justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil aria-hidden="true" /> Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 aria-hidden="true" /> Hapus
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export function FrameListPage(): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, user, logout } = useAuth();
  const superAdmin = isSuperAdmin(user);
  const querySearch = searchParams.get("search") ?? "";
  const statusParam = searchParams.get("status");
  const status = isStatus(statusParam) ? statusParam : "all";
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const [response, setResponse] = useState<TemplateListResponse | null>(null);
  const [partners, setPartners] = useState<ReadonlyArray<PartnerRecord>>([]);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<TemplateRecord | null>(null);

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
              per_page: 12,
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
        if (page > Math.max(1, framesResult.meta.last_page)) {
          updateQuery({
            page:
              framesResult.meta.last_page > 1
                ? String(framesResult.meta.last_page)
                : null,
          });
          return;
        }
        setResponse(framesResult);
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

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("search");
    updateQuery({
      search: typeof value === "string" ? value.trim() || null : null,
      page: null,
    });
  }

  const filtered = Boolean(querySearch || status !== "all");
  const defaultPartnerId = user?.partner?.id ?? null;
  const canCreate = !superAdmin
    ? defaultPartnerId !== null
    : partners.length > 0;

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Frame Photo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola Frame yang digunakan sebagai Template konfigurasi Event.
          </p>
        </div>
        <Button
          disabled={loadState !== "success" || !canCreate}
          onClick={() => navigate("/frame-photo/create")}
        >
          <Plus aria-hidden="true" /> Tambah Frame
        </Button>
      </header>
      <Card>
        <CardHeader className="gap-4 border-b">
          <div>
            <CardTitle>Daftar Frame</CardTitle>
            <CardDescription>
              Frame Global bersifat read-only; Frame Partner dapat dikelola.
            </CardDescription>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(12rem,1fr)_12rem_auto]">
            <form
              key={querySearch}
              className="flex gap-2"
              onSubmit={submitSearch}
            >
              <Label className="sr-only" htmlFor="frame-search">
                Cari Frame
              </Label>
              <Input
                id="frame-search"
                name="search"
                defaultValue={querySearch}
                placeholder="Nama Frame"
              />
              <Button
                type="submit"
                size="icon"
                variant="outline"
                aria-label="Cari"
              >
                <Search aria-hidden="true" />
              </Button>
            </form>
            <Select<string>
              value={status}
              onValueChange={(value) =>
                value !== null &&
                updateQuery({
                  status: value === "all" ? null : value,
                  page: null,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {TEMPLATE_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {statusLabels[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              disabled={!filtered}
              onClick={() =>
                setSearchParams(new URLSearchParams(), { replace: true })
              }
            >
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadState === "loading" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy>
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} className="h-96 rounded-xl" />
              ))}
            </div>
          )}
          {loadState === "error" && (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <CircleAlert className="mx-auto size-10 text-destructive" />
                <p className="mt-3 font-medium">Daftar Frame gagal dimuat</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {errorMessage}
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setRetryKey((value) => value + 1)}
                >
                  <RefreshCw aria-hidden="true" /> Coba lagi
                </Button>
              </div>
            </div>
          )}
          {loadState === "success" &&
            response &&
            response.data.length === 0 && (
              <div className="grid min-h-64 place-items-center text-center">
                <div>
                  <Frame className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-3 font-medium">
                    {filtered ? "Frame tidak ditemukan" : "Belum ada Frame"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {filtered
                      ? "Ubah atau reset filter pencarian."
                      : "Tambahkan Frame pertama untuk Partner."}
                  </p>
                </div>
              </div>
            )}
          {loadState === "success" && response && response.data.length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {response.data.map((frame) => (
                  <FrameCard
                    key={frame.id}
                    frame={frame}
                    onExpired={() => setRetryKey((value) => value + 1)}
                    onEdit={
                      frame.is_global
                        ? undefined
                        : () => navigate(`/frame-photo/${frame.id}/edit`)
                    }
                    onDelete={
                      frame.is_global ? undefined : () => setDeleteTarget(frame)
                    }
                  />
                ))}
              </div>
              <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  {response.meta.from ?? 0}–{response.meta.to ?? 0} dari{" "}
                  {response.meta.total} Frame
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={response.meta.current_page <= 1}
                    onClick={() =>
                      updateQuery({
                        page:
                          response.meta.current_page - 1 === 1
                            ? null
                            : String(response.meta.current_page - 1),
                      })
                    }
                  >
                    <ChevronLeft aria-hidden="true" /> Sebelumnya
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      response.meta.current_page >= response.meta.last_page
                    }
                    onClick={() =>
                      updateQuery({
                        page: String(response.meta.current_page + 1),
                      })
                    }
                  >
                    Berikutnya <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
              </div>
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
            setRetryKey((value) => value + 1);
          }}
          onUnauthorized={() => void handleUnauthorized()}
          onForbidden={handleForbidden}
        />
      )}
      <Toaster position="top-right" />
    </div>
  );
}
