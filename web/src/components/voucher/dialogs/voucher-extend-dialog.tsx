import { useState } from "react"
import { CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { voucherReferenceTime } from "../data/voucher-data"
import type { Voucher, VoucherExtendValues } from "../types/voucher.types"
import { formatVoucherDateTime } from "../utils/voucher-utils"

interface VoucherExtendDialogProps { readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly vouchers: ReadonlyArray<Voucher>; readonly onConfirm: (values: VoucherExtendValues) => void }
const defaults: VoucherExtendValues = { expirationDate: "2026-09-30", expirationTime: "23:59", reason: "Campaign period extended", internalNote: "" }
export function VoucherExtendDialog({ open, onOpenChange, vouchers, onConfirm }: VoucherExtendDialogProps) {
  const [values, setValues] = useState(defaults); const [error, setError] = useState("")
  function submit(): void { const next = new Date(`${values.expirationDate}T${values.expirationTime}:00+07:00`).getTime(); const latest = Math.max(new Date(voucherReferenceTime).getTime(), ...vouchers.map((voucher) => voucher.expiresAt ? new Date(voucher.expiresAt).getTime() : 0)); if (next <= latest) return setError("New expiration must be after the current expiration and current time."); if (!values.reason.trim()) return setError("Extension reason is required."); onConfirm(values) }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle><span className="inline-flex items-center gap-2"><CalendarPlus aria-hidden="true" /> Extend Validity</span></DialogTitle><DialogDescription>{vouchers.length === 1 && vouchers[0]?.expiresAt ? `Current expiration: ${formatVoucherDateTime(vouchers[0].expiresAt)}` : `Extend ${vouchers.length} selected vouchers using one expiration.`}</DialogDescription></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="extend-date">New expiration date</Label><Input id="extend-date" type="date" value={values.expirationDate} onChange={(event) => setValues((current) => ({ ...current, expirationDate: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="extend-time">New expiration time</Label><Input id="extend-time" type="time" value={values.expirationTime} onChange={(event) => setValues((current) => ({ ...current, expirationTime: event.target.value }))} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="extend-reason">Reason</Label><Input id="extend-reason" value={values.reason} onChange={(event) => setValues((current) => ({ ...current, reason: event.target.value }))} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="extend-note">Internal note</Label><Textarea id="extend-note" value={values.internalNote} onChange={(event) => setValues((current) => ({ ...current, internalNote: event.target.value }))} /></div></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={submit}>Extend Validity</Button></DialogFooter></DialogContent></Dialog>
}
