import {
  CalendarDays,
  ChartNoAxesCombined,
  Frame,
  Gift,
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
