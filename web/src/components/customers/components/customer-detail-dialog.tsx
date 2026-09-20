import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/auth-context";
import { getCustomer } from "@/features/customers/customer-service";
import type { CustomerRecord } from "@/features/customers/customer.types";
import { ApiError } from "@/lib/api-client";
import { useEffect, useState, type ReactElement } from "react";

import { formatDateTime } from "../customer-formatters";

export function CustomerDetailDialog({
  customer,
  partner,
  onClose,
  onUnauthorized,
  onForbidden,
}: {
  readonly customer: CustomerRecord;
  readonly partner: string;
  readonly onClose: () => void;
  readonly onUnauthorized: () => void;
  readonly onForbidden: () => void;
}): ReactElement {
  const { token } = useAuth();
  const [detail, setDetail] = useState<CustomerRecord | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) return;
    getCustomer(token, customer.id)
      .then(setDetail)
      .catch((caught: unknown) => {
        if (caught instanceof ApiError && caught.status === 401)
          return onUnauthorized();
        if (caught instanceof ApiError && caught.status === 403)
          return onForbidden();
        setError(
          caught instanceof ApiError
            ? caught.message
            : "Tidak dapat terhubung ke server.",
        );
      });
  }, [customer.id, onForbidden, onUnauthorized, token]);
  const item = detail ?? customer;
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.name || `Customer #${item.id}`}</DialogTitle>
          <DialogDescription>
            Data Customer bersifat read-only dan berasal dari alur desktop.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Nama</dt>
              <dd className="mt-1 font-medium">{item.name || "Tidak diisi"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Partner</dt>
              <dd className="mt-1 font-medium">{partner}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Telepon</dt>
              <dd className="mt-1 font-medium">
                {item.phone || "Tidak diisi"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="mt-1 break-all font-medium">
                {item.email || "Tidak diisi"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Photo Session</dt>
              <dd className="mt-1 font-medium">{item.photo_sessions_count}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Terdaftar</dt>
              <dd className="mt-1 font-medium">
                {formatDateTime(item.created_at)}
              </dd>
            </div>
          </dl>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
