import { LoaderCircle } from "lucide-react";
import { useState, type FormEvent, type ReactElement } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import {
  createSubscriptionPlan,
  updateSubscriptionPlan,
} from "@/features/subscriptions/subscription-service";
import type {
  BillingCycle,
  SubscriptionPlanInput,
  SubscriptionPlanRecord,
} from "@/features/subscriptions/subscription.types";
import { ApiError } from "@/lib/api-client";

interface Form {
  name: string;
  price: string;
  billing_cycle: BillingCycle;
  max_booths: string;
  max_devices: string;
  max_operators: string;
  features: string;
  is_active: boolean;
}
function initial(item: SubscriptionPlanRecord | null): Form {
  return {
    name: item?.name ?? "",
    price: String(item?.price ?? 0),
    billing_cycle: item?.billing_cycle ?? "monthly",
    max_booths: String(item?.max_booths ?? 1),
    max_devices: String(item?.max_devices ?? 1),
    max_operators: String(item?.max_operators ?? 1),
    features: item?.features?.join("\n") ?? "",
    is_active: item?.is_active ?? true,
  };
}

export function SubscriptionPlanDialog({
  item,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
  onForbidden,
}: {
  readonly item: SubscriptionPlanRecord | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSaved: (item: SubscriptionPlanRecord) => void;
  readonly onUnauthorized: () => void;
  readonly onForbidden: () => void;
}): ReactElement {
  const { token } = useAuth();
  const [form, setForm] = useState(() => initial(item));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  function update(field: keyof Form, value: string | boolean): void {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || pending) return;
    setPending(true);
    setError("");
    const input: SubscriptionPlanInput = {
      name: form.name.trim(),
      price: Number(form.price),
      billing_cycle: form.billing_cycle,
      max_booths: Number(form.max_booths),
      max_devices: Number(form.max_devices),
      max_operators: Number(form.max_operators),
      features: form.features
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean),
      is_active: form.is_active,
    };
    try {
      const saved = item
        ? await updateSubscriptionPlan(token, item.id, input)
        : await createSubscriptionPlan(token, input);
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
            {item ? "Edit Subscription Plan" : "Tambah Subscription Plan"}
          </DialogTitle>
          <DialogDescription>
            Atur harga dan batas resource Partner.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => void submit(event)}
        >
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="plan-name">Nama Plan</Label>
            <Input
              id="plan-name"
              required
              maxLength={100}
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plan-price">Harga</Label>
            <Input
              id="plan-price"
              required
              type="number"
              min={0}
              value={form.price}
              onChange={(event) => update("price", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plan-cycle">Billing Cycle</Label>
            <Select
              value={form.billing_cycle}
              onValueChange={(value) => value && update("billing_cycle", value)}
            >
              <SelectTrigger id="plan-cycle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="yearly">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {[
            ["max_booths", "Maksimal Booth"],
            ["max_devices", "Maksimal Device"],
            ["max_operators", "Maksimal Operator"],
          ].map(([field, label]) => (
            <div key={field} className="grid gap-2">
              <Label htmlFor={`plan-${field}`}>{label}</Label>
              <Input
                id={`plan-${field}`}
                required
                type="number"
                min={1}
                value={
                  form[field as "max_booths" | "max_devices" | "max_operators"]
                }
                onChange={(event) =>
                  update(field as keyof Form, event.target.value)
                }
              />
            </div>
          ))}
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="plan-features">
              Features{" "}
              <span className="text-muted-foreground">(satu per baris)</span>
            </Label>
            <Textarea
              id="plan-features"
              className="min-h-28"
              value={form.features}
              onChange={(event) => update("features", event.target.value)}
            />
          </div>
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm sm:col-span-2">
            Plan aktif
            <Switch
              checked={form.is_active}
              onCheckedChange={(value) => update("is_active", value)}
            />
          </label>
          {error && (
            <p className="text-sm text-destructive sm:col-span-2">{error}</p>
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
              {pending && <LoaderCircle className="animate-spin" />}Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
