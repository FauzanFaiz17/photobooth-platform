import type { AuthUser } from "./auth.types"

export const SUPER_ADMIN_ROLE_SLUG = "super-admin"

export function isSuperAdmin(user: AuthUser | null): boolean {
  return user?.role.slug === SUPER_ADMIN_ROLE_SLUG
}
