import {
  ArrowLeft,
  Eye,
  LoaderCircle,
  Pencil,
  Save,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PhotoSlot, TemplateStatus } from "@/features/templates/template.types";
import { Switch } from "@/components/ui/switch"; 
import { FRAME_SIZES } from "@/constants";

interface FrameHeaderProps {
  editing: boolean;
  name: string;
  size: string;
  canvasSize: { width: number; height: number };
  status: TemplateStatus;
  selectedSlot: PhotoSlot | null;
  slots: ReadonlyArray<PhotoSlot>;
  mode: "edit" | "preview";
  canvasDark: boolean;
  pending: boolean;
  setCanvasDark: (value: boolean) => void;
  setMode: (mode: "edit" | "preview") => void;
  onNavigateBack: () => void;
}

export function FrameHeader({
  editing,
  name,
  size,
  canvasSize,
  status,
  selectedSlot,
  slots,
  mode,
  canvasDark,
  pending,
  setCanvasDark,
  setMode,
  onNavigateBack,
}: FrameHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-3">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Kembali ke daftar Frame"
          title="Kembali ke daftar Frame"
          onClick={onNavigateBack}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">
            {name.trim() || (editing ? "Edit Frame" : "Frame Baru")}
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {FRAME_SIZES[size as keyof typeof FRAME_SIZES].label} · {canvasSize.width} x{" "}
            {canvasSize.height} px
          </p>
        </div>
        <Badge variant="outline">{status}</Badge>
        {selectedSlot && mode === "edit" && (
          <Badge variant="secondary">
            Slot {slots.findIndex((slot) => slot.id === selectedSlot.id) + 1}
          </Badge>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <label className="hidden items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium sm:flex">
          <span>{canvasDark ? "Background hitam" : "Background putih"}</span>
          <Switch
            checked={canvasDark}
            onCheckedChange={setCanvasDark}
            aria-label="Ganti background canvas"
          />
        </label>
        <div className="flex rounded-md border p-0.5">
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "secondary" : "ghost"}
            onClick={() => setMode("edit")}
          >
            <Pencil aria-hidden="true" /> Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "secondary" : "ghost"}
            onClick={() => setMode("preview")}
          >
            <Eye aria-hidden="true" /> Preview
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onNavigateBack}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}{" "}
          Simpan Frame
        </Button>
      </div>
    </header>
  );
}
