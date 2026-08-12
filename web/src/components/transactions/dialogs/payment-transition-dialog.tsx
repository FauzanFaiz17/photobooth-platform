import { LoaderCircle } from "lucide-react"
import { useState, type ReactElement } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/features/auth/auth-context"
import { transitionPayment } from "@/features/payments/payment-service"
import type { PaymentRecord, PaymentTransitionStatus } from "@/features/payments/payment.types"
import { ApiError } from "@/lib/api-client"

const labels: Record<PaymentTransitionStatus, string> = { paid: "Dibayar", failed: "Gagal", expired: "Kedaluwarsa", refunded: "Dikembalikan" }

export function PaymentTransitionDialog({ payment, open, onOpenChange, onSaved, onUnauthorized, onForbidden }: { readonly payment: PaymentRecord; readonly open: boolean; readonly onOpenChange: (open: boolean) => void; readonly onSaved: (payment: PaymentRecord) => void; readonly onUnauthorized: () => void; readonly onForbidden: () => void }): ReactElement {
  const { token } = useAuth(); const options: ReadonlyArray<PaymentTransitionStatus> = payment.status === "pending" ? ["paid", "failed", "expired"] : payment.status === "paid" ? ["refunded"] : []; const [status, setStatus] = useState<PaymentTransitionStatus | "">(options[0] ?? ""); const [pending, setPending] = useState(false); const [error, setError] = useState("")
  async function submit(): Promise<void> { if (!token || !status || pending) return; setPending(true); setError(""); try { const saved = await transitionPayment(token, payment.id, status); onSaved(saved); onOpenChange(false) } catch (caught: unknown) { if (caught instanceof ApiError && caught.status === 401) return onUnauthorized(); if (caught instanceof ApiError && caught.status === 403) return onForbidden(); setError(caught instanceof ApiError ? Object.values(caught.validationErrors).flat()[0] ?? caught.message : "Tidak dapat terhubung ke server.") } finally { setPending(false) } }
  return <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}><DialogContent><DialogHeader><DialogTitle>Ubah Status Payment</DialogTitle><DialogDescription>{payment.reference}. Transisi ini hanya tersedia untuk Super Admin.</DialogDescription></DialogHeader><div className="grid gap-2"><Label htmlFor="payment-transition">Status tujuan</Label><Select value={status} onValueChange={(value) => value && setStatus(value as PaymentTransitionStatus)}><SelectTrigger id="payment-transition"><SelectValue /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{labels[option]}</SelectItem>)}</SelectContent></Select></div>{error && <p className="text-sm text-destructive" role="alert">{error}</p>}<DialogFooter><Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Batal</Button><Button disabled={pending || !status} onClick={() => void submit()}>{pending && <LoaderCircle className="animate-spin" />}Simpan Status</Button></DialogFooter></DialogContent></Dialog>
}
