import { Save } from "lucide-react"
import { useState, type ReactElement } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { kioskPrintHistory, kioskWelcomeSettings } from "../catalog/kiosk-catalog-data"
import type {
  KioskCatalogItem,
  KioskWelcomeSettings as WelcomeSettings,
} from "../catalog/kiosk-catalog.types"
import { KioskLivePreview } from "./kiosk-live-preview"
import { KioskPaperSection } from "./kiosk-paper-section"
import { KioskStatusOverview } from "./kiosk-status-overview"
import {
  KioskWelcomeSettings,
  type KioskAssetState,
} from "./kiosk-welcome-settings"

interface KioskInfoTabProps {
  readonly kiosk: KioskCatalogItem
}

export function KioskInfoTab({ kiosk }: KioskInfoTabProps): ReactElement {
  const [settings, setSettings] = useState<WelcomeSettings>(kioskWelcomeSettings)
  const [assets, setAssets] = useState<KioskAssetState>({})

  const handleSave = (): void => {
    toast.success("Pengaturan kiosk disimpan", {
      description: `Tampilan welcome page ${kiosk.name} berhasil diperbarui.`,
    })
  }

  return (
    <div className="space-y-4">
      <KioskStatusOverview kiosk={kiosk} />
      <KioskPaperSection kiosk={kiosk} history={kioskPrintHistory} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,1fr)]">
        <KioskWelcomeSettings
          settings={settings}
          assets={assets}
          onSettingsChange={setSettings}
          onAssetsChange={setAssets}
        />
        <KioskLivePreview
          kioskName={kiosk.name}
          settings={settings}
          logoFileName={assets.logo}
        />
      </div>

      <div className="sticky bottom-0 z-10 flex justify-end rounded-xl border p-3 shadow-sm backdrop-blur">
        <Button onClick={handleSave}>
          <Save aria-hidden="true" />
          Simpan Perubahan
        </Button>
      </div>
    </div>
  )
}
