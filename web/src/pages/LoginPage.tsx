import { useState, type FormEvent } from "react"
import {
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import loginPhotoboothImage from "@/assets/bg-login.png"
import photoBoothLogo from "@/assets/Logo Kolase.png"
import photoBoothLight from "@/assets/Logo Kolase Putih.png"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api-client"
import { useAuth } from "@/features/auth/auth-context"
import type { LoginCredentials } from "@/features/auth/auth.types"
import { useResolvedTheme } from "@/contexts/theme-context"

type LoginFieldErrors = Partial<Record<keyof LoginCredentials, string>>

function getPostLoginPath(locationState: unknown): string {
  if (typeof locationState !== "object" || locationState === null) {
    return "/admin"
  }

  const from = Reflect.get(locationState, "from")
  if (typeof from !== "object" || from === null) {
    return "/admin"
  }

  const pathname = Reflect.get(from, "pathname")
  const search = Reflect.get(from, "search")

  if (
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    pathname === "/login"
  ) {
    return "/admin"
  }

  return `${pathname}${typeof search === "string" ? search : ""}`
}

function validateCredentials(
  credentials: LoginCredentials
): LoginFieldErrors {
  const errors: LoginFieldErrors = {}
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!credentials.email.trim()) {
    errors.email = "Email wajib diisi."
  } else if (!emailPattern.test(credentials.email.trim())) {
    errors.email = "Masukkan alamat email yang valid."
  }

  if (!credentials.password) {
    errors.password = "Password wajib diisi."
  }

  return errors
}

function BrandMark() {
  const resolved = useResolvedTheme();
  return (
    <div className="flex items-center gap-3">
      <img 
      src={resolved === "dark" ? photoBoothLight : photoBoothLogo}
      alt="Logo Kolase"
      className="h-20 object-cover object-center"
      />
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  })
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateCredentials(credentials)
    setFieldErrors(validationErrors)
    setSubmitError(null)

    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)

    try {
      await login({
        email: credentials.email.trim(),
        password: credentials.password,
      })
      navigate(getPostLoginPath(location.state), { replace: true })
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const backendFieldErrors: LoginFieldErrors = {}

        if (error.validationErrors.email) {
          backendFieldErrors.email = "Masukkan alamat email yang valid."
        }

        if (error.validationErrors.password) {
          backendFieldErrors.password = "Password wajib diisi."
        }

        if (Object.keys(backendFieldErrors).length > 0) {
          setFieldErrors(backendFieldErrors)
        } else {
          setSubmitError(error.message)
        }
      } else {
        setSubmitError(
          "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid h-screen max-h-screen overflow-hidden bg-background lg:grid-cols-2">
      <section className="grid min-h-0 grid-rows-[auto_1fr_auto] overflow-y-auto px-5 py-6 sm:px-10 lg:px-14 lg:py-10 xl:px-20">
        <BrandMark />

        <div className="flex items-center justify-center py-10">
          <div className="w-full max-w-100">
            <div className="mb-9">
              <h2 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Masuk ke dashboard
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Gunakan akun pengelola yang sudah terdaftar.
              </p>
            </div>

            <form
              className="grid gap-5"
              onSubmit={handleSubmit}
              noValidate
            >
              {submitError && (
                <Alert variant="destructive">
                  <CircleAlert aria-hidden="true" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@perusahaan.com"
                  className="h-11 rounded-xl px-3.5"
                  value={credentials.email}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                  onChange={(event) => {
                    setCredentials((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                    setFieldErrors((current) => ({
                      ...current,
                      email: undefined,
                    }))
                    setSubmitError(null)
                  }}
                  autoFocus
                />
                {fieldErrors.email && (
                  <p id="email-error" className="text-xs text-destructive">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="grid gap-2.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    className="h-11 rounded-xl px-3.5 pr-11"
                    value={credentials.password}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={
                      fieldErrors.password ? "password-error" : undefined
                    }
                    onChange={(event) => {
                      setCredentials((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                      setFieldErrors((current) => ({
                        ...current,
                        password: undefined,
                      }))
                      setSubmitError(null)
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword
                        ? "Sembunyikan password"
                        : "Tampilkan password"
                    }
                    aria-pressed={showPassword}
                    disabled={isSubmitting}
                    onClick={() => setShowPassword((current) => !current)}
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </Button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="text-xs text-destructive">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-2 h-11 w-full rounded-xl bg-foreground text-background hover:bg-foreground/85"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Memproses...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs leading-5 text-muted-foreground sm:text-left">
          Akses terbatas untuk pengelola Photo Booth.
        </p>
      </section>

      <section className="hidden min-h-0 p-3 pl-0 lg:block">
        <img
          src={loginPhotoboothImage}
          alt="Perangkat Photo Booth di dalam studio"
          className="h-full w-full border border-black/20 rounded-[1.75rem] object-cover object-center"
        />
      </section>
    </main>
  )
}
