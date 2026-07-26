import { Layers3 } from "lucide-react"
import { useState, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { frameKioskOptions } from "./frame-management.data"
import type { ManagedFrame } from "./frame-management.types"

export function FrameBulkDialog({
  open,
  frames,
  onOpenChange,
  onSubmit,
}: {
  readonly open: boolean
  readonly frames: ReadonlyArray<ManagedFrame>
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (frameIds: ReadonlyArray<string>, kioskId: string) => void
}): ReactElement {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [kioskId, setKioskId] = useState<string>(frameKioskOptions[0].id)

  function toggleFrame(id: string, checked: boolean): void {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Frame Massal ke Kiosk</DialogTitle>
          <DialogDescription>Pilih kiosk dan beberapa frame yang akan dipasang.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Select<string> value={kioskId} onValueChange={(value) => value && setKioskId(value)}>
            <SelectTrigger className="w-full" aria-label="Pilih kiosk"><SelectValue /></SelectTrigger>
            <SelectContent>
              {frameKioskOptions.map((kiosk) => (
                <SelectItem key={kiosk.id} value={kiosk.id}>{kiosk.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border p-2">
            {frames.map((frame) => (
              <label key={frame.id} className="flex items-center gap-3 rounded-md p-2">
                <Checkbox
                  checked={selectedIds.has(frame.id)}
                  onCheckedChange={(checked) => toggleFrame(frame.id, checked)}
                />
                <span className="min-w-0 flex-1 truncate text-sm">{frame.name}</span>
                <span className="text-xs opacity-60">{frame.size}</span>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button disabled={selectedIds.size === 0} onClick={() => onSubmit([...selectedIds], kioskId)}>
            <Layers3 aria-hidden="true" />
            Tambahkan {selectedIds.size || ""} Frame
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
