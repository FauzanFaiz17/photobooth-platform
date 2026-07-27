import { useState } from "react"
import { ChevronUp, LoaderCircle, LogOut } from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"

import photoBoothLogo from "@/assets/react.svg"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  adminNavItems,
  superAdminSettingsNavItems,
  type AdminNavItem,
} from "@/constants"
import { isSuperAdmin } from "@/features/auth/auth-access"
import { resolveAvatarUrl } from "@/features/auth/auth-api"
import { useAuth } from "@/features/auth/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

function createInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
}

function SidebarNavigation({
  items,
  pathname,
}: {
  readonly items: ReadonlyArray<AdminNavItem>
  readonly pathname: string
}) {
  return (
    <SidebarMenu className="gap-1.5">
      {items.map((item) => {
        const isActive =
          pathname === item.url ||
          (item.url !== "/admin" && pathname.startsWith(`${item.url}/`))

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              render={<NavLink to={item.url} />}
              isActive={isActive}
              className={`
                w-full transition-all duration-300 ease-out group px-3 py-5 rounded-xl
                ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary hover:text-white"
                    : "text-muted-foreground hover:bg-primary hover:text-white"
                }
              `}
            >
              <item.icon
                className={`h-5 w-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
              />
              <span className="font-semibold text-sm tracking-wide">
                {item.title}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

export function AdminSidebar() {
  const pathname = useLocation().pathname
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const displayName = user?.name ?? "Pengguna"
  const displayRole = user?.role.name ?? "Pengelola"
  const avatarUrl = resolveAvatarUrl(user?.avatar ?? null)
  const initials = createInitials(displayName) || "PB"
  const showSuperAdminSettings = isSuperAdmin(user)

  async function handleLogout() {
    setIsLoggingOut(true)
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <Sidebar className="border-none">
      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-4 h-10 px-1">
            <img
              src={photoBoothLogo}
              alt="Photo Booth"
              className="h-10 w-auto max-w-full"
            />
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarNavigation items={adminNavItems} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        {showSuperAdminSettings && (
          <SidebarGroup className="pt-0">
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarNavigation
                items={superAdminSettingsNavItems}
                pathname={pathname}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 pt-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex h-14 w-full items-center gap-2 overflow-hidden rounded-xl border border-sidebar-border bg-background px-2.5 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-popup-open:bg-sidebar-accent"
                    aria-label="Buka menu akun"
                  />
                }
              >
                <Avatar size="lg">
                  {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  )}
                  <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {displayRole}
                  </span>
                </div>
                <ChevronUp
                  className="ml-auto size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="z-60 w-56"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-2 font-normal">
                    <p className="truncate text-sm font-medium text-foreground">
                      {displayName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="py-2"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                  >
                    {isLoggingOut ? (
                      <LoaderCircle
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <LogOut aria-hidden="true" />
                    )}
                    {isLoggingOut ? "Keluar..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
