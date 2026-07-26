import {
  CircleCheck,
  CircleX,
  Clock3,
  KeyRound,
  LoaderCircle,
  PlugZap,
} from "lucide-react"
import type { ReactElement } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type {
  PaymentConfigStatus,
  PaymentConnectionStatus,
  PaymentGateway,
} from "./payment-key.types"
import {
  formatPaymentUpdatedAt,
  paymentGatewayLabels,
} from "./payment-key.utils"

const connectionLabels: Record<PaymentConnectionStatus, string> = {
  connected: "Terhubung",
  disconnected: "Belum diuji",
  testing: "Menguji koneksi",
  error: "Koneksi gagal",
}

const configLabels: Record<PaymentConfigStatus, string> = {
  saved: "Tersimpan",
  unsaved: "Perubahan belum disimpan",
  empty: "Belum dikonfigurasi",
}

interface PaymentKeyStatusProps {
  readonly gateway: PaymentGateway
  readonly environment: "sandbox" | "production"
  readonly connectionStatus: PaymentConnectionStatus
  readonly configStatus: PaymentConfigStatus
  readonly lastUpdatedAt: string | null
}

export function PaymentKeyStatus({
  gateway,
  environment,
  connectionStatus,
  configStatus,
  lastUpdatedAt,
}: PaymentKeyStatusProps): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Konfigurasi</CardTitle>
        <CardDescription>
          Ringkasan credential dan koneksi payment gateway.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-1">
          <div className="flex items-start justify-between gap-4 border-b pb-3">
            <dt className="opacity-70">Gateway</dt>
            <dd className="font-medium">{paymentGatewayLabels[gateway]}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 border-b pb-3">
            <dt className="opacity-70">Environment</dt>
            <dd className="font-medium capitalize">{environment}</dd>
          </div>
          <div className="flex items-start justify-between gap-4 border-b pb-3">
            <dt className="opacity-70">Koneksi</dt>
            <dd>
              <Badge variant={connectionStatus === "error" ? "destructive" : "outline"}>
                {connectionLabels[connectionStatus]}
              </Badge>
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 border-b pb-3">
            <dt className="opacity-70">Konfigurasi</dt>
            <dd className="text-right font-medium">{configLabels[configStatus]}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="flex items-center gap-2 opacity-70">
              <Clock3 className="size-4" aria-hidden="true" />
              Terakhir diperbarui
            </dt>
            <dd className="max-w-40 text-right font-medium">
              <time>{formatPaymentUpdatedAt(lastUpdatedAt)}</time>
            </dd>
          </div>
        </dl>

        <ConnectionAlert status={connectionStatus} />
      </CardContent>
    </Card>
  )
}

function ConnectionAlert({
  status,
}: {
  readonly status: PaymentConnectionStatus
}): ReactElement {
  if (status === "testing") {
    return (
      <Alert>
        <LoaderCircle className="animate-spin" aria-hidden="true" />
        <AlertTitle>Menguji koneksi</AlertTitle>
        <AlertDescription>
          Credential sedang divalidasi melalui simulasi lokal.
        </AlertDescription>
      </Alert>
    )
  }

  if (status === "connected") {
    return (
      <Alert>
        <CircleCheck aria-hidden="true" />
        <AlertTitle>Koneksi berhasil</AlertTitle>
        <AlertDescription>
          Payment gateway siap menerima transaksi QRIS.
        </AlertDescription>
      </Alert>
    )
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <CircleX aria-hidden="true" />
        <AlertTitle>Koneksi gagal</AlertTitle>
        <AlertDescription>
          Periksa credential dan Callback URL, lalu uji kembali.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <PlugZap aria-hidden="true" />
      <AlertTitle>Koneksi belum diuji</AlertTitle>
      <AlertDescription>
        Jalankan Test Connection setelah konfigurasi selesai.
      </AlertDescription>
    </Alert>
  )
}

export function PaymentKeyEmptyState({
  onRestore,
}: {
  readonly onRestore: () => void
}): ReactElement {
  return (
    <Card>
      <CardContent className="flex min-h-48 flex-col items-center justify-center text-center">
        <KeyRound className="size-8 opacity-60" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold">Konfigurasi masih kosong</h2>
        <p className="mt-1 max-w-lg text-sm opacity-70">
          Masukkan credential payment gateway atau muat kembali dummy data untuk melanjutkan simulasi.
        </p>
        <button type="button" className="mt-4 text-sm font-medium underline underline-offset-4" onClick={onRestore}>
          Muat dummy data
        </button>
      </CardContent>
    </Card>
  )
}
