import { Pencil, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { PrinterProfileRecord } from "@/features/printer-profiles/printer-profile.types"

export function PrinterProfileCard({
  profile,
  onEdit,
  onDelete,
}: {
  readonly profile: PrinterProfileRecord
  readonly onEdit?: () => void
  readonly onDelete?: () => void
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{profile.printer_name}</CardTitle>
            <CardDescription className="mt-1">
              Versi {profile.version}
            </CardDescription>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {profile.is_global && <Badge variant="outline">Global</Badge>}
            <Badge variant={profile.is_active ? "default" : "secondary"}>
              {profile.is_active ? "Aktif" : "Nonaktif"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="text-xs text-muted-foreground">Salinan</dt><dd className="mt-1 font-medium">{profile.copies}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Ukuran kertas</dt><dd className="mt-1 font-medium">{profile.paper_size}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Orientasi</dt><dd className="mt-1 font-medium capitalize">{profile.orientation}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Auto print</dt><dd className="mt-1 font-medium">{profile.auto_print ? "Aktif" : "Nonaktif"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Border</dt><dd className="mt-1 font-medium">{profile.border ? "Aktif" : "Nonaktif"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Bleed</dt><dd className="mt-1 font-medium">{profile.bleed}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Delay</dt><dd className="mt-1 font-medium">{profile.delay_ms} ms</dd></div>
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
  )
}
