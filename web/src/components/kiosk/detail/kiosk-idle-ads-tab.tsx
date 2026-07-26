import { Megaphone, Save } from "lucide-react"
import { useState, type ReactElement } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { KioskAssetUpload } from "./kiosk-asset-upload"

export function KioskIdleAdsTab(): ReactElement {
  const [enabled, setEnabled] = useState(true)
  const [duration, setDuration] = useState(30)
  const [asset, setAsset] = useState<string | undefined>()

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="size-4 opacity-70" aria-hidden="true" />
          <h2>Iklan Idle</h2>
        </CardTitle>
        <CardDescription>Atur konten yang tampil ketika kiosk tidak digunakan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <p className="font-medium">Aktifkan iklan idle</p>
            <p className="text-sm opacity-70">Konten tampil otomatis setelah kiosk diam.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Aktifkan iklan idle" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="idle-duration">Mulai setelah (detik)</Label>
          <Input
            id="idle-duration"
            type="number"
            min={10}
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Media iklan</Label>
          <KioskAssetUpload
            label="Upload gambar atau video iklan"
            fileName={asset}
            accept="image/*,video/*"
            onFileChange={setAsset}
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => toast.success("Pengaturan iklan idle disimpan")}
            disabled={!enabled}
          >
            <Save aria-hidden="true" />
            Simpan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
