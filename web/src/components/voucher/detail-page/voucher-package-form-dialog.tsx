import { LoaderCircle } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/features/auth/auth-context";
import { isSuperAdmin } from "@/features/auth/auth-access";
import { getTemplates } from "@/features/templates/template-service";
import type { TemplateRecord } from "@/features/templates/template.types";
import {
  createVoucherPackage,
  updateVoucherPackage,
} from "@/features/vouchers/voucher-service";
import type {
  VoucherPackageInput,
  VoucherPackageRecord,
} from "@/features/vouchers/voucher.types";
import { ApiError } from "@/lib/api-client";

interface FormState {
  name: string;
  price: string;
  persons: string;
  captures: string;
  print_count: string;
  session_count: string;
  validity_days: string;
  template_id: string;
  gif_included: boolean;
  video_included: boolean;
  is_active: boolean;
  is_global: boolean;
}
function initialForm(item: VoucherPackageRecord | null): FormState {
  return {
    name: item?.name ?? "",
    price: String(item?.price ?? 0),
    persons: String(item?.persons ?? 1),
    captures: String(item?.captures ?? 1),
    print_count: String(item?.print_count ?? 0),
    session_count: String(item?.session_count ?? 1),
    validity_days: String(item?.validity_days ?? 30),
    template_id: item?.template_id ? String(item.template_id) : "none",
    gif_included: item?.gif_included ?? false,
    video_included: item?.video_included ?? false,
    is_active: item?.is_active ?? true,
    is_global: item?.partner_id === null && item !== null,
  };
}

export function VoucherPackageFormDialog({
  partnerId,
  item,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
  onForbidden,
}: {
  readonly partnerId: number;
  readonly item: VoucherPackageRecord | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSaved: (item: VoucherPackageRecord) => void;
  readonly onUnauthorized: () => void;
  readonly onForbidden: () => void;
}): ReactElement {
  const { token, user } = useAuth();
  const [form, setForm] = useState(() => initialForm(item));
  const [templates, setTemplates] = useState<ReadonlyArray<TemplateRecord>>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const superAdmin = isSuperAdmin(user);
  // ponytail: VoucherPackageResource belum mengembalikan session_count, jadi saat edit nilainya tidak terbaca.
  // Field dikunci dan tidak ikut dikirim supaya jumlah sesi tersimpan tidak tertimpa nilai default 1.
  const sessionCountUnknown = item !== null && item.session_count === undefined;
  useEffect(() => {
    if (!open || !token) return;
    const requests = superAdmin
      ? [
          getTemplates(token, { partner_id: partnerId, per_page: 100 }),
          getTemplates(token, { scope: "global", per_page: 100 }),
        ]
      : [getTemplates(token, { per_page: 100 })];
    void Promise.all(requests)
      .then((responses) =>
        setTemplates(
          Array.from(
            new Map(
              responses
                .flatMap((response) => response.data)
                .map((template) => [template.id, template]),
            ).values(),
          ),
        ),
      )
      .catch(() => setTemplates([]));
  }, [open, partnerId, superAdmin, token]);
  function update(field: keyof FormState, value: string | boolean): void {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || pending) return;
    setPending(true);
    setError("");
    const input: VoucherPackageInput = {
      partner_id: form.is_global ? null : partnerId,
      name: form.name.trim(),
      price: Number(form.price),
      persons: Number(form.persons),
      captures: Number(form.captures),
      print_count: Number(form.print_count),
      gif_included: form.gif_included,
      video_included: form.video_included,
      template_id:
        form.template_id === "none" ? null : Number(form.template_id),
      validity_days: Number(form.validity_days),
      is_active: form.is_active,
    };
    if (!sessionCountUnknown) input.session_count = Number(form.session_count);
    try {
      const saved = item
        ? await updateVoucherPackage(token, item.id, input)
        : await createVoucherPackage(token, input);
      onSaved(saved);
      onOpenChange(false);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401)
        return onUnauthorized();
      if (caught instanceof ApiError && caught.status === 403)
        return onForbidden();
      setError(
        caught instanceof ApiError
          ? (Object.values(caught.validationErrors).flat()[0] ?? caught.message)
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit Voucher Package" : "Tambah Voucher Package"}
          </DialogTitle>
          <DialogDescription>
            Package menentukan harga dan fasilitas voucher.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => void submit(event)}
        >
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="package-name">Nama Package</Label>
            <Input
              id="package-name"
              required
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="package-price">Harga (IDR)</Label>
            <Input
              id="package-price"
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="package-persons">Jumlah Orang</Label>
            <Input
              id="package-persons"
              required
              type="number"
              min={1}
              max={100}
              value={form.persons}
              onChange={(event) => update("persons", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="package-captures">Jumlah Capture</Label>
            <Input
              id="package-captures"
              required
              type="number"
              min={1}
              max={100}
              value={form.captures}
              onChange={(event) => update("captures", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="package-print-count">Jumlah Cetak</Label>
            <Input
              id="package-print-count"
              required
              type="number"
              min={0}
              max={100}
              value={form.print_count}
              onChange={(event) => update("print_count", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="package-session-count">Jumlah Sesi</Label>
            <Input
              id="package-session-count"
              required
              type="number"
              min={1}
              max={1000}
              disabled={sessionCountUnknown}
              value={form.session_count}
              aria-describedby={
                sessionCountUnknown ? "package-session-count-hint" : undefined
              }
              onChange={(event) => update("session_count", event.target.value)}
            />
            <p
              id="package-session-count-hint"
              className="text-xs text-muted-foreground"
            >
              {sessionCountUnknown
                ? "API belum mengembalikan jumlah sesi; nilai tersimpan dipertahankan."
                : "Berapa kali satu voucher dapat ditukar."}
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="package-validity">Masa Berlaku (hari)</Label>
            <Input
              id="package-validity"
              required
              type="number"
              min={1}
              max={3650}
              value={form.validity_days}
              onChange={(event) => update("validity_days", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="package-template">Frame</Label>
            <Select
              value={form.template_id}
              onValueChange={(value) => value && update("template_id", value)}
            >
              <SelectTrigger id="package-template">
                <SelectValue placeholder="Tanpa Frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa Frame</SelectItem>
                {templates
                  .filter((template) =>
                    form.is_global
                      ? template.is_global
                      : template.is_global ||
                        template.partner?.id === partnerId,
                  )
                  .map((template) => (
                    <SelectItem key={template.id} value={String(template.id)}>
                      {template.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
            GIF termasuk
            <Switch
              checked={form.gif_included}
              onCheckedChange={(value) => update("gif_included", value)}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
            Video termasuk
            <Switch
              checked={form.video_included}
              onCheckedChange={(value) => update("video_included", value)}
            />
          </label>
          {superAdmin && (
            <label className="flex items-center justify-between rounded-lg border p-3 text-sm sm:col-span-2">
              Package Global
              <Switch
                checked={form.is_global}
                onCheckedChange={(value) => {
                  update("is_global", value);
                  update("template_id", "none");
                }}
              />
            </label>
          )}
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm sm:col-span-2">
            Package aktif
            <Switch
              checked={form.is_active}
              onCheckedChange={(value) => update("is_active", value)}
            />
          </label>
          {error && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {error}
            </p>
          )}
          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              )}
              {item ? "Simpan" : "Tambah Package"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
