import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { KioskWelcomeSettings } from "../catalog/kiosk-catalog.types"

interface KioskLivePreviewProps {
  readonly kioskName: string
  readonly settings: KioskWelcomeSettings
  readonly logoFileName?: string
}

export function KioskLivePreview({
  kioskName,
  settings,
  logoFileName,
}: KioskLivePreviewProps): ReactElement {
  return (
    <Card className="shadow-none xl:sticky xl:top-4">
      <CardHeader>
        <CardTitle><h2>Live Preview</h2></CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="welcome">
          <div className="overflow-x-auto pb-2">
            <TabsList className="min-w-max">
              <TabsTrigger value="welcome">Welcome</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="frame">Select Frame</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="welcome" className="pt-3">
            <div className="flex aspect-video min-h-64 flex-col overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between border-b px-4 py-2 text-xs">
                <span>{kioskName}</span>
                <span>{settings.layout}</span>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-10">
                <p className="text-xs font-medium uppercase tracking-widest opacity-60">
                  {logoFileName ?? "Your logo here"}
                </p>
                <p className="max-w-sm text-2xl font-semibold leading-tight sm:text-3xl">
                  Welcome to<br />{settings.title}
                </p>
                <p className="max-w-sm text-sm opacity-70">{settings.tagline}</p>
              </div>
              <div className="flex justify-center border-t p-3">
                <Button size="lg">Start</Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="payment" className="pt-3">
            <div className="flex aspect-video min-h-64 items-center justify-center rounded-lg border p-8 text-center">
              <div>
                <p className="text-xl font-semibold">Pilih Pembayaran</p>
                <p className="mt-2 text-sm opacity-70">QRIS, kartu debit, atau tunai.</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="frame" className="pt-3">
            <div className="flex aspect-video min-h-64 items-center justify-center rounded-lg border p-8 text-center">
              <div>
                <p className="text-xl font-semibold">Pilih Frame</p>
                <p className="mt-2 text-sm opacity-70">Frame aktif akan muncul di layar kiosk.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
