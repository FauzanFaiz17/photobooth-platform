import type { PaymentGateway, PaymentStatus } from "@/features/payments/payment.types"
import type { PrintJobStatus } from "@/features/print-jobs/print-job.types"
import type { TemplateStatus } from "@/features/templates/template.types"
import type { VoucherStatus } from "@/features/vouchers/voucher.types"
import {
  CalendarDays,
  ChartNoAxesCombined,
  Frame,
  Images,
  KeyRound,
  LayoutDashboard,
  Monitor,
  ReceiptText,
  Printer,
  ScrollText,
  TicketPercent,
  UsersRound,
  type LucideIcon,
  GitPullRequest,
} from "lucide-react"

export type AdminNavItem = {
  title: string
  url: string
  icon: LucideIcon
}

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Overview",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Kiosk",
    url: "/admin/kiosk",
    icon: Monitor,
  },
  {
    title: "Events",
    url: "/admin/events",
    icon: CalendarDays,
  },
  {
    title: "Gallery",
    url: "/admin/gallery",
    icon: Images,
  },
  {
    title: "Statistics",
    url: "/statistics",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: ReceiptText,
  },
  {
    title: "Print Jobs",
    url: "/print-jobs",
    icon: Printer,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: UsersRound,
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: ScrollText,
  },
  {
    title: "Frame Photo",
    url: "/frame-photo",
    icon: Frame,
  },
  {
    title: "Voucher",
    url: "/voucher",
    icon: TicketPercent,
  },
  {
    title: "Request",
    url: "/admin/request",
    icon: GitPullRequest,
  },
]

export const superAdminSettingsNavItems: AdminNavItem[] = [
  {
    title: "Audit Log",
    url: "/admin/audit-logs",
    icon: ScrollText,
  },
  {
    title: "Platform Credentials",
    url: "/admin/payment-key",
    icon: KeyRound,
  },
  {
    title: "Users",
    url: "/admin/settings/users",
    icon: UsersRound,
  },
]


// Template 2R dicetak di lembar 4R berisi dua strip identik, lalu dipotong tengah.
// Jadi kanvasnya sama-sama 1200x1800; yang membedakan hanya susunan slot dan paper_size.
export const FRAME_SIZES = {
  "2R": {
    width: 1200,
    height: 1800,
    label: "2R strip (cetak 4R, potong jadi 2)",
  },
  "4R": { width: 1200, height: 1800, label: "4R (10 x 15 cm)" },
} as const


/** Tinggi acuan pratinjau; lebarnya menyusul dari rasio kanvas Frame. */
export const PREVIEW_HEIGHT = 240;

export const statusLabels: Record<TemplateStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const dateFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const labels: Record<PrintJobStatus, string> = {
  queued: "Queued",
  printing: "Printing",
  success: "Success",
  failed: "Failed",
  cancelled: "Cancelled",
};

export const variants: Record<
  PrintJobStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  queued: "secondary",
  printing: "default",
  success: "default",
  failed: "destructive",
  cancelled: "outline",
};

export const gatewayLabels: Record<PaymentGateway, string> = {
  midtrans_qris: "QRIS Midtrans",
  voucher: "Voucher",
  cash: "Tunai",
  other: "Lainnya",
};

export const statusLabelsPayment: Record<PaymentStatus, string> = {
  pending: "Pending",
  paid: "Dibayar",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  refunded: "Dikembalikan",
};

export const statusVariants: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  paid: "default",
  failed: "destructive",
  expired: "outline",
  refunded: "secondary",
};


// Voucher
export const statusLabelsVoucher: Record<VoucherStatus, string> = {
  unused: "Belum dipakai",
  redeemed: "Sudah dipakai",
  expired: "Kedaluwarsa",
  void: "Dibatalkan",
};