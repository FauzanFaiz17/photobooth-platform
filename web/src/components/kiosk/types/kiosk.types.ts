export type KioskStatus = "online" | "offline" | "warning" | "maintenance"

export type KioskMode = "live" | "maintenance" | "offline" | "event"

export interface KioskIdentity {
  readonly id: string
  readonly name: string
  readonly location: string
  readonly assignedDevice: string
  readonly applicationVersion: string
  readonly lastSyncAt: string
  readonly status: KioskStatus
  readonly mode: KioskMode
}

export type DeviceHealthStatus =
  | "healthy"
  | "warning"
  | "disconnected"
  | "error"
  | "checking"

export type DeviceHealthId =
  | "camera"
  | "printer"
  | "payment-terminal"
  | "internet"
  | "storage"
  | "application"

export type DeviceHealthAction =
  | "test-camera"
  | "test-printer"
  | "check-payment"
  | "retry-connection"

export interface KioskDeviceHealthItem {
  readonly id: DeviceHealthId
  readonly label: string
  readonly status: DeviceHealthStatus
  readonly statusLabel: string
  readonly description: string
  readonly lastCheckedAt: string
  readonly action?: {
    readonly type: DeviceHealthAction
    readonly label: string
  }
}

export interface StorageUsage {
  readonly totalGb: number
  readonly usedGb: number
  readonly availableGb: number
  readonly usagePercentage: number
  readonly storedSessions: number
  readonly lastCleanupAt: string
}

export type SupportedLanguage = "id" | "en"

export type SupportedTimezone =
  | "Asia/Jakarta"
  | "Asia/Makassar"
  | "Asia/Jayapura"

export type SessionMode = "standard" | "live" | "event"

export interface KioskGeneralSettings {
  readonly kioskName: string
  readonly location: string
  readonly serviceName: string
  readonly defaultLanguage: SupportedLanguage
  readonly timezone: SupportedTimezone
  readonly sessionMode: SessionMode
  readonly autoUpdateDevice: boolean
  readonly enableLiveMode: boolean
}

export interface KioskSessionSettings {
  readonly sessionDurationMinutes: number
  readonly countdownSeconds: number
  readonly captureCount: number
  readonly allowRetake: boolean
  readonly allowExtraPrint: boolean
  readonly autoReturnToHome: boolean
  readonly idleTimeoutSeconds: number
  readonly showConfirmationScreen: boolean
}

export type PrintSize = "2x6" | "4x6" | "5x7"

export type PrinterStatus =
  | "ready"
  | "printing"
  | "warning"
  | "offline"
  | "error"

export interface KioskPrintSettings {
  readonly defaultPrintSize: PrintSize
  readonly numberOfCopies: number
  readonly automaticPrinting: boolean
  readonly extraPrintEnabled: boolean
  readonly printerName: string
  readonly paperStatus: "available" | "low" | "empty"
  readonly queueCount: number
  readonly printerStatus: PrinterStatus
}

export type PaymentProvider = "midtrans" | "xendit" | "doku" | "manual"

export type PaymentConnectionStatus = "active" | "inactive" | "warning" | "error"

export interface KioskPaymentSettings {
  readonly connectionStatus: PaymentConnectionStatus
  readonly provider: PaymentProvider
  readonly onlinePaymentEnabled: boolean
  readonly offlinePaymentEnabled: boolean
  readonly qrPaymentEnabled: boolean
  readonly cashPaymentEnabled: boolean
  readonly lastSuccessfulTransactionAt: string
  readonly successRate: number
}

export type KioskActivityType =
  | "system"
  | "printer"
  | "payment"
  | "frame"
  | "sync"
  | "storage"

export interface KioskActivity {
  readonly id: string
  readonly type: KioskActivityType
  readonly title: string
  readonly description: string
  readonly occurredAt: string
}

export type DiagnosticResult = "passed" | "warning" | "failed" | "not-run"

export type DiagnosticId =
  | "camera-test"
  | "printer-test"
  | "internet-latency"
  | "payment-connection"
  | "local-service"

export interface KioskDiagnosticItem {
  readonly id: DiagnosticId
  readonly label: string
  readonly result: DiagnosticResult
  readonly value: string
  readonly description: string
}

export interface KioskDiagnostics {
  readonly lastRunAt: string | null
  readonly items: ReadonlyArray<KioskDiagnosticItem>
}

export type MaintenanceActionId =
  | "restart-application"
  | "sync-data"
  | "clear-temporary-files"
  | "run-diagnostics"
  | "maintenance-mode"

export interface MaintenanceAction {
  readonly id: MaintenanceActionId
  readonly label: string
  readonly description: string
  readonly risk: "safe" | "destructive"
}

export type StatusBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"

export interface StatusMeta {
  readonly label: string
  readonly variant: StatusBadgeVariant
}

export type KioskTab =
  | "overview"
  | "configuration"
  | "device-health"
  | "activity"
  | "maintenance"

export type FieldErrors<T extends object> = Partial<Record<keyof T, string>>
