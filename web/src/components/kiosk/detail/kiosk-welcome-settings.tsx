import { Info, Trash2 } from "lucide-react"
import type { ReactElement } from "react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { KioskWelcomeSettings as WelcomeSettings } from "../catalog/kiosk-catalog.types"
import { KioskAssetUpload } from "./kiosk-asset-upload"

export interface KioskAssetState {
  readonly logo?: string
  readonly startBackground?: string
  readonly tutorialBackground?: string
  readonly pageBackground?: string
  readonly qrLogo?: string
}

interface KioskWelcomeSettingsProps {
  readonly settings: WelcomeSettings
  readonly assets: KioskAssetState
  readonly onSettingsChange: (settings: WelcomeSettings) => void
  readonly onAssetsChange: (assets: KioskAssetState) => void
}

const colorFields = [
  ["backgroundColor", "Warna background"],
  ["ornamentColor", "Warna ornamen"],
  ["borderColor", "Warna border"],
  ["textColor", "Warna teks"],
  ["buttonBackgroundColor", "Warna background tombol"],
  ["buttonTextColor", "Warna teks tombol"],
] as const

function isWelcomeLayout(value: string): value is WelcomeSettings["layout"] {
  return value === "classic" || value === "centered" || value === "split"
}

export function KioskWelcomeSettings({
  settings,
  assets,
  onSettingsChange,
  onAssetsChange,
}: KioskWelcomeSettingsProps): ReactElement {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <h2>Tampilan</h2>
          <Info className="size-4 opacity-60" aria-hidden="true" />
        </CardTitle>
        <CardDescription>Atur tampilan welcome page khusus kiosk ini.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="welcome-layout">Layout Welcome</Label>
          <Select<WelcomeSettings["layout"]>
            value={settings.layout}
            onValueChange={(value) => {
              if (value && isWelcomeLayout(value)) {
                onSettingsChange({ ...settings, layout: value })
              }
            }}
          >
            <SelectTrigger id="welcome-layout" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="centered">Centered</SelectItem>
              <SelectItem value="split">Split</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {colorFields.map(([key, label]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={settings[key]}
                onChange={(event) =>
                  onSettingsChange({ ...settings, [key]: event.target.value })
                }
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcome-title">Judul</Label>
          <Input
            id="welcome-title"
            value={settings.title}
            onChange={(event) => onSettingsChange({ ...settings, title: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="welcome-tagline">Tagline</Label>
          <Input
            id="welcome-tagline"
            value={settings.tagline}
            onChange={(event) => onSettingsChange({ ...settings, tagline: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logo-height">Tinggi logo (%)</Label>
          <Input
            id="logo-height"
            type="number"
            min={10}
            max={100}
            value={settings.logoHeight}
            onChange={(event) =>
              onSettingsChange({ ...settings, logoHeight: Number(event.target.value) })
            }
          />
        </div>

        <div className="space-y-3">
          <Label>Aset</Label>
          <KioskAssetUpload
            label="Upload logo"
            fileName={assets.logo}
            onFileChange={(logo) => onAssetsChange({ ...assets, logo })}
          />
          <KioskAssetUpload
            label="Upload background start"
            fileName={assets.startBackground}
            onFileChange={(startBackground) => onAssetsChange({ ...assets, startBackground })}
          />
          <KioskAssetUpload
            label="Upload background tutorial"
            fileName={assets.tutorialBackground}
            onFileChange={(tutorialBackground) => onAssetsChange({ ...assets, tutorialBackground })}
          />
          <KioskAssetUpload
            label="Upload background halaman"
            fileName={assets.pageBackground}
            onFileChange={(pageBackground) => onAssetsChange({ ...assets, pageBackground })}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="font-semibold">Logo QR Digital (override kiosk)</h3>
          <p className="text-xs opacity-60">
            Menggantikan logo QR akun khusus untuk QR cetak kiosk ini saja.
          </p>
          <KioskAssetUpload
            label="Upload logo QR (khusus kiosk ini)"
            fileName={assets.qrLogo}
            onFileChange={(qrLogo) => onAssetsChange({ ...assets, qrLogo })}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Tema Halaman Galeri Digital</h3>
            <p className="mt-1 text-xs opacity-60">
              Override tema halaman galeri digital untuk kiosk ini.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gallery-accent">Warna Aksen</Label>
              <Input
                id="gallery-accent"
                value={settings.galleryAccentColor}
                onChange={(event) =>
                  onSettingsChange({ ...settings, galleryAccentColor: event.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gallery-background">Warna Latar</Label>
              <Input
                id="gallery-background"
                value={settings.galleryBackgroundColor}
                onChange={(event) =>
                  onSettingsChange({ ...settings, galleryBackgroundColor: event.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <div className="flex gap-2">
            <Input
              id="instagram"
              value={settings.instagram}
              onChange={(event) => onSettingsChange({ ...settings, instagram: event.target.value })}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onSettingsChange({ ...settings, instagram: "" })}
              aria-label="Hapus Instagram"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tiktok">TikTok</Label>
          <div className="flex gap-2">
            <Input
              id="tiktok"
              value={settings.tiktok}
              onChange={(event) => onSettingsChange({ ...settings, tiktok: event.target.value })}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onSettingsChange({ ...settings, tiktok: "" })}
              aria-label="Hapus TikTok"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
