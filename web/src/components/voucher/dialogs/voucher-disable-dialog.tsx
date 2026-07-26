import { useState } from "react"
import { PowerOff } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Voucher, VoucherDisableReason } from "../types/voucher.types"
import { getDisableReasonLabel } from "../utils/voucher-utils"

interface VoucherDisableDialogProps { readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly vouchers: ReadonlyArray<Voucher>; readonly onConfirm: (reason: VoucherDisableReason) => void }
const reasons: ReadonlyArray<VoucherDisableReason> = ["campaign_ended", "suspected_misuse", "created_by_mistake", "customer_request", "operational_issue", "other"]
export function VoucherDisableDialog({ open, onOpenChange, vouchers, onConfirm }: VoucherDisableDialogProps) {
  const [reason, setReason] = useState<VoucherDisableReason>("campaign_ended")
  return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent><AlertDialogHeader><AlertDialogMedia><PowerOff aria-hidden="true" /></AlertDialogMedia><AlertDialogTitle>Disable {vouchers.length === 1 ? vouchers[0]?.code : `${vouchers.length} vouchers`}?</AlertDialogTitle><AlertDialogDescription>Disabled codes will be rejected by the desktop app. Existing redemption history remains unchanged.</AlertDialogDescription></AlertDialogHeader><div className="space-y-2"><Label htmlFor="disable-reason">Reason</Label><Select<VoucherDisableReason> value={reason} onValueChange={(value) => value && setReason(value)}><SelectTrigger id="disable-reason"><SelectValue /></SelectTrigger><SelectContent>{reasons.map((item) => <SelectItem key={item} value={item}>{getDisableReasonLabel(item)}</SelectItem>)}</SelectContent></Select></div><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => onConfirm(reason)}>Disable Voucher</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}
