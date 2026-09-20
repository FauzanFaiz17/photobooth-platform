import { ImageUp } from "lucide-react";
import { type RefObject } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FormErrors } from "@/features/templates/template.types";
import { cn } from "@/lib/utils";

interface FrameImageCardProps {
  overlayUrl: string | null;
  overlayBroken: boolean;
  overlayInputRef: RefObject<HTMLInputElement | null>;
  errors: FormErrors;
  slotsInFront: boolean;
  canvasSize: { width: number; height: number };
  setOverlayBroken: (value: boolean) => void;
  setSlotsInFront: (value: boolean) => void;
  pickOverlay: (file: File) => void;
}

export function FrameImageCard({
  overlayUrl,
  overlayBroken,
  overlayInputRef,
  errors,
  slotsInFront,
  canvasSize,
  setOverlayBroken,
  setSlotsInFront,
  pickOverlay,
}: FrameImageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gambar Frame</CardTitle>
        <CardDescription>
          PNG maksimal 10 MB, digambar sesuai canvas {canvasSize.width}{" "}
          x {canvasSize.height} px.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-3">
          <input
            ref={overlayInputRef}
            type="file"
            accept="image/png"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) pickOverlay(file);
              event.target.value = "";
            }}
          />
          <div className="flex items-center gap-3">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md border bg-muted/40">
              {overlayUrl && !overlayBroken ? (
                <img
                  src={overlayUrl}
                  alt="PNG frame saat ini"
                  className="size-full object-contain"
                  onError={() => setOverlayBroken(true)}
                />
              ) : (
                <ImageUp
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">PNG Frame</p>
              {overlayBroken && (
                <p className="mt-0.5 text-xs text-amber-600">
                  Tersimpan, tapi backend belum menyajikannya kembali.
                  Unggah ulang bila ingin melihatnya di editor.
                </p>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => overlayInputRef.current?.click()}
              >
                <ImageUp aria-hidden="true" />{" "}
                {overlayUrl ? "Ganti" : "Unggah"} PNG
              </Button>
            </div>
          </div>
          {errors.png && (
            <p className="text-xs text-destructive">{errors.png}</p>
          )}
        </div>

        <fieldset className="grid gap-2" disabled={!overlayUrl}>
          <legend className="text-sm font-medium">
            Urutan Slot Foto
          </legend>
          <p className="text-xs text-muted-foreground">
            Posisi slot foto terhadap PNG saat dicetak.
          </p>
          {(
            [
              {
                value: false,
                label: "Slot di belakang PNG",
                hint: "PNG menutupi foto — untuk frame berbingkai.",
              },
              {
                value: true,
                label: "Slot di depan PNG",
                hint: "Foto menutupi PNG — untuk background polos.",
              },
            ] as const
          ).map((option) => (
            <label
              key={String(option.value)}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-sm",
                slotsInFront === option.value &&
                  "border-primary bg-primary/5",
              )}
            >
              <input
                type="radio"
                name="slot-z-index"
                className="mt-0.5"
                checked={slotsInFront === option.value}
                onChange={() => setSlotsInFront(option.value)}
              />
              <span className="min-w-0">
                <span className="font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      </CardContent>
    </Card>
  );
}
