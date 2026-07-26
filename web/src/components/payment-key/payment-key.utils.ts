import type {
  PaymentGateway,
  PaymentKeyConfiguration,
  PaymentKeyErrors,
} from "./payment-key.types"

export const paymentGatewayLabels: Record<PaymentGateway, string> = {
  midtrans: "Midtrans",
  doku: "DOKU",
}

export function validatePaymentKeyConfiguration(
  configuration: PaymentKeyConfiguration
): PaymentKeyErrors {
  const errors: PaymentKeyErrors = {}

  if (configuration.merchantId.trim().length < 4) {
    errors.merchantId = "Merchant ID wajib diisi minimal 4 karakter."
  }
  if (configuration.clientKey.trim().length < 8) {
    errors.clientKey = "Client Key wajib diisi minimal 8 karakter."
  }
  if (configuration.serverKey.trim().length < 8) {
    errors.serverKey = "Server Key wajib diisi minimal 8 karakter."
  }
  if (
    configuration.gateway === "doku" &&
    configuration.secretKey.trim().length < 8
  ) {
    errors.secretKey = "Secret Key DOKU wajib diisi minimal 8 karakter."
  }

  try {
    const callbackUrl = new URL(configuration.callbackUrl)
    if (!callbackUrl.protocol.startsWith("http")) {
      errors.callbackUrl = "Callback URL harus menggunakan HTTP atau HTTPS."
    }
  } catch {
    errors.callbackUrl = "Masukkan Callback URL yang valid."
  }

  return errors
}

export function isPaymentConfigurationEmpty(
  configuration: PaymentKeyConfiguration
): boolean {
  return [
    configuration.merchantId,
    configuration.clientKey,
    configuration.serverKey,
    configuration.secretKey,
    configuration.callbackUrl,
  ].every((value) => value.trim().length === 0)
}

export function formatPaymentUpdatedAt(value: string | null): string {
  if (!value) return "Belum pernah disimpan"

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))
}
