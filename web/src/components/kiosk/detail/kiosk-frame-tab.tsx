import { Image, Plus } from "lucide-react"
import type { ReactElement } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { KioskCatalogItem } from "../catalog/kiosk-catalog.types"

export function KioskFrameTab({ kiosk }: { readonly kiosk: KioskCatalogItem }): ReactElement {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle><h2>Frame Kiosk</h2></CardTitle>
        <CardDescription>Kelola frame yang tersedia pada {kiosk.name}.</CardDescription>
        <CardAction>
          <Button render={<Link to="/frame-photo" />}>
            <Plus aria-hidden="true" />
            Kelola Frame
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Image className="size-10 opacity-50" aria-hidden="true" />
          <p className="mt-4 text-3xl font-semibold tabular-nums">{kiosk.frameCount}</p>
          <p className="mt-1 text-sm opacity-70">frame aktif untuk kiosk ini</p>
        </div>
      </CardContent>
    </Card>
  )
}
