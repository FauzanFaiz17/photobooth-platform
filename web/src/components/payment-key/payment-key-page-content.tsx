import {
  Info,
  KeyRound,
  LoaderCircle,
  PlugZap,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react"
import { useMemo, useState, type FormEvent, type ReactElement } from "react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Toaster } from "@/components/ui/sonner"

import {
  createEmptyPaymentKeyConfiguration,
  initialPaymentKeyConfiguration,
} from "./payment-key.data"
import { PaymentKeyConfirmationDialog } from "./payment-key-confirmation-dialog"
import { PaymentKeyCredentialField } from "./payment-key-credential-field"
import {
  PaymentKeyEmptyState,
  PaymentKeyStatus,
} from "./payment-key-status"
import type {
  PaymentConfigStatus,
  PaymentConnectionStatus,
  PaymentEnvironment,
  PaymentGateway,
  PaymentKeyConfiguration,
  PaymentKeyConfirmationAction,
  PaymentKeyErrors,
} from "./payment-key.types"
import {
  isPaymentConfigurationEmpty,
  validatePaymentKeyConfiguration,
} from "./payment-key.utils"

const gatewayOptions: ReadonlyArray<{ value: PaymentGateway; label: string }> = [
  { value: "midtrans", label: "Midtrans" },
  { value: "doku", label: "DOKU" },
]

const environmentOptions: ReadonlyArray<{
  value: PaymentEnvironment
  label: string
}> = [
  { value: "sandbox", label: "Sandbox" },
  { value: "production", label: "Production" },
]

export function PaymentKeyPageContent(): ReactElement {
  const [configuration, setConfiguration] = useState<PaymentKeyConfiguration>(
    initialPaymentKeyConfiguration
  )
  const [savedConfiguration, setSavedConfiguration] =
    useState<PaymentKeyConfiguration>(initialPaymentKeyConfiguration)
  const [connectionStatus, setConnectionStatus] =
    useState<PaymentConnectionStatus>("connected")
  const [errors, setErrors] = useState<PaymentKeyErrors>({})
  const [confirmation, setConfirmation] =
    useState<PaymentKeyConfirmationAction | null>(null)

  const configStatus = useMemo<PaymentConfigStatus>(() => {
    if (isPaymentConfigurationEmpty(configuration)) return "empty"
    return JSON.stringify(configuration) === JSON.stringify(savedConfiguration)
      ? "saved"
      : "unsaved"
  }, [configuration, savedConfiguration])

  function updateConfiguration<K extends keyof PaymentKeyConfiguration>(
    key: K,
    value: PaymentKeyConfiguration[K]
  ): void {
    setConfiguration((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setConnectionStatus("disconnected")
  }

  function requestSave(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const nextErrors = validatePaymentKeyConfiguration(configuration)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setConnectionStatus("error")
      toast.error("Konfigurasi belum lengkap.")
      return
    }

    setConfirmation("save")
  }

  function testConnection(): void {
    const nextErrors = validatePaymentKeyConfiguration(configuration)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setConnectionStatus("error")
      toast.error("Koneksi gagal diuji karena credential belum valid.")
      return
    }

    setConnectionStatus("testing")
    window.setTimeout(() => {
      setConnectionStatus("connected")
      toast.success("Koneksi payment gateway berhasil diuji.")
    }, 900)
  }

  function handleConfirmation(): void {
    if (confirmation === "save") {
      const savedAt = new Date().toISOString()
      const nextConfiguration = {
        ...configuration,
        lastUpdatedAt: savedAt,
      }
      setConfiguration(nextConfiguration)
      setSavedConfiguration(nextConfiguration)
      toast.success("Konfigurasi Payment Key berhasil disimpan.")
    }

    if (confirmation === "reset") {
      const emptyConfiguration = createEmptyPaymentKeyConfiguration(configuration)
      setConfiguration(emptyConfiguration)
      setSavedConfiguration(emptyConfiguration)
      setConnectionStatus("disconnected")
      setErrors({})
      toast.success("Konfigurasi lokal berhasil direset.")
    }

    setConfirmation(null)
  }

  function restoreDummyData(): void {
    setConfiguration(initialPaymentKeyConfiguration)
    setSavedConfiguration(initialPaymentKeyConfiguration)
    setConnectionStatus("connected")
    setErrors({})
    toast.success("Dummy data Payment Key berhasil dimuat.")
  }

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="size-6" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight">Payment Key</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm opacity-70">
            Kelola credential payment gateway untuk pembayaran QRIS pada seluruh kiosk photobooth.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">QRIS Only</Badge>
          <Badge variant="secondary">
            {configuration.environment === "sandbox" ? "Sandbox" : "Production"}
          </Badge>
        </div>
      </header>

      {configStatus === "empty" && <PaymentKeyEmptyState onRestore={restoreDummyData} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Konfigurasi Gateway</CardTitle>
            <CardDescription>
              Credential di bawah hanya digunakan untuk simulasi lokal dan tidak dikirim ke backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={requestSave} noValidate>
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Payment gateway</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {gatewayOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={configuration.gateway === option.value ? "secondary" : "outline"}
                      className="justify-start"
                      aria-pressed={configuration.gateway === option.value}
                      onClick={() => updateConfiguration("gateway", option.value)}
                    >
                      <ShieldCheck aria-hidden="true" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Environment</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {environmentOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={configuration.environment === option.value ? "secondary" : "outline"}
                      className="justify-start"
                      aria-pressed={configuration.environment === option.value}
                      onClick={() => updateConfiguration("environment", option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </fieldset>

              <Alert>
                <Info aria-hidden="true" />
                <AlertTitle>Metode pembayaran online: QRIS</AlertTitle>
                <AlertDescription>
                  Sistem photobooth hanya menampilkan QRIS. Kartu, transfer bank, e-wallet langsung, dan metode online lain tidak diaktifkan.
                </AlertDescription>
              </Alert>

              <div className="grid gap-5 sm:grid-cols-2">
                <PaymentKeyCredentialField
                  id="payment-merchant-id"
                  label="Merchant ID"
                  value={configuration.merchantId}
                  placeholder="Masukkan Merchant ID"
                  error={errors.merchantId}
                  onChange={(value) => updateConfiguration("merchantId", value)}
                />
                <PaymentKeyCredentialField
                  id="payment-client-key"
                  label="Client Key"
                  value={configuration.clientKey}
                  placeholder="Masukkan Client Key"
                  secret
                  error={errors.clientKey}
                  onChange={(value) => updateConfiguration("clientKey", value)}
                />
                <PaymentKeyCredentialField
                  id="payment-server-key"
                  label="Server Key"
                  value={configuration.serverKey}
                  placeholder="Masukkan Server Key"
                  secret
                  error={errors.serverKey}
                  onChange={(value) => updateConfiguration("serverKey", value)}
                />
                {configuration.gateway === "doku" && (
                  <PaymentKeyCredentialField
                    id="payment-secret-key"
                    label="Secret Key"
                    value={configuration.secretKey}
                    placeholder="Masukkan Secret Key DOKU"
                    secret
                    error={errors.secretKey}
                    description="Diperlukan untuk autentikasi DOKU."
                    onChange={(value) => updateConfiguration("secretKey", value)}
                  />
                )}
                <div className="sm:col-span-2">
                  <PaymentKeyCredentialField
                    id="payment-callback-url"
                    label="Webhook / Callback URL"
                    value={configuration.callbackUrl}
                    placeholder="https://domain.id/api/payments/callback"
                    error={errors.callbackUrl}
                    description="URL tujuan notifikasi status transaksi QRIS."
                    onChange={(value) => updateConfiguration("callbackUrl", value)}
                  />
                </div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <Label htmlFor="payment-qris-enabled">Status QRIS</Label>
                  <p className="mt-1 text-sm opacity-70">
                    Aktifkan penerimaan pembayaran QRIS pada kiosk.
                  </p>
                </div>
                <Switch
                  id="payment-qris-enabled"
                  checked={configuration.qrisEnabled}
                  onCheckedChange={(checked) => updateConfiguration("qrisEnabled", checked)}
                  aria-label="Aktifkan QRIS"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:flex-wrap sm:justify-between">
                <Button type="button" variant="destructive" onClick={() => setConfirmation("reset")}>
                  <RotateCcw aria-hidden="true" />
                  Reset Konfigurasi
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button type="button" variant="outline" disabled={connectionStatus === "testing"} onClick={testConnection}>
                    {connectionStatus === "testing" ? (
                      <LoaderCircle className="animate-spin" aria-hidden="true" />
                    ) : (
                      <PlugZap aria-hidden="true" />
                    )}
                    Test Connection
                  </Button>
                  <Button type="submit">
                    <Save aria-hidden="true" />
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <PaymentKeyStatus
            gateway={configuration.gateway}
            environment={configuration.environment}
            connectionStatus={connectionStatus}
            configStatus={configStatus}
            lastUpdatedAt={configuration.lastUpdatedAt}
          />
        </aside>
      </div>

      <PaymentKeyConfirmationDialog
        action={confirmation}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null)
        }}
        onConfirm={handleConfirmation}
      />
      <Toaster position="top-right" />
    </div>
  )
}
