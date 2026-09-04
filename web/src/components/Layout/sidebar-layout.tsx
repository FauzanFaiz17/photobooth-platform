import { Fragment, type CSSProperties } from "react";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";

import { Notification } from "../shared/notification";
import { AdminSidebar } from "../shared/sidebar-nav";
import { ModeToggle } from "../theme/mode-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { Separator } from "../ui/separator";
import { SidebarProvider, SidebarTrigger } from "../ui/sidebar";
import { TooltipProvider } from "../ui/tooltip";

interface LayoutBreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

const pageLabels: Record<string, string> = {
  kiosk: "Kiosk",
  events: "Events",
  gallery: "Gallery",
  statistics: "Statistics",
  transactions: "Transactions",
  "print-jobs": "Print Jobs",
  customers: "Customers",
  "frame-photo": "Frame Photo",
  frame: "Daftar Frame",
  voucher: "Voucher",
  "payment-key": "Platform Credentials",
  "frame-gift": "Frame Gift",
  forbidden: "Akses Ditolak",
  profile: "Profile",
  subscriptions: "Subscriptions",
  "audit-logs": "Audit Log",
};

function formatPathSegment(segment: string): string {
  return decodeURIComponent(segment)
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function createBreadcrumbItems(
  pathname: string,
  searchParams: URLSearchParams,
): ReadonlyArray<LayoutBreadcrumbItem> {
  if (pathname === "/admin" || pathname === "/admin/") {
    return [{ label: "Overview" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const routeSegments = segments[0] === "admin" ? segments.slice(1) : segments;
  const section = routeSegments[0];
  const detail = routeSegments[1];
  const action = routeSegments[2];
  const root: LayoutBreadcrumbItem = { label: "Overview", href: "/admin" };

  if (!section) return [{ label: "Overview" }];

  if (section === "frame") {
    return [root, { label: "Daftar Frame" }];
  }

  if (section === "frame-photo" && detail === "create") {
    return [
      root,
      { label: "Frame Photo", href: "/frame-photo" },
      { label: "Frame Baru" },
    ];
  }

  if (section === "frame-photo" && action === "edit") {
    return [
      root,
      { label: "Frame Photo", href: "/frame-photo" },
      { label: "Edit Frame" },
    ];
  }

  if (section === "kiosk" && detail) {
    return [
      root,
      { label: "Kiosk", href: "/admin/kiosk" },
      { label: formatPathSegment(detail) },
    ];
  }

  if (section === "events" && detail) {
    return [
      root,
      { label: "Events", href: "/admin/events" },
      { label: "Detail Event" },
    ];
  }

  if (section === "gallery" && detail) {
    return [
      root,
      { label: "Gallery", href: "/admin/gallery" },
      { label: formatPathSegment(detail) },
    ];
  }

  if (section === "gallery") {
    const partnerId = searchParams.get("partner_id");
    const eventId = searchParams.get("event_id");
    if (eventId && partnerId) {
      return [
        root,
        { label: "Gallery", href: "/admin/gallery" },
        { label: `Kiosk #${partnerId}`, href: `/admin/gallery?partner_id=${encodeURIComponent(partnerId)}` },
        { label: `Event #${eventId}` },
      ];
    }
    if (partnerId) {
      return [
        root,
        { label: "Gallery", href: "/admin/gallery" },
        { label: `Kiosk #${partnerId}` },
      ];
    }
  }

  if (section === "voucher" && detail) {
    return [
      root,
      { label: "Voucher", href: "/voucher" },
      { label: formatPathSegment(detail) },
    ];
  }

  if (section === "settings" && detail === "users") {
    if (action) {
      return [
        root,
        { label: "Settings" },
        { label: "Users", href: "/admin/settings/users" },
        { label: "Detail User" },
      ];
    }

    return [root, { label: "Settings" }, { label: "Users" }];
  }

  return [root, { label: pageLabels[section] ?? formatPathSegment(section) }];
}

export function SidebarLayout() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const breadcrumbItems = createBreadcrumbItems(pathname, searchParams);

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
                    const current = index === breadcrumbItems.length - 1;
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
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <Notification />
              <ModeToggle />
            </div>
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
  );
}
