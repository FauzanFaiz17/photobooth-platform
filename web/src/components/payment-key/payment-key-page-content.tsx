import {
  Cloud,
  KeyRound,
  LoaderCircle,
  PlugZap,
  RefreshCw,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/features/auth/auth-context";
import {
  clearMidtransSettings,
  clearR2Settings,
  getMidtransSettings,
  getR2Settings,
  testMidtransSettings,
  testR2Settings,
  updateMidtransSettings,
  updateR2Settings,
} from "@/features/platform-settings/platform-settings-service";
import type {
  MidtransSettings,
  R2Settings,
} from "@/features/platform-settings/platform-settings.types";
import { ApiError } from "@/lib/api-client";

import { PaymentKeyCredentialField } from "./payment-key-credential-field";

interface MidtransForm {
  merchant_id: string;
  client_key: string;
  server_key: string;
  production: boolean;
  qris_enabled: boolean;
  timeout: string;
}
interface R2Form {
  access_key_id: string;
  secret_access_key: string;
  bucket: string;
  endpoint: string;
  region: string;
  use_path_style_endpoint: boolean;
  enabled: boolean;
}
type Confirmation = "midtrans" | "r2" | null;

const emptyMidtrans: MidtransForm = {
  merchant_id: "",
  client_key: "",
  server_key: "",
  production: false,
  qris_enabled: true,
  timeout: "15",
};
const emptyR2: R2Form = {
  access_key_id: "",
  secret_access_key: "",
  bucket: "",
  endpoint: "",
  region: "auto",
  use_path_style_endpoint: true,
  enabled: false,
};

function updatedAt(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Belum pernah disimpan";
}

function message(error: unknown): string {
  if (!(error instanceof ApiError)) return "Tidak dapat terhubung ke server.";
  return Object.values(error.validationErrors).flat()[0] ?? error.message;
}

export function PaymentKeyPageContent(): ReactElement {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [midtrans, setMidtrans] = useState<MidtransSettings | null>(null);
  const [r2, setR2] = useState<R2Settings | null>(null);
  const [midtransForm, setMidtransForm] = useState<MidtransForm>(emptyMidtrans);
  const [r2Form, setR2Form] = useState<R2Form>(emptyR2);
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState<
    "midtrans-save" | "midtrans-test" | "r2-save" | "r2-test" | "reset" | null
  >(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [retry, setRetry] = useState(0);

  const unauthorized = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    Promise.all([
      getMidtransSettings(token, controller.signal),
      getR2Settings(token, controller.signal),
    ])
      .then(([midtransValue, r2Value]) => {
        if (controller.signal.aborted) return;
        setMidtrans(midtransValue);
        setR2(r2Value);
        setMidtransForm({
          ...emptyMidtrans,
          merchant_id: midtransValue.merchant_id ?? "",
          production: midtransValue.environment === "production",
          qris_enabled: midtransValue.qris_enabled,
        });
        setR2Form({
          ...emptyR2,
          bucket: r2Value.bucket ?? "",
          endpoint: r2Value.endpoint ?? "",
          region: r2Value.region,
          use_path_style_endpoint: r2Value.use_path_style_endpoint,
          enabled: r2Value.enabled,
        });
        setState("success");
        setError("");
      })
      .catch((caught: unknown) => {
        if (controller.signal.aborted) return;
        if (caught instanceof ApiError && caught.status === 401)
          return void unauthorized();
        if (caught instanceof ApiError && caught.status === 403)
          return navigate("/admin/forbidden", {
            replace: true,
            state: { from: "/admin/payment-key" },
          });
        setError(message(caught));
        setState("error");
      });
    return () => controller.abort();
  }, [navigate, retry, token, unauthorized]);

  async function saveMidtrans(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (!token || pending) return;
    if (!midtransForm.merchant_id.trim()) {
      toast.error("Merchant ID wajib diisi.");
      return;
    }
    if (
      midtrans?.source === "environment" &&
      (midtransForm.client_key.length < 8 || midtransForm.server_key.length < 8)
    ) {
      toast.error(
        "Client Key dan Server Key wajib diisi saat membuat override database.",
      );
      return;
    }
    setPending("midtrans-save");
    try {
      const saved = await updateMidtransSettings(token, {
        merchant_id: midtransForm.merchant_id.trim(),
        ...(midtransForm.client_key
          ? { client_key: midtransForm.client_key }
          : {}),
        ...(midtransForm.server_key
          ? { server_key: midtransForm.server_key }
          : {}),
        production: midtransForm.production,
        qris_enabled: midtransForm.qris_enabled,
        timeout: Number(midtransForm.timeout),
      });
      setMidtrans(saved);
      setMidtransForm((current) => ({
        ...current,
        client_key: "",
        server_key: "",
      }));
      toast.success("Konfigurasi Midtrans berhasil disimpan.");
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401)
        return void unauthorized();
      toast.error(message(caught));
    } finally {
      setPending(null);
    }
  }

  async function saveR2(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || pending) return;
    if (!r2Form.bucket.trim() || !r2Form.endpoint.trim()) {
      toast.error("Bucket dan endpoint wajib diisi.");
      return;
    }
    if (
      r2?.source === "environment" &&
      (r2Form.access_key_id.length < 8 || r2Form.secret_access_key.length < 8)
    ) {
      toast.error(
        "Access Key dan Secret Access Key wajib diisi saat membuat override database.",
      );
      return;
    }
    setPending("r2-save");
    try {
      const saved = await updateR2Settings(token, {
        ...(r2Form.access_key_id
          ? { access_key_id: r2Form.access_key_id }
          : {}),
        ...(r2Form.secret_access_key
          ? { secret_access_key: r2Form.secret_access_key }
          : {}),
        bucket: r2Form.bucket.trim(),
        endpoint: r2Form.endpoint.trim(),
        region: r2Form.region.trim() || "auto",
        use_path_style_endpoint: r2Form.use_path_style_endpoint,
        enabled: r2Form.enabled,
      });
      setR2(saved);
      setR2Form((current) => ({
        ...current,
        access_key_id: "",
        secret_access_key: "",
      }));
      toast.success("Konfigurasi Cloudflare R2 berhasil disimpan.");
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401)
        return void unauthorized();
      toast.error(message(caught));
    } finally {
      setPending(null);
    }
  }

  async function test(provider: "midtrans" | "r2"): Promise<void> {
    if (!token || pending) return;
    setPending(provider === "midtrans" ? "midtrans-test" : "r2-test");
    try {
      if (provider === "midtrans") await testMidtransSettings(token);
      else await testR2Settings(token);
      toast.success(
        `Koneksi ${provider === "midtrans" ? "Midtrans" : "Cloudflare R2"} berhasil.`,
      );
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401)
        return void unauthorized();
      toast.error(message(caught));
    } finally {
      setPending(null);
    }
  }

  async function reset(): Promise<void> {
    if (!token || !confirmation || pending) return;
    const provider = confirmation;
    setPending("reset");
    try {
      if (provider === "midtrans") {
        const saved = await clearMidtransSettings(token);
        setMidtrans(saved);
        setMidtransForm({
          ...emptyMidtrans,
          merchant_id: saved.merchant_id ?? "",
          production: saved.environment === "production",
          qris_enabled: saved.qris_enabled,
        });
      } else {
        const saved = await clearR2Settings(token);
        setR2(saved);
        setR2Form({
          ...emptyR2,
          bucket: saved.bucket ?? "",
          endpoint: saved.endpoint ?? "",
          region: saved.region,
          use_path_style_endpoint: saved.use_path_style_endpoint,
          enabled: saved.enabled,
        });
      }
      toast.success(
        `Konfigurasi ${provider === "midtrans" ? "Midtrans" : "R2"} kembali menggunakan .env.`,
      );
      setConfirmation(null);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401)
        return void unauthorized();
      toast.error(message(caught));
    } finally {
      setPending(null);
    }
  }

  if (state === "loading")
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-20" />
        <Skeleton className="h-136" />
      </div>
    );
  if (state === "error")
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="grid min-h-64 place-items-center p-6 text-center">
            <div>
              <p className="font-medium">Konfigurasi platform gagal dimuat</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => {
                  setState("loading");
                  setRetry((value) => value + 1);
                }}
              >
                <RefreshCw /> Coba lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <KeyRound className="size-6" /> Platform Credentials
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola integrasi pembayaran dan penyimpanan media.
        </p>
      </header>
      <Tabs defaultValue="midtrans">
        <TabsList>
          <TabsTrigger value="midtrans">Midtrans</TabsTrigger>
          <TabsTrigger value="r2">Cloudflare R2</TabsTrigger>
        </TabsList>
        <TabsContent value="midtrans" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Midtrans QRIS</CardTitle>
                  <CardDescription>
                    Secret tersimpan terenkripsi dan tidak pernah dikirim
                    kembali oleh backend.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={
                      midtrans?.source === "database" ? "default" : "secondary"
                    }
                  >
                    {midtrans?.source === "database" ? "Database" : ".env"}
                  </Badge>
                  <Badge variant="outline">
                    {midtransForm.production ? "Production" : "Sandbox"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-5"
                onSubmit={(event) => void saveMidtrans(event)}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <PaymentKeyCredentialField
                    id="merchant-id"
                    label="Merchant ID"
                    value={midtransForm.merchant_id}
                    placeholder="G812345678"
                    onChange={(value) =>
                      setMidtransForm((current) => ({
                        ...current,
                        merchant_id: value,
                      }))
                    }
                  />
                  <PaymentKeyCredentialField
                    id="client-key"
                    label="Client Key baru"
                    value={midtransForm.client_key}
                    placeholder={
                      midtrans?.client_key_masked ?? "Masukkan Client Key"
                    }
                    secret
                    description={
                      midtrans?.client_key_configured
                        ? "Kosongkan untuk mempertahankan key tersimpan."
                        : "Belum dikonfigurasi."
                    }
                    onChange={(value) =>
                      setMidtransForm((current) => ({
                        ...current,
                        client_key: value,
                      }))
                    }
                  />
                  <PaymentKeyCredentialField
                    id="server-key"
                    label="Server Key baru"
                    value={midtransForm.server_key}
                    placeholder={
                      midtrans?.server_key_masked ?? "Masukkan Server Key"
                    }
                    secret
                    description={
                      midtrans?.server_key_configured
                        ? "Kosongkan untuk mempertahankan key tersimpan."
                        : "Belum dikonfigurasi."
                    }
                    onChange={(value) =>
                      setMidtransForm((current) => ({
                        ...current,
                        server_key: value,
                      }))
                    }
                  />
                  <div className="space-y-2">
                    <Label htmlFor="midtrans-timeout">Timeout (detik)</Label>
                    <Input
                      id="midtrans-timeout"
                      type="number"
                      min={3}
                      max={60}
                      value={midtransForm.timeout}
                      onChange={(event) =>
                        setMidtransForm((current) => ({
                          ...current,
                          timeout: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Toggle
                    id="midtrans-production"
                    label="Production"
                    description="Gunakan endpoint Midtrans production."
                    checked={midtransForm.production}
                    onChange={(checked) =>
                      setMidtransForm((current) => ({
                        ...current,
                        production: checked,
                      }))
                    }
                  />
                  <Toggle
                    id="midtrans-qris"
                    label="QRIS aktif"
                    description="Izinkan pembayaran QRIS pada kiosk."
                    checked={midtransForm.qris_enabled}
                    onChange={(checked) =>
                      setMidtransForm((current) => ({
                        ...current,
                        qris_enabled: checked,
                      }))
                    }
                  />
                </div>
                <div className="rounded-md border p-3 text-sm">
                  <p className="text-muted-foreground">Notification URL</p>
                  <p className="mt-1 break-all font-mono text-xs">
                    {midtrans?.notification_url}
                  </p>
                </div>
                <Actions
                  pending={pending}
                  testPending="midtrans-test"
                  savePending="midtrans-save"
                  onReset={() => setConfirmation("midtrans")}
                  onTest={() => void test("midtrans")}
                />
                <p className="text-xs text-muted-foreground">
                  Terakhir diperbarui: {updatedAt(midtrans?.updated_at ?? null)}
                </p>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="r2" className="pt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="size-5" /> Cloudflare R2
                  </CardTitle>
                  <CardDescription>
                    Media baru menggunakan R2 saat integrasi diaktifkan.
                  </CardDescription>
                </div>
                <Badge
                  variant={r2?.source === "database" ? "default" : "secondary"}
                >
                  {r2?.source === "database" ? "Database" : ".env"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-5"
                onSubmit={(event) => void saveR2(event)}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <PaymentKeyCredentialField
                    id="r2-access-key"
                    label="Access Key ID baru"
                    value={r2Form.access_key_id}
                    placeholder={
                      r2?.access_key_id_masked ?? "Masukkan Access Key ID"
                    }
                    secret
                    description={
                      r2?.access_key_id_configured
                        ? "Kosongkan untuk mempertahankan key tersimpan."
                        : "Belum dikonfigurasi."
                    }
                    onChange={(value) =>
                      setR2Form((current) => ({
                        ...current,
                        access_key_id: value,
                      }))
                    }
                  />
                  <PaymentKeyCredentialField
                    id="r2-secret-key"
                    label="Secret Access Key baru"
                    value={r2Form.secret_access_key}
                    placeholder="Masukkan Secret Access Key"
                    secret
                    description={
                      r2?.secret_access_key_configured
                        ? "Kosongkan untuk mempertahankan secret tersimpan."
                        : "Belum dikonfigurasi."
                    }
                    onChange={(value) =>
                      setR2Form((current) => ({
                        ...current,
                        secret_access_key: value,
                      }))
                    }
                  />
                  <PaymentKeyCredentialField
                    id="r2-bucket"
                    label="Bucket"
                    value={r2Form.bucket}
                    placeholder="photobooth-media"
                    onChange={(value) =>
                      setR2Form((current) => ({ ...current, bucket: value }))
                    }
                  />
                  <PaymentKeyCredentialField
                    id="r2-endpoint"
                    label="Endpoint"
                    value={r2Form.endpoint}
                    placeholder="https://ACCOUNT_ID.r2.cloudflarestorage.com"
                    onChange={(value) =>
                      setR2Form((current) => ({ ...current, endpoint: value }))
                    }
                  />
                  <PaymentKeyCredentialField
                    id="r2-region"
                    label="Region"
                    value={r2Form.region}
                    placeholder="auto"
                    onChange={(value) =>
                      setR2Form((current) => ({ ...current, region: value }))
                    }
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Toggle
                    id="r2-enabled"
                    label="R2 aktif"
                    description="Arahkan upload media baru ke R2."
                    checked={r2Form.enabled}
                    onChange={(checked) =>
                      setR2Form((current) => ({ ...current, enabled: checked }))
                    }
                  />
                  <Toggle
                    id="r2-path-style"
                    label="Path-style endpoint"
                    description="Gunakan format endpoint S3 path-style."
                    checked={r2Form.use_path_style_endpoint}
                    onChange={(checked) =>
                      setR2Form((current) => ({
                        ...current,
                        use_path_style_endpoint: checked,
                      }))
                    }
                  />
                </div>
                <Actions
                  pending={pending}
                  testPending="r2-test"
                  savePending="r2-save"
                  onReset={() => setConfirmation("r2")}
                  onTest={() => void test("r2")}
                />
                <p className="text-xs text-muted-foreground">
                  Terakhir diperbarui: {updatedAt(r2?.updated_at ?? null)}
                </p>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => !open && !pending && setConfirmation(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Gunakan kembali konfigurasi .env?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Override database untuk{" "}
              {confirmation === "midtrans" ? "Midtrans" : "Cloudflare R2"} akan
              dihapus. Nilai dari file environment backend akan digunakan
              kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending === "reset"}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending === "reset"}
              onClick={() => void reset()}
            >
              {pending === "reset" && <LoaderCircle className="animate-spin" />}
              Reset ke .env
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster position="top-right" />
    </div>
  );
}

function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
}): ReactElement {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border p-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Actions({
  pending,
  testPending,
  savePending,
  onReset,
  onTest,
}: {
  readonly pending: string | null;
  readonly testPending: string;
  readonly savePending: string;
  readonly onReset: () => void;
  readonly onTest: () => void;
}): ReactElement {
  return (
    <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-between">
      <Button
        type="button"
        variant="destructive"
        disabled={pending !== null}
        onClick={onReset}
      >
        <RotateCcw /> Reset ke .env
      </Button>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          disabled={pending !== null}
          onClick={onTest}
        >
          {pending === testPending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <PlugZap />
          )}{" "}
          Test Connection
        </Button>
        <Button type="submit" disabled={pending !== null}>
          {pending === savePending ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Save />
          )}{" "}
          Simpan
        </Button>
      </div>
    </div>
  );
}
