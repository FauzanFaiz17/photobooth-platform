import { QrCode, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QR_SLOT_ID, type QrRect } from "@/features/templates/template.types";

interface FrameQrCardProps {
  qr: QrRect;
  canvasSize: { width: number; height: number };
  selectedSlotId: number | null;
  onSelectQr: () => void;
  removeQr: () => void;
  changeQrNumber: (field: keyof QrRect, value: string) => void;
}

export function FrameQrCard({
  qr,
  canvasSize,
  selectedSlotId,
  onSelectQr,
  removeQr,
  changeQrNumber,
}: FrameQrCardProps) {
  const active = selectedSlotId === QR_SLOT_ID;

  return (
    <Card
      className={active ? "border-primary" : undefined}
      onClick={onSelectQr}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <QrCode aria-hidden="true" className="size-4" /> QR Gallery
            </CardTitle>
            <CardDescription>
              Posisi & ukuran QR galeri pada hasil cetak.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="icon"
            variant="destructive"
            aria-label="Hapus QR"
            title="Hapus QR"
            onClick={(event) => {
              event.stopPropagation();
              removeQr();
            }}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {(["x", "y", "width", "height"] as const).map((field) => (
            <div key={field} className="grid gap-2">
              <Label htmlFor={`qr-${field}`}>
                {field === "x"
                  ? "Posisi X (px)"
                  : field === "y"
                    ? "Posisi Y (px)"
                    : field === "width"
                      ? "Lebar (px)"
                      : "Tinggi (px)"}
              </Label>
              <Input
                id={`qr-${field}`}
                type="number"
                min={field === "x" || field === "y" ? 0 : 24}
                max={
                  field === "x"
                    ? canvasSize.width - qr.width
                    : field === "y"
                      ? canvasSize.height - qr.height
                      : field === "width"
                        ? canvasSize.width - qr.x
                        : canvasSize.height - qr.y
                }
                step={1}
                value={Math.round(qr[field])}
                onChange={(event) =>
                  changeQrNumber(field, event.target.value)
                }
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
