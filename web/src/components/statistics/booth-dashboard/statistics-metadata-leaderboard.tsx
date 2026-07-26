import { Download } from "lucide-react"
import { useMemo, useState, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  MetadataLeaderboardKey,
  MetadataLeaderboardRow,
} from "./statistics-booth.types"

const leaderboardLabels: Record<MetadataLeaderboardKey, string> = {
  email: "Email",
  phone: "Telepon",
  name: "Nama",
  rating: "Rating",
}

function isLeaderboardKey(value: string): value is MetadataLeaderboardKey {
  return value === "email" || value === "phone" || value === "name" || value === "rating"
}

function getMetadataValue(row: MetadataLeaderboardRow, key: MetadataLeaderboardKey): string {
  return key === "rating" ? `${row.rating.toLocaleString("id-ID")} / 5` : row[key]
}

function exportLeaderboard(
  rows: ReadonlyArray<MetadataLeaderboardRow>,
  key: MetadataLeaderboardKey
): void {
  const csvRows = [
    ["Peringkat", leaderboardLabels[key], "Total"],
    ...rows.map((row, index) => [String(index + 1), getMetadataValue(row, key), String(row.total)]),
  ]
  const csv = csvRows
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n")
  const file = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(file)
  const link = document.createElement("a")
  link.href = url
  link.download = `leaderboard-${key}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function StatisticsMetadataLeaderboard({
  rows,
}: {
  readonly rows: ReadonlyArray<MetadataLeaderboardRow>
}): ReactElement {
  const [activeKey, setActiveKey] = useState<MetadataLeaderboardKey>("email")
  const sortedRows = useMemo(
    () => [...rows].sort((first, second) =>
      activeKey === "rating"
        ? second.rating - first.rating || second.total - first.total
        : second.total - first.total
    ),
    [activeKey, rows]
  )

  return (
    <Card className="min-w-0 shadow-none">
      <CardHeader>
        <CardTitle><h2>Leaderboard Metadata</h2></CardTitle>
        <CardDescription>
          Urutan teratas per key metadata — email, nomor telepon, nama, rating.
        </CardDescription>
        <CardAction className="flex flex-col items-end gap-2 sm:flex-row">
          <Button variant="outline" size="sm" onClick={() => exportLeaderboard(sortedRows, activeKey)}>
            <Download aria-hidden="true" />
            Export
          </Button>
          <Tabs
            value={activeKey}
            onValueChange={(value) => {
              if (isLeaderboardKey(value)) setActiveKey(value)
            }}
          >
            <TabsList className="rounded-full border p-1">
              {(Object.keys(leaderboardLabels) as MetadataLeaderboardKey[]).map((key) => (
                <TabsTrigger key={key} value={key} className="rounded-full px-3">
                  {leaderboardLabels[key]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {sortedRows.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24 pl-4">Peringkat</TableHead>
                <TableHead>{leaderboardLabels[activeKey]}</TableHead>
                <TableHead className="pr-4 text-right">Total Sesi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-4 font-semibold">#{index + 1}</TableCell>
                  <TableCell>{getMetadataValue(row, activeKey)}</TableCell>
                  <TableCell className="pr-4 text-right tabular-nums">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex min-h-48 items-center justify-center text-sm opacity-70">
            Tidak ada data di periode ini
          </div>
        )}
      </CardContent>
    </Card>
  )
}
