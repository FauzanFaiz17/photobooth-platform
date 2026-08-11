import { Building2, CircleAlert, Clock3, Mail, Phone, RefreshCw, ShieldCheck, UserRound } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { profileRequest, resolveAvatarUrl } from "@/features/auth/auth-api"
import { useAuth } from "@/features/auth/auth-context"
import type { AuthUser } from "@/features/auth/auth.types"
import { ApiError } from "@/lib/api-client"

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("") || "PB"
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(value))
}

function ProfileItem({ icon: Icon, label, value }: { readonly icon: typeof Mail; readonly label: string; readonly value: string }) {
  return <div className="flex items-start gap-3 rounded-lg border p-4"><Icon className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" /><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words font-medium">{value}</p></div></div>
}

export function ProfilePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const [profile, setProfile] = useState<AuthUser | null>(null)
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [retryKey, setRetryKey] = useState(0)

  const handleUnauthorized = useCallback(async () => {
    await logout()
    navigate("/login", { replace: true, state: { from: location } })
  }, [location, logout, navigate])

  useEffect(() => {
    if (!token) return
    const accessToken = token
    const controller = new AbortController()

    async function loadProfile() {
      setLoadState("loading")
      setErrorMessage("")
      try {
        const result = await profileRequest(accessToken)
        if (controller.signal.aborted) return
        setProfile(result)
        setLoadState("success")
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.status === 401) return void handleUnauthorized()
        setProfile(null)
        setErrorMessage(error instanceof ApiError ? error.message : "Tidak dapat terhubung ke server.")
        setLoadState("error")
      }
    }

    void loadProfile()
    return () => controller.abort()
  }, [handleUnauthorized, retryKey, token])

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header><h1 className="text-2xl font-semibold tracking-tight">Profile</h1><p className="mt-1 text-sm text-muted-foreground">Informasi akun yang sedang login.</p></header>
      {loadState === "loading" && <div className="space-y-4" aria-busy><Skeleton className="h-44 w-full rounded-xl" /><div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-24 rounded-xl" /></div></div>}
      {loadState === "error" && <Card><CardContent className="grid min-h-64 place-items-center text-center"><div><CircleAlert className="mx-auto size-10 text-destructive" /><p className="mt-3 font-medium">Profile gagal dimuat</p><p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p><Button className="mt-4" variant="outline" onClick={() => setRetryKey((value) => value + 1)}><RefreshCw aria-hidden="true" /> Coba lagi</Button></div></CardContent></Card>}
      {loadState === "success" && profile && <>
        <Card><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center"><Avatar className="size-24"><AvatarImage src={resolveAvatarUrl(profile.avatar) ?? undefined} alt={profile.name} /><AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">{initials(profile.name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-semibold">{profile.name}</h2><Badge variant={profile.status === "active" ? "default" : "secondary"}>{profile.status}</Badge></div><p className="mt-1 text-muted-foreground">{profile.role.name || "Role belum tersedia"}</p><p className="mt-3 text-sm text-muted-foreground">Profile masih read-only karena backend belum menyediakan endpoint update profile.</p></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Informasi akun</CardTitle><CardDescription>Data dari `GET /api/v1/profile`.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><ProfileItem icon={Mail} label="Email" value={profile.email} /><ProfileItem icon={Phone} label="Telepon" value={profile.phone || "—"} /><ProfileItem icon={ShieldCheck} label="Role" value={profile.role.name || "—"} /><ProfileItem icon={Building2} label="Partner/Kiosk" value={profile.partner?.brand_name || profile.partner?.company_name || "Platform / Global"} /><ProfileItem icon={Clock3} label="Login terakhir" value={formatDate(profile.last_login_at)} /><ProfileItem icon={UserRound} label="Akun dibuat" value={formatDate(profile.created_at)} /></CardContent></Card>
      </>}
    </div>
  )
}
