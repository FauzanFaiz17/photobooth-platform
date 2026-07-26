import {
  ChartNoAxesCombined,
  Frame,
  Gift,
  Images,
  KeyRound,
  LayoutDashboard,
  Monitor,
  ReceiptText,
  TicketPercent,
  type LucideIcon,
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
    title: "Frame Photo",
    url: "/frame-photo",
    icon: Frame,
  },
  {
    title: "Frame Gift",
    url: "/admin/frame-gift",
    icon: Gift,
  },
  {
    title: "Voucher",
    url: "/voucher",
    icon: TicketPercent,
  },
  {
    title: "Payment key",
    url: "/admin/payment-key",
    icon: KeyRound,
  },
]
