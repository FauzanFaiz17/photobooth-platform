import type { TemplateRecord } from "@/features/templates/template.types";
import { readLayout } from "../utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FramePreview from "./frame-preview";
import { Badge } from "@/components/ui/badge";
import { statusLabels } from "@/constants";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { shotColor } from "@/features/templates/shot-colors";

export default function FrameCard({
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
            {frame.type === "gif" && (
              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                GIF
              </Badge>
            )}
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
