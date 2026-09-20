import { Button } from "@/components/ui/button";
import { PREVIEW_HEIGHT } from "@/constants";
import { shotColor } from "@/features/templates/shot-colors";
import type { FrameLayoutInfo, TemplateRecord } from "@/features/templates/template.types";
import { resolveStorageUrl } from "@/lib/api-client";
import { Frame } from "lucide-react";
import { useState, type ReactElement } from "react";

/**
 * Kotak preview dikunci absolut supaya PNG 1200x1800 tidak meluber menutupi isi kartu,
 * dan gagal-muat jatuh ke ikon — bukan teks alt mentah, karena asset masih dibalas 403.
 */
export default function FramePreview({
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