import { Fragment, type CSSProperties } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"

import { ModeToggle } from "../theme/mode-toggle"
import { AdminSidebar } from "../shared/sidebar-nav"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"
import { Separator } from "../ui/separator"
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar"
import { TooltipProvider } from "../ui/tooltip"

interface LayoutBreadcrumbItem {
  readonly label: string
  readonly href?: string
}

const pageLabels: Record<string, string> = {
  kiosk: "Kiosk",
  gallery: "Gallery",
  statistics: "Statistics",
  transactions: "Transactions",
  "frame-photo": "Frame Photo",
  frame: "Daftar Frame",
  voucher: "Voucher",
  "payment-key": "Payment Key",
  "frame-gift": "Frame Gift",
}

function formatPathSegment(segment: string): string {
  return decodeURIComponent(segment)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function createBreadcrumbItems(pathname: string): ReadonlyArray<LayoutBreadcrumbItem> {
  if (pathname === "/admin" || pathname === "/admin/") {
    return [{ label: "Overview" }]
  }

  const segments = pathname.split("/").filter(Boolean)
  const routeSegments = segments[0] === "admin" ? segments.slice(1) : segments
  const section = routeSegments[0]
  const detail = routeSegments[1]
  const action = routeSegments[2]
  const root: LayoutBreadcrumbItem = { label: "Overview", href: "/admin" }

  if (!section) return [{ label: "Overview" }]

  if (section === "frame") {
    if (detail === "new") {
      return [root, { label: "Daftar Frame", href: "/frame" }, { label: "Frame Baru" }]
    }
    if (detail && action === "edit") {
      return [root, { label: "Daftar Frame", href: "/frame" }, { label: `Ubah ${formatPathSegment(detail)}` }]
    }
    return [root, { label: "Daftar Frame" }]
  }

  if (section === "kiosk" && detail) {
    return [root, { label: "Kiosk", href: "/admin/kiosk" }, { label: formatPathSegment(detail) }]
  }

  if (section === "gallery" && detail) {
    return [root, { label: "Gallery", href: "/admin/gallery" }, { label: formatPathSegment(detail) }]
  }

  if (section === "voucher" && detail) {
    return [root, { label: "Voucher", href: "/voucher" }, { label: formatPathSegment(detail) }]
  }

  return [root, { label: pageLabels[section] ?? formatPathSegment(section) }]
}

export function SidebarLayout() {
  const { pathname } = useLocation()
  const breadcrumbItems = createBreadcrumbItems(pathname)

  return (
    <SidebarProvider style={{ "--sidebar-width": "14rem" } as CSSProperties}>
      <AdminSidebar />
      <main className="w-full flex-1 p-2 h-screen flex flex-col overflow-y-hidden bg-sidebar">
        <div className="w-full bg-background rounded-2xl border">
          <header className="flex rounded-2xl justify-between items-center bg-background w-full shrink-0 p-3 ">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              <Separator orientation="vertical" className="h-5" />
              <Breadcrumb className="min-w-0">
                <BreadcrumbList className="flex-nowrap">
                  {breadcrumbItems.map((item, index) => {
                    const current = index === breadcrumbItems.length - 1
                    return (
                      <Fragment key={`${item.label}-${index}`}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem className="min-w-0">
                          {current || !item.href ? (
                            <BreadcrumbPage className="max-w-52 truncate sm:max-w-none">
                              {item.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink render={<Link to={item.href} />}>
                              {item.label}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </Fragment>
                    )
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <ModeToggle />
          </header>
          {/* Container Shell Utama */}
          <section className="p-1 bg-background w-full  rounded-2xl h-[calc(100vh-5rem)] overflow-y-auto ">
            <TooltipProvider>
              <Outlet />
            </TooltipProvider>
          </section>
        </div>
      </main>
    </SidebarProvider>
  )
}
