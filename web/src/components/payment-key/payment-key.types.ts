export type PaymentGateway = "midtrans" | "doku"

export type PaymentEnvironment = "sandbox" | "production"

export type PaymentConnectionStatus =
  | "connected"
  | "disconnected"
  | "testing"
  | "error"

export type PaymentConfigStatus = "saved" | "unsaved" | "empty"

export interface PaymentKeyConfiguration {
  readonly gateway: PaymentGateway
  readonly environment: PaymentEnvironment
  readonly merchantId: string
  readonly clientKey: string
  readonly serverKey: string
  readonly secretKey: string
  readonly callbackUrl: string
  readonly qrisEnabled: boolean
  readonly lastUpdatedAt: string | null
}

export type PaymentKeyField =
  | "merchantId"
  | "clientKey"
  | "serverKey"
  | "secretKey"
  | "callbackUrl"

export type PaymentKeyErrors = Partial<Record<PaymentKeyField, string>>

export type PaymentKeyConfirmationAction = "save" | "reset"
