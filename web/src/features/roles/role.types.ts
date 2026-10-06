export interface PermissionRecord {
  id: number
  name: string
  slug: string
  module: string
  description: string | null
}

export interface PermissionGroup {
  module: string
  permissions: ReadonlyArray<PermissionRecord>
}

export interface RoleRecord {
  id: number
  name: string
  slug: string
  level: number
  description: string | null
  is_system: boolean
  users_count: number
  permission_ids: ReadonlyArray<number>
  permission_slugs: ReadonlyArray<string>
}

export interface RoleListResponse {
  success: true
  message: string
  data: ReadonlyArray<RoleRecord>
}

export interface RoleResponse {
  success: true
  message: string
  data: RoleRecord
}

export interface PermissionGroupListResponse {
  success: true
  message: string
  data: ReadonlyArray<PermissionGroup>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string"
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isNumber)
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  )
}


function isBooleanLike(value: unknown): boolean {
  return (
    typeof value === "boolean" ||
    value === 0 ||
    value === 1
  )
}

function isSuccessEnvelope(value: unknown): value is Record<string, unknown> {
  return (
    isRecord(value) &&
    value.success === true &&
    typeof value.message === "string"
  )
}

export function isRoleRecord(value: unknown): value is RoleRecord {
  if (!isRecord(value)) return false

  return (
    isNumber(value.id) &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    isNumber(value.level) &&
    isNullableString(value.description) &&
    isBooleanLike(value.is_system) &&
    isNumber(value.users_count) &&
    isNumberArray(value.permission_ids) &&
    isStringArray(value.permission_slugs)
  )
}

function isPermissionRecord(value: unknown): value is PermissionRecord {
  if (!isRecord(value)) return false

  return (
    isNumber(value.id) &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.module === "string" &&
    isNullableString(value.description)
  )
}

function isPermissionGroup(value: unknown): value is PermissionGroup {
  if (!isRecord(value)) return false

  return (
    typeof value.module === "string" &&
    Array.isArray(value.permissions) &&
    value.permissions.every(isPermissionRecord)
  )
}

export function isRoleListResponse(value: unknown): value is RoleListResponse {
  return (
    isSuccessEnvelope(value) &&
    Array.isArray(value.data) &&
    value.data.every(isRoleRecord)
  )
}

export function isRoleResponse(value: unknown): value is RoleResponse {
  return isSuccessEnvelope(value) && isRoleRecord(value.data)
}

export function isPermissionGroupListResponse(
  value: unknown
): value is PermissionGroupListResponse {
  return (
    isSuccessEnvelope(value) &&
    Array.isArray(value.data) &&
    value.data.every(isPermissionGroup)
  )
}
