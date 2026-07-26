import type { PaymentKeyConfiguration } from "./payment-key.types"

export const initialPaymentKeyConfiguration: PaymentKeyConfiguration = {
  gateway: "midtrans",
  environment: "sandbox",
  merchantId: "G812345678",
  clientKey: "SB-Mid-client-KolasePhotoBooth-2026",
  serverKey: "SB-Mid-server-KolasePhotoBooth-2026",
  secretKey: "",
  callbackUrl: "https://dashboard.kolase.id/api/payments/midtrans/callback",
  qrisEnabled: true,
  lastUpdatedAt: "2026-07-17T09:42:00+07:00",
}

export function createEmptyPaymentKeyConfiguration(
  current: PaymentKeyConfiguration
): PaymentKeyConfiguration {
  return {
    gateway: current.gateway,
    environment: current.environment,
    merchantId: "",
    clientKey: "",
    serverKey: "",
    secretKey: "",
    callbackUrl: "",
    qrisEnabled: false,
    lastUpdatedAt: null,
  }
}
