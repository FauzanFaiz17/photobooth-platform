import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CircleAlert,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import loginPhotoboothImage from "@/assets/preview.webp";
import photoBoothLogo from "@/assets/Logo Kolase.png";
import photoBoothLight from "@/assets/Logo Kolase Putih.png";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/features/auth/auth-context";
import type { LoginCredentials } from "@/features/auth/auth.types";

type LoginFieldErrors = Partial<Record<keyof LoginCredentials, string>>;

function getPostLoginPath(locationState: unknown): string {
  if (typeof locationState !== "object" || locationState === null) {
    return "/admin";
  }

  const from = Reflect.get(locationState, "from");
  if (typeof from !== "object" || from === null) {
    return "/admin";
  }

  const pathname = Reflect.get(from, "pathname");
  const search = Reflect.get(from, "search");

  if (
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    pathname === "/login"
  ) {
    return "/admin";
  }

  return `${pathname}${typeof search === "string" ? search : ""}`;
}

function validateCredentials(credentials: LoginCredentials): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!credentials.email.trim()) {
    errors.email = "Email wajib diisi.";
  } else if (!emailPattern.test(credentials.email.trim())) {
    errors.email = "Masukkan alamat email yang valid.";
  }

  if (!credentials.password) {
    errors.password = "Password wajib diisi.";
  }

  return errors;
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div className="flex items-center">
      <img
        src={photoBoothLogo}
        alt="Logo Kolase"
        className={`${className} w-auto object-contain dark:hidden`}
      />
      <img
        src={photoBoothLight}
        alt="Logo Kolase"
        className={`${className} hidden w-auto object-contain dark:block`}
      />
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateCredentials(credentials);
    setFieldErrors(validationErrors);
    setSubmitError(null);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await login({
        email: credentials.email.trim(),
        password: credentials.password,
      });
      navigate(getPostLoginPath(location.state), { replace: true });
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const backendFieldErrors: LoginFieldErrors = {};

        if (error.validationErrors.email) {
          backendFieldErrors.email = "Masukkan alamat email yang valid.";
        }

        if (error.validationErrors.password) {
          backendFieldErrors.password = "Password wajib diisi.";
        }

        if (Object.keys(backendFieldErrors).length > 0) {
          setFieldErrors(backendFieldErrors);
        } else {
          setSubmitError(error.message);
        }
      } else {
        setSubmitError(
          "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      lang="id"
      className="grid max-h-[90vh] bg-background font-sans text-foreground lg:grid-cols-[1.05fr_1fr]"
    >
      <aside
        className="hidden py-2 pl-5 lg:block"
        aria-label="Studio Photo Booth"
      >
        <div className="flex flex-col items-center justify-center gap-8 overflow-hidden rounded-3xl bg-muted px-10 py-10 xl:px-12">
          <div className="relative w-full max-w-80 xl:max-w-88">
            <div
              className="absolute inset-1 rotate-4 rounded-sm border border-border bg-background shadow-sm"
              aria-hidden="true"
            />
            <figure className="relative -rotate-4 rounded-sm border border-border bg-card p-3 pb-6 shadow-lg">
              <img
                src={loginPhotoboothImage}
                alt="Perangkat Photo Booth di dalam studio"
                width={864}
                height={1821}
                fetchPriority="high"
                className="aspect-4/5 w-full object-cover object-[center_25%] grayscale"
              />
              <figcaption className="mt-5 flex justify-center text-center text-sm font-medium text-card-foreground">
                <BrandMark className="h-12" />
              </figcaption>
            </figure>
            <div
              className="pointer-events-none absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 -rotate-8 border border-border bg-secondary/80"
              aria-hidden="true"
            />
          </div>
          <div className="max-w-80 text-center">
            <h2 className="text-3xl leading-tight font-semibold tracking-[-0.035em]">
              Momen seru, kelola dengan mudah.
            </h2>
          </div>
        </div>
      </aside>
      <section className="mx-auto grid w-full max-w-3xl grid-rows-[auto_1fr_auto] px-6 py-6 sm:px-12 sm:py-10 lg:px-14 xl:px-24">
        <BrandMark className="h-14" />

        <div className="flex items-center justify-center py-10 sm:py-12">
          <div className="w-full max-w-100">
            <div className="mb-8">
              <h1 className="max-w-80 text-[2rem] leading-[1.15] font-semibold font-sans tracking-[-0.04em] sm:text-[2.5rem]">
                Masuk ke dashboard
              </h1>
              <p className="mt-4 max-w-75 text-sm leading-6 font-sans text-muted-foreground">
                Gunakan akun pengelola yang sudah terdaftar.
              </p>
            </div>

            <form
              className="grid gap-6"
              aria-label="Masuk ke dashboard"
              aria-busy={isSubmitting}
              onSubmit={handleSubmit}
              noValidate
            >
              {submitError && (
                <Alert
                  variant="destructive"
                  className="rounded-xl border-destructive bg-card"
                >
                  <CircleAlert aria-hidden="true" />
                  <AlertDescription className="text-destructive">
                    {submitError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2.5">
                <Label htmlFor="email" className="font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nama@perusahaan.com"
                  className="h-13 rounded-xl border-muted-foreground bg-background px-4 shadow-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/20 motion-reduce:transition-none dark:bg-background dark:aria-invalid:border-destructive"
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
                    }));
                    setFieldErrors((current) => ({
                      ...current,
                      email: undefined,
                    }));
                    setSubmitError(null);
                  }}
                  autoFocus
                />
                {fieldErrors.email && (
                  <p
                    id="email-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="grid gap-2.5">
                <Label htmlFor="password" className="font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    className="h-13 rounded-xl border-muted-foreground bg-background px-4 pr-14 shadow-none placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground/20 motion-reduce:transition-none dark:bg-background dark:aria-invalid:border-destructive"
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
                      }));
                      setFieldErrors((current) => ({
                        ...current,
                        password: undefined,
                      }));
                      setSubmitError(null);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 size-11 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-foreground motion-reduce:transition-none"
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
                  <p
                    id="password-error"
                    role="alert"
                    className="text-sm text-destructive"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                aria-live="polite"
                className="mt-2 h-13 w-full gap-3 rounded-xl bg-linear-to-b from-white/20 to-primary px-6 text-sm font-semibold text-primary-foreground transition-transform hover:bg-primary active:scale-[0.98] active:not-aria-[haspopup]:translate-y-px focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background motion-reduce:transition-none"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <LockKeyhole
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          Akses terbatas untuk pengelola Photo Booth.
        </p>
      </section>
    </main>
  );
}
