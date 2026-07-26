import { ArrowRight, BadgeCheck, KeyRound, Monitor, Play, ScanLine } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const steps = [{ label: "Generate voucher", icon: KeyRound }, { label: "Customer enters code", icon: Monitor }, { label: "Voucher is validated", icon: ScanLine }, { label: "Session starts", icon: Play }, { label: "Redemption is recorded", icon: BadgeCheck }] as const

export function VoucherFlowAlert() {
  return <Alert><KeyRound aria-hidden="true" /><AlertTitle>Voucher payment flow</AlertTitle><AlertDescription><p>Customers can select Voucher on the desktop photo booth app and enter a valid code instead of completing a QRIS payment.</p><ol className="mt-3 flex flex-wrap items-center gap-2" aria-label="Voucher payment flow">{steps.map((step, index) => <li key={step.label} className="flex items-center gap-2"><span className="inline-flex items-center gap-1.5 font-medium text-foreground"><step.icon className="size-3.5" aria-hidden="true" />{step.label}</span>{index < steps.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />}</li>)}</ol></AlertDescription></Alert>
}
