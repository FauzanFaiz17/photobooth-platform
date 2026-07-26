import type {
  KioskActivity,
  KioskDeviceHealthItem,
  KioskDiagnostics,
  KioskGeneralSettings,
  KioskIdentity,
  KioskPaymentSettings,
  KioskPrintSettings,
  KioskSessionSettings,
  MaintenanceAction,
  StorageUsage,
} from "../types/kiosk.types"

export const kioskReferenceTime = "2026-07-15T22:33:00+07:00"

export const kioskIdentity = {
  id: "KSK-001",
  name: "Main Studio Booth",
  location: "Garut Main Studio",
  assignedDevice: "PHOTOBOOTH-PC-01",
  applicationVersion: "v2.4.1",
  lastSyncAt: "2026-07-15T22:31:00+07:00",
  status: "online",
  mode: "live",
} satisfies KioskIdentity

export const kioskDeviceHealth = [
  {
    id: "camera",
    label: "Camera",
    status: "healthy",
    statusLabel: "Connected",
    description: "Canon EOS M50 terhubung melalui USB.",
    lastCheckedAt: "2026-07-15T22:31:00+07:00",
    action: { type: "test-camera", label: "Test camera" },
  },
  {
    id: "printer",
    label: "Printer",
    status: "healthy",
    statusLabel: "Ready",
    description: "DNP DS-RX1 siap mencetak, antrean kosong.",
    lastCheckedAt: "2026-07-15T22:30:00+07:00",
    action: { type: "test-printer", label: "Test printer" },
  },
  {
    id: "payment-terminal",
    label: "Payment terminal",
    status: "healthy",
    statusLabel: "Active",
    description: "Midtrans QRIS aktif dan dapat menerima pembayaran.",
    lastCheckedAt: "2026-07-15T22:30:00+07:00",
    action: { type: "check-payment", label: "Check connection" },
  },
  {
    id: "internet",
    label: "Internet connection",
    status: "healthy",
    statusLabel: "Stable",
    description: "Koneksi stabil dengan latency 28 ms.",
    lastCheckedAt: "2026-07-15T22:32:00+07:00",
    action: { type: "retry-connection", label: "Retest" },
  },
  {
    id: "storage",
    label: "Local storage",
    status: "warning",
    statusLabel: "68% used",
    description: "174 GB digunakan dari total 256 GB.",
    lastCheckedAt: "2026-07-15T22:29:00+07:00",
  },
  {
    id: "application",
    label: "Application service",
    status: "healthy",
    statusLabel: "Running",
    description: "Photobooth service berjalan pada v2.4.1.",
    lastCheckedAt: "2026-07-15T22:32:00+07:00",
  },
] satisfies ReadonlyArray<KioskDeviceHealthItem>

export const kioskStorageUsage = {
  totalGb: 256,
  usedGb: 174,
  availableGb: 82,
  usagePercentage: 68,
  storedSessions: 1_842,
  lastCleanupAt: "2026-07-12T03:00:00+07:00",
} satisfies StorageUsage

export const kioskGeneralSettings = {
  kioskName: "Main Studio Booth",
  location: "Garut Main Studio",
  serviceName: "Photolab Garut",
  defaultLanguage: "id",
  timezone: "Asia/Jakarta",
  sessionMode: "live",
  autoUpdateDevice: true,
  enableLiveMode: true,
} satisfies KioskGeneralSettings

export const kioskSessionSettings = {
  sessionDurationMinutes: 5,
  countdownSeconds: 5,
  captureCount: 4,
  allowRetake: true,
  allowExtraPrint: true,
  autoReturnToHome: true,
  idleTimeoutSeconds: 90,
  showConfirmationScreen: true,
} satisfies KioskSessionSettings

export const kioskPrintSettings = {
  defaultPrintSize: "4x6",
  numberOfCopies: 1,
  automaticPrinting: true,
  extraPrintEnabled: true,
  printerName: "DNP DS-RX1",
  paperStatus: "available",
  queueCount: 0,
  printerStatus: "ready",
} satisfies KioskPrintSettings

export const kioskPaymentSettings = {
  connectionStatus: "active",
  provider: "midtrans",
  onlinePaymentEnabled: true,
  offlinePaymentEnabled: true,
  qrPaymentEnabled: true,
  cashPaymentEnabled: true,
  lastSuccessfulTransactionAt: "2026-07-15T22:24:00+07:00",
  successRate: 98.7,
} satisfies KioskPaymentSettings

export const kioskActivities = [
  {
    id: "activity-system-online",
    type: "system",
    title: "Kiosk berhasil online",
    description: "Application service dan seluruh perangkat utama siap digunakan.",
    occurredAt: "2026-07-15T22:32:00+07:00",
  },
  {
    id: "activity-printer-complete",
    type: "printer",
    title: "Printer menyelesaikan proses cetak",
    description: "Dua lembar foto 4x6 selesai dicetak tanpa antrean tersisa.",
    occurredAt: "2026-07-15T22:26:00+07:00",
  },
  {
    id: "activity-payment-success",
    type: "payment",
    title: "Pembayaran QR berhasil",
    description: "Transaksi Rp75.000 dikonfirmasi oleh Midtrans.",
    occurredAt: "2026-07-15T22:24:00+07:00",
  },
  {
    id: "activity-frame-update",
    type: "frame",
    title: "Frame default diperbarui",
    description: "Graduation Classic ditetapkan sebagai frame awal.",
    occurredAt: "2026-07-15T21:48:00+07:00",
  },
  {
    id: "activity-sync-complete",
    type: "sync",
    title: "Sinkronisasi data selesai",
    description: "128 record transaksi dan aset berhasil disinkronkan.",
    occurredAt: "2026-07-15T21:30:00+07:00",
  },
  {
    id: "activity-storage-cleanup",
    type: "storage",
    title: "Storage cleanup dijalankan",
    description: "12 GB temporary files berhasil dibersihkan.",
    occurredAt: "2026-07-12T03:00:00+07:00",
  },
] satisfies ReadonlyArray<KioskActivity>

export const initialKioskDiagnostics = {
  lastRunAt: null,
  items: [
    { id: "camera-test", label: "Camera test", result: "not-run", value: "—", description: "Belum diperiksa." },
    { id: "printer-test", label: "Printer test", result: "not-run", value: "—", description: "Belum diperiksa." },
    { id: "internet-latency", label: "Internet latency", result: "not-run", value: "—", description: "Belum diperiksa." },
    { id: "payment-connection", label: "Payment connection", result: "not-run", value: "—", description: "Belum diperiksa." },
    { id: "local-service", label: "Local service health", result: "not-run", value: "—", description: "Belum diperiksa." },
  ],
} satisfies KioskDiagnostics

export const completedKioskDiagnostics = {
  lastRunAt: kioskReferenceTime,
  items: [
    { id: "camera-test", label: "Camera test", result: "passed", value: "Connected", description: "Capture dan preview berhasil." },
    { id: "printer-test", label: "Printer test", result: "passed", value: "Ready", description: "Printer merespons dan antrean kosong." },
    { id: "internet-latency", label: "Internet latency", result: "passed", value: "28 ms", description: "Koneksi stabil untuk sinkronisasi." },
    { id: "payment-connection", label: "Payment connection", result: "passed", value: "Active", description: "Provider menerima health check." },
    { id: "local-service", label: "Local service health", result: "passed", value: "Running", description: "Seluruh service utama aktif." },
  ],
} satisfies KioskDiagnostics

export const maintenanceActions = [
  {
    id: "restart-application",
    label: "Restart application",
    description: "Restart service kiosk tanpa mematikan perangkat.",
    risk: "destructive",
  },
  {
    id: "sync-data",
    label: "Sync data",
    description: "Sinkronkan transaksi, frame, dan configuration terbaru.",
    risk: "safe",
  },
  {
    id: "clear-temporary-files",
    label: "Clear temporary files",
    description: "Hapus cache preview dan file sesi sementara.",
    risk: "destructive",
  },
  {
    id: "run-diagnostics",
    label: "Run diagnostics",
    description: "Periksa koneksi seluruh perangkat dan service.",
    risk: "safe",
  },
  {
    id: "maintenance-mode",
    label: "Enter maintenance mode",
    description: "Hentikan sesi baru sampai mode dinonaktifkan.",
    risk: "destructive",
  },
] satisfies ReadonlyArray<MaintenanceAction>
