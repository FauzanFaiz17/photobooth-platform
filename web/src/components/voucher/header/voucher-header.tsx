import { Download, Plus, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface VoucherHeaderProps { readonly onExport: (format: "csv" | "excel") => void; readonly onGenerate: () => void }

export function VoucherHeader({ onExport, onGenerate }: VoucherHeaderProps) {
  return <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight text-foreground">Voucher</h1><p className="mt-1 text-sm text-muted-foreground">Generate and manage voucher codes used as an alternative payment method at your photo booths.</p></div><div className="flex flex-wrap gap-2"><DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" />}><Download aria-hidden="true" /> Export</DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onExport("csv")}>Export CSV</DropdownMenuItem><DropdownMenuItem onClick={() => onExport("excel")}>Export Excel</DropdownMenuItem><DropdownMenuItem onClick={() => window.print()}><Printer aria-hidden="true" /> Print Voucher List</DropdownMenuItem></DropdownMenuContent></DropdownMenu><Button onClick={onGenerate}><Plus aria-hidden="true" /> Generate Voucher</Button></div></header>
}
