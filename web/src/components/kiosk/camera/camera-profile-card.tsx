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
import type { CameraProfileRecord } from "@/features/camera-profiles/camera-profile.types"

function value(value: string | null): string {
  return value || "—"
}

export function CameraProfileCard({
  profile,
  onEdit,
  onDelete,
}: {
  readonly profile: CameraProfileRecord
  readonly onEdit?: () => void
  readonly onDelete?: () => void
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{profile.name}</CardTitle>
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
          <div><dt className="text-xs text-muted-foreground">ISO</dt><dd className="mt-1 font-medium">{value(profile.iso)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Shutter</dt><dd className="mt-1 font-medium">{value(profile.shutter_speed)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Aperture</dt><dd className="mt-1 font-medium">{value(profile.aperture)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">White balance</dt><dd className="mt-1 font-medium">{value(profile.white_balance)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Picture style</dt><dd className="mt-1 font-medium">{value(profile.picture_style)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Contrast</dt><dd className="mt-1 font-medium">{value(profile.contrast)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Saturation</dt><dd className="mt-1 font-medium">{value(profile.saturation)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Exposure</dt><dd className="mt-1 font-medium">{value(profile.exposure)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Countdown</dt><dd className="mt-1 font-medium">{profile.countdown_seconds} detik</dd></div>
          <div><dt className="text-xs text-muted-foreground">Burst</dt><dd className="mt-1 font-medium">{profile.burst_count} foto</dd></div>
          <div><dt className="text-xs text-muted-foreground">Focus</dt><dd className="mt-1 font-medium">{value(profile.focus_mode)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Live view</dt><dd className="mt-1 font-medium">{profile.live_view ? "Aktif" : "Nonaktif"}</dd></div>
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
