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
import { useAuth } from "@/features/auth/auth-context";
import type { PartnerRecord } from "@/features/partners/partner.types";
import {
  createPartnerSubscription,
  renewPartnerSubscription,
} from "@/features/subscriptions/subscription-service";
import type {
  PartnerSubscriptionRecord,
  SubscriptionPlanRecord,
} from "@/features/subscriptions/subscription.types";
import { ApiError } from "@/lib/api-client";

export function PartnerSubscriptionDialog({
  item,
  partners,
  plans,
  open,
  onOpenChange,
  onSaved,
  onUnauthorized,
  onForbidden,
}: {
  readonly item: PartnerSubscriptionRecord | null;
  readonly partners: ReadonlyArray<PartnerRecord>;
  readonly plans: ReadonlyArray<SubscriptionPlanRecord>;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSaved: (item: PartnerSubscriptionRecord) => void;
  readonly onUnauthorized: () => void;
  readonly onForbidden: () => void;
}): ReactElement {
  const { token } = useAuth();
  const renewing = item !== null;
  const [partnerId, setPartnerId] = useState(
    item?.partner ? String(item.partner.id) : "",
  );
  const [planId, setPlanId] = useState(item ? String(item.plan.id) : "");
  const [status, setStatus] = useState<"pending" | "active">("pending");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [periods, setPeriods] = useState("1");
  const [autoRenew, setAutoRenew] = useState(item?.auto_renew ?? true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || pending || !planId || (!renewing && !partnerId)) return;
    setPending(true);
    setError("");
    try {
      const saved = item
        ? await renewPartnerSubscription(token, item.id, {
            subscription_plan_id:
              item.status === "expired" ? Number(planId) : undefined,
            periods: Number(periods),
            auto_renew: autoRenew,
          })
        : await createPartnerSubscription(token, {
            partner_id: Number(partnerId),
            subscription_plan_id: Number(planId),
            status,
            starts_at: startsAt ? new Date(startsAt).toISOString() : undefined,
            ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
            auto_renew: autoRenew,
          });
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
  const activePlans = plans.filter((plan) => plan.is_active);
  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {renewing ? "Renew Subscription" : "Assign Subscription"}
          </DialogTitle>
          <DialogDescription>
            {renewing
              ? `Perpanjang subscription ${item.partner?.company_name ?? "Partner tidak tersedia"}.`
              : "Tetapkan plan untuk Partner."}
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
          {!renewing && (
            <div className="grid gap-2">
              <Label htmlFor="subscription-partner">Partner</Label>
              <Select
                value={partnerId}
                onValueChange={(value) => value && setPartnerId(value)}
              >
                <SelectTrigger id="subscription-partner">
                  <SelectValue placeholder="Pilih Partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={String(partner.id)}>
                      {partner.brand_name || partner.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="subscription-plan">Plan</Label>
            <Select
              value={planId}
              disabled={renewing && item.status === "active"}
              onValueChange={(value) => value && setPlanId(value)}
            >
              <SelectTrigger id="subscription-plan">
                <SelectValue placeholder="Pilih Plan" />
              </SelectTrigger>
              <SelectContent>
                {activePlans.map((plan) => (
                  <SelectItem key={plan.id} value={String(plan.id)}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {renewing ? (
            <div className="grid gap-2">
              <Label htmlFor="subscription-periods">Jumlah periode</Label>
              <Input
                id="subscription-periods"
                type="number"
                min={1}
                max={36}
                value={periods}
                onChange={(event) => setPeriods(event.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="subscription-status">Status awal</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    value && setStatus(value as "pending" | "active")
                  }
                >
                  <SelectTrigger id="subscription-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subscription-start">
                  Mulai{" "}
                  <span className="text-muted-foreground">(opsional)</span>
                </Label>
                <Input
                  id="subscription-start"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subscription-end">
                  Berakhir{" "}
                  <span className="text-muted-foreground">
                    (otomatis jika kosong)
                  </span>
                </Label>
                <Input
                  id="subscription-end"
                  type="datetime-local"
                  min={startsAt || undefined}
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                />
              </div>
            </>
          )}
          <label className="flex items-center justify-between rounded-lg border p-3 text-sm">
            Auto renew
            <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={pending || !planId || (!renewing && !partnerId)}
            >
              {pending && <LoaderCircle className="animate-spin" />}
              {renewing ? "Renew" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
