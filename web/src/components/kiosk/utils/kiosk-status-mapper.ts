import {
  Camera,
  CircleDollarSign,
  Frame,
  HardDrive,
  MonitorCog,
  Printer,
  RefreshCw,
  ServerCog,
  Wifi,
  type LucideIcon,
} from "lucide-react"

import type {
  DeviceHealthId,
  DeviceHealthStatus,
  DiagnosticResult,
  KioskActivityType,
  KioskMode,
  KioskStatus,
  PaymentConnectionStatus,
  PrinterStatus,
  StatusMeta,
} from "../types/kiosk.types"

const kioskStatusMeta = {
  online: { label: "Online", variant: "default" },
  offline: { label: "Offline", variant: "destructive" },
  warning: { label: "Needs attention", variant: "secondary" },
  maintenance: { label: "Maintenance", variant: "outline" },
} satisfies Record<KioskStatus, StatusMeta>

const kioskModeMeta = {
  live: { label: "Live Mode", variant: "default" },
  maintenance: { label: "Maintenance Mode", variant: "outline" },
  offline: { label: "Offline Mode", variant: "destructive" },
  event: { label: "Event Mode", variant: "secondary" },
} satisfies Record<KioskMode, StatusMeta>

const deviceHealthStatusMeta = {
  healthy: { label: "Healthy", variant: "default" },
  warning: { label: "Warning", variant: "secondary" },
  disconnected: { label: "Disconnected", variant: "destructive" },
  error: { label: "Error", variant: "destructive" },
  checking: { label: "Checking", variant: "outline" },
} satisfies Record<DeviceHealthStatus, StatusMeta>

const printerStatusMeta = {
  ready: { label: "Ready", variant: "default" },
  printing: { label: "Printing", variant: "secondary" },
  warning: { label: "Warning", variant: "secondary" },
  offline: { label: "Offline", variant: "destructive" },
  error: { label: "Error", variant: "destructive" },
} satisfies Record<PrinterStatus, StatusMeta>

const paymentStatusMeta = {
  active: { label: "Active", variant: "default" },
  inactive: { label: "Inactive", variant: "outline" },
  warning: { label: "Warning", variant: "secondary" },
  error: { label: "Error", variant: "destructive" },
} satisfies Record<PaymentConnectionStatus, StatusMeta>

const diagnosticResultMeta = {
  passed: { label: "Passed", variant: "default" },
  warning: { label: "Warning", variant: "secondary" },
  failed: { label: "Failed", variant: "destructive" },
  "not-run": { label: "Not run", variant: "outline" },
} satisfies Record<DiagnosticResult, StatusMeta>

export const deviceHealthIcons = {
  camera: Camera,
  printer: Printer,
  "payment-terminal": CircleDollarSign,
  internet: Wifi,
  storage: HardDrive,
  application: MonitorCog,
} satisfies Record<DeviceHealthId, LucideIcon>

export const kioskActivityMeta = {
  system: { label: "System", icon: ServerCog },
  printer: { label: "Printer", icon: Printer },
  payment: { label: "Payment", icon: CircleDollarSign },
  frame: { label: "Frame", icon: Frame },
  sync: { label: "Sync", icon: RefreshCw },
  storage: { label: "Storage", icon: HardDrive },
} satisfies Record<KioskActivityType, { label: string; icon: LucideIcon }>

export const getKioskStatusMeta = (status: KioskStatus): StatusMeta =>
  kioskStatusMeta[status]

export const getKioskModeMeta = (mode: KioskMode): StatusMeta =>
  kioskModeMeta[mode]

export const getDeviceHealthStatusMeta = (
  status: DeviceHealthStatus
): StatusMeta => deviceHealthStatusMeta[status]

export const getPrinterStatusMeta = (status: PrinterStatus): StatusMeta =>
  printerStatusMeta[status]

export const getPaymentStatusMeta = (
  status: PaymentConnectionStatus
): StatusMeta => paymentStatusMeta[status]

export const getDiagnosticResultMeta = (
  result: DiagnosticResult
): StatusMeta => diagnosticResultMeta[result]
