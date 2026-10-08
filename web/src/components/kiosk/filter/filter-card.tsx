import { Pencil, Trash2 } from "lucide-react";

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
import type { FilterRecord } from "@/features/filters/filter.types";

export function FilterCard({
  filter,
  onEdit,
  onDelete,
}: {
  readonly filter: FilterRecord;
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{filter.name}</CardTitle>
            <CardDescription className="mt-1">
              Versi {filter.version}
            </CardDescription>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {filter.is_global && <Badge variant="outline">Global</Badge>}
            <Badge variant={filter.is_active ? "default" : "secondary"}>
              {filter.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Brightness</dt>
            <dd className="mt-1 font-medium">{filter.brightness}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Contrast</dt>
            <dd className="mt-1 font-medium">{filter.contrast}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Saturation</dt>
            <dd className="mt-1 font-medium">{filter.saturation}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Sharpness</dt>
            <dd className="mt-1 font-medium">{filter.sharpness}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">White balance</dt>
            <dd className="mt-1 font-medium">{filter.white_balance}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Intensity</dt>
            <dd className="mt-1 font-medium">{filter.intensity}%</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">LUT path</dt>
            <dd
              className="mt-1 truncate font-medium"
              title={filter.lut_path ?? undefined}
            >
              {filter.lut_path || "—"}
            </dd>
          </div>
        </dl>
      </CardContent>
      {onEdit && onDelete && (
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
