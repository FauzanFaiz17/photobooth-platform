import { ArrowLeft } from "lucide-react"
import { useState, type ReactElement } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import { KioskGeneralSettings } from "@/components/kiosk/configuration/kiosk-general-settings"
import { KioskPaymentSettings } from "@/components/kiosk/configuration/kiosk-payment-settings"
import { KioskPrintSettings } from "@/components/kiosk/configuration/kiosk-print-settings"
import { KioskSessionSettings } from "@/components/kiosk/configuration/kiosk-session-settings"
import {
  completedKioskDiagnostics,
  initialKioskDiagnostics,
  kioskDeviceHealth,
  kioskGeneralSettings,
  kioskPaymentSettings,
  kioskPrintSettings,
  kioskReferenceTime,
  kioskSessionSettings,
} from "@/components/kiosk/data/kiosk-dummy-data"
import { KioskDeviceHealth } from "@/components/kiosk/diagnostics/kiosk-device-health"
import { KioskDiagnostics } from "@/components/kiosk/diagnostics/kiosk-diagnostics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster } from "@/components/ui/sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { findKioskBySlug } from "../catalog/kiosk-catalog-data"
import type { KioskDetailTab } from "../catalog/kiosk-catalog.types"
import { KioskFrameTab } from "./kiosk-frame-tab"
import { KioskIdleAdsTab } from "./kiosk-idle-ads-tab"
import { KioskInfoTab } from "./kiosk-info-tab"

const detailTabs: ReadonlyArray<{ value: KioskDetailTab; label: string }> = [
  { value: "info", label: "Info" },
  { value: "general", label: "Umum" },
  { value: "frame", label: "Frame" },
  { value: "payment", label: "Pembayaran" },
  { value: "timer", label: "Timer" },
  { value: "camera-display", label: "Kamera & Tampilan" },
  { value: "idle-ads", label: "Iklan Idle" },
]

function isKioskDetailTab(value: string): value is KioskDetailTab {
  return detailTabs.some((tab) => tab.value === value)
}

export function KioskDetailPage(): ReactElement {
  const { slug } = useParams<{ slug: string }>()
  const kiosk = findKioskBySlug(slug)
  const [activeTab, setActiveTab] = useState<KioskDetailTab>("info")

  if (!kiosk) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="mx-auto max-w-lg shadow-none">
          <CardHeader><CardTitle><h1>Kiosk tidak ditemukan</h1></CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm opacity-70">Data kiosk yang Anda cari tidak tersedia.</p>
            <Button render={<Link to="/admin/kiosk" />}>
              <ArrowLeft aria-hidden="true" />
              Kembali ke Daftar Kiosk
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const detailGeneralSettings = {
    ...kioskGeneralSettings,
    kioskName: kiosk.name,
    location: kiosk.name === "AMEHO" ? "Jakarta Selatan" : kioskGeneralSettings.location,
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-5">
        <Button variant="ghost" render={<Link to="/admin/kiosk" />}>
          <ArrowLeft aria-hidden="true" />
          Daftar Kiosk
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">{kiosk.name}</h1>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isKioskDetailTab(value)) setActiveTab(value)
        }}
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="min-w-max" aria-label="Pengaturan kiosk">
            {detailTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="px-4">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="info" className="pt-4">
          <KioskInfoTab kiosk={kiosk} />
        </TabsContent>

        <TabsContent value="general" className="pt-4">
          <KioskGeneralSettings
            initialSettings={detailGeneralSettings}
            onSaved={(settings) =>
              toast.success("Pengaturan umum disimpan", {
                description: `${settings.kioskName} berhasil diperbarui.`,
              })
            }
          />
        </TabsContent>

        <TabsContent value="frame" className="pt-4">
          <KioskFrameTab kiosk={kiosk} />
        </TabsContent>

        <TabsContent value="payment" className="pt-4">
          <KioskPaymentSettings initialSettings={kioskPaymentSettings} />
        </TabsContent>

        <TabsContent value="timer" className="pt-4">
          <KioskSessionSettings initialSettings={kioskSessionSettings} />
        </TabsContent>

        <TabsContent value="camera-display" className="pt-4">
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <KioskDeviceHealth items={kioskDeviceHealth} referenceTime={kioskReferenceTime} />
            <KioskDiagnostics
              initialDiagnostics={initialKioskDiagnostics}
              completedDiagnostics={completedKioskDiagnostics}
            />
            <KioskPrintSettings initialSettings={kioskPrintSettings} />
          </div>
        </TabsContent>

        <TabsContent value="idle-ads" className="pt-4">
          <KioskIdleAdsTab />
        </TabsContent>
      </Tabs>
      <Toaster position="top-right" />
    </div>
  )
}
