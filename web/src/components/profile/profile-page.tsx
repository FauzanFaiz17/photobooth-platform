import {
  Building2,
  CircleAlert,
  Clock3,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { ProfileItem } from "./components/profile-item";
import { useProfile } from "./hooks/use-profile";
import { resolveAvatarUrl } from "@/features/auth/auth-api";
import { initials } from "./utils";


export function ProfilePage() {
  const {loadState, errorMessage, setRetryKey, profile} = useProfile()

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informasi akun yang sedang login.
        </p>
      </header>
      {loadState === "loading" && (
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>
      )}
      {loadState === "error" && (
        <Card>
          <CardContent className="grid min-h-64 place-items-center text-center">
            <div>
              <CircleAlert className="mx-auto size-10 text-destructive" />
              <p className="mt-3 font-medium">Profile gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setRetryKey((value) => value + 1)}
              >
                <RefreshCw aria-hidden="true" /> Coba lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {loadState === "success" && profile && (
        <>
          <Card>
            <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
              <Avatar className="size-24">
                <AvatarImage
                  src={resolveAvatarUrl(profile.avatar) ?? undefined}
                  alt={profile.name}
                />
                <AvatarFallback className="bg-primary text-xl font-semibold text-primary-foreground">
                  {initials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold">{profile.name}</h2>
                  <Badge
                    variant={
                      profile.status === "active" ? "default" : "secondary"
                    }
                  >
                    {profile.status}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {profile.role.name || "Role belum tersedia"}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Profile masih read-only karena backend belum menyediakan
                  endpoint update profile.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Informasi akun</CardTitle>
              <CardDescription>
                Data dari `GET /api/v1/profile`.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <ProfileItem icon={Mail} label="Email" value={profile.email} />
              <ProfileItem
                icon={Phone}
                label="Telepon"
                value={profile.phone || "—"}
              />
              <ProfileItem
                icon={ShieldCheck}
                label="Role"
                value={profile.role.name || "—"}
              />
              <ProfileItem
                icon={Building2}
                label="Partner/Kiosk"
                value={
                  profile.partner?.brand_name ||
                  profile.partner?.company_name ||
                  "Platform / Global"
                }
              />
              <ProfileItem
                icon={Clock3}
                label="Login terakhir"
                value={formatDate(profile.last_login_at)}
              />
              <ProfileItem
                icon={UserRound}
                label="Akun dibuat"
                value={formatDate(profile.created_at)}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
