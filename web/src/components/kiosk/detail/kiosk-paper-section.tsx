import { ChevronLeft, ChevronRight, Download, Layers3 } from "lucide-react"
import type { ReactElement } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  KioskCatalogItem,
  KioskPrintHistoryItem,
} from "../catalog/kiosk-catalog.types"

const historyDateFormatter = new Intl.DateTimeFormat("id-ID", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

interface KioskPaperSectionProps {
  readonly kiosk: KioskCatalogItem
  readonly history: ReadonlyArray<KioskPrintHistoryItem>
}

function exportPrintHistory(history: ReadonlyArray<KioskPrintHistoryItem>): void {
  const rows = history.map((item) =>
    [item.occurredAt, item.type, item.copies].map((value) => `"${value}"`).join(",")
  )
  const file = new Blob(
    [[["Tanggal", "Tipe", "Cetak"].join(","), ...rows].join("\n")],
    { type: "text/csv;charset=utf-8" }
  )
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = "riwayat-cetak-kiosk.csv"
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function KioskPaperSection({
  kiosk,
  history,
}: KioskPaperSectionProps): ReactElement {
  const usedPaper = kiosk.paper.capacity - kiosk.paper.remaining
  const usagePercentage = Math.round((usedPaper / kiosk.paper.capacity) * 100)

  return (
    <section className="grid gap-4 xl:grid-cols-2" aria-label="Pemakaian kertas">
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers3 className="size-4 opacity-70" aria-hidden="true" />
            <h2>Kertas</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs uppercase opacity-60">Kapasitas</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{kiosk.paper.capacity}</p>
            </div>
            <div>
              <p className="text-xs uppercase opacity-60">Terpakai</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{usedPaper}</p>
            </div>
            <div>
              <p className="text-xs uppercase opacity-60">Tersisa</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{kiosk.paper.remaining}</p>
            </div>
          </div>
          <Progress value={usagePercentage} aria-label={`${usagePercentage}% kertas terpakai`} />
          <p className="text-sm opacity-70">{usagePercentage}% dari kapasitas kertas telah digunakan.</p>
        </CardContent>
      </Card>

      <Card className="min-w-0 shadow-none">
        <CardHeader>
          <CardTitle><h2>Pemakaian Kertas</h2></CardTitle>
          <CardAction className="flex items-center gap-2">
            <span className="text-xs opacity-60">117 entri</span>
            <Button variant="ghost" size="sm" onClick={() => exportPrintHistory(history)}>
              <Download aria-hidden="true" />
              Export
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="pr-4 text-right">Cetak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-4 text-xs tabular-nums">
                    {historyDateFormatter.format(new Date(item.occurredAt))}
                  </TableCell>
                  <TableCell className="text-xs">{item.type}</TableCell>
                  <TableCell className="pr-4 text-right tabular-nums">{item.copies}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 pt-3">
            <p className="text-xs opacity-60">Halaman 1 / 15</p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" disabled aria-label="Halaman sebelumnya">
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon-xs" aria-label="Halaman berikutnya">
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
