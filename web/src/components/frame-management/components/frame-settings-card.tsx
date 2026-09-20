import {
  RectangleHorizontal,
  RectangleVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import type { PartnerRecord } from "@/features/partners/partner.types";
import {
  TEMPLATE_PAPER_SIZES,
  type FormErrors,
  type FrameOrientation,
  type FrameSize,
  type TemplateStatus,
} from "@/features/templates/template.types";
import { FRAME_SIZES } from "@/constants";

interface FrameSettingsCardProps {
  superAdmin: boolean;
  partners: ReadonlyArray<PartnerRecord>;
  partnerId: string;
  name: string;
  size: FrameSize;
  orientation: FrameOrientation;
  status: TemplateStatus;
  errors: FormErrors;
  canvasSize: { width: number; height: number };
  setPartnerId: (value: string) => void;
  setName: (value: string) => void;
  setStatus: (value: TemplateStatus) => void;
  changeFrameSize: (size: FrameSize) => void;
  changeOrientation: (orientation: FrameOrientation) => void;
  setErrors: (fn: (current: FormErrors) => FormErrors) => void;
}

export function FrameSettingsCard({
  superAdmin,
  partners,
  partnerId,
  name,
  size,
  orientation,
  status,
  errors,
  canvasSize,
  setPartnerId,
  setName,
  setStatus,
  changeFrameSize,
  changeOrientation,
  setErrors,
}: FrameSettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Frame</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {superAdmin && (
          <div className="grid gap-2">
            <Label htmlFor="create-frame-partner">Partner/Kiosk</Label>
            <Select<string>
              value={partnerId || null}
              onValueChange={(value) => {
                if (value !== null) {
                  setPartnerId(value);
                  setErrors((current) => ({
                    ...current,
                    partner_id: undefined,
                  }));
                }
              }}
            >
              <SelectTrigger
                id="create-frame-partner"
                className="w-full"
                aria-invalid={Boolean(errors.partner_id)}
              >
                <SelectValue placeholder="Pilih Partner" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem
                    key={partner.id}
                    value={String(partner.id)}
                  >
                    {partner.brand_name || partner.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.partner_id && (
              <p className="text-xs text-destructive">
                {errors.partner_id}
              </p>
            )}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="create-frame-name">Nama</Label>
          <Input
            id="create-frame-name"
            value={name}
            maxLength={150}
            placeholder="Contoh: Frame Wedding"
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((current) => ({ ...current, name: undefined }));
            }}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="create-frame-size">Ukuran</Label>
          <Select<FrameSize>
            value={size}
            onValueChange={(value) =>
              value !== null && changeFrameSize(value)
            }
          >
            <SelectTrigger id="create-frame-size" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_PAPER_SIZES.map((paperSize) => {
                const frameSize = paperSize === "2r" ? "2R" : "4R";
                return (
                  <SelectItem key={paperSize} value={frameSize}>
                    {FRAME_SIZES[frameSize].label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Hasil final {canvasSize.width} x {canvasSize.height} px,
            tampilan editor diperkecil otomatis.
          </p>
        </div>
        {size === "4R" && (
          <div className="grid gap-2">
            <Label>Orientasi</Label>
            <div className="flex rounded-md border p-1">
              <Button
                type="button"
                size="sm"
                variant={
                  orientation === "portrait" ? "secondary" : "ghost"
                }
                className="flex-1"
                onClick={() => changeOrientation("portrait")}
              >
                <RectangleVertical aria-hidden="true" /> Portrait
              </Button>
              <Button
                type="button"
                size="sm"
                variant={
                  orientation === "landscape" ? "secondary" : "ghost"
                }
                className="flex-1"
                onClick={() => changeOrientation("landscape")}
              >
                <RectangleHorizontal aria-hidden="true" /> Landscape
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Menukar orientasi mengosongkan slot yang sudah dibuat.
            </p>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="create-frame-status">Status</Label>
          <Select<TemplateStatus>
            value={status}
            onValueChange={(value) =>
              value !== null && setStatus(value)
            }
          >
            <SelectTrigger id="create-frame-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
