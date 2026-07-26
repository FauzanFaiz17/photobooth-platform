import { Archive, CalendarPlus, Copy, Power, PowerOff, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoucherBulkActionsProps { readonly count: number; readonly onCopy: () => void; readonly onExport: () => void; readonly onExtend: () => void; readonly onDisable: () => void; readonly onEnable: () => void; readonly onDeleteUnused: () => void; readonly onClear: () => void }
export function VoucherBulkActions(props: VoucherBulkActionsProps) {
  if (props.count === 0) return null
  return <aside className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between" aria-live="polite"><p className="text-sm font-medium text-foreground">{props.count} vouchers selected</p><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={props.onCopy}><Copy aria-hidden="true" /> Copy Codes</Button><Button variant="outline" size="sm" onClick={props.onExport}><Archive aria-hidden="true" /> Export</Button><Button variant="outline" size="sm" onClick={props.onExtend}><CalendarPlus aria-hidden="true" /> Extend</Button><Button variant="outline" size="sm" onClick={props.onDisable}><PowerOff aria-hidden="true" /> Disable</Button><Button variant="outline" size="sm" onClick={props.onEnable}><Power aria-hidden="true" /> Enable</Button><Button variant="destructive" size="sm" onClick={props.onDeleteUnused}><Trash2 aria-hidden="true" /> Delete Unused</Button><Button variant="ghost" size="sm" onClick={props.onClear}><X aria-hidden="true" /> Clear</Button></div></aside>
}
