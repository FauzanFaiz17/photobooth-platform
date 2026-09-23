import { useAuth } from "@/features/auth/auth-context";
import { cancelPrintJob, retryPrintJob } from "@/features/print-jobs/print-job-service";
import type { PrintJobRecord } from "@/features/print-jobs/print-job.types";
import { ApiError } from "@/lib/api-client";
import { LoaderCircle, RotateCcw, TriangleAlert } from "lucide-react";
import { useState, type ReactElement } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PrintActionDialog({
  job,
  onClose,
  onDone,
  onUnauthorized,
  onForbidden,
}: {
  readonly job: PrintJobRecord;
  readonly onClose: () => void;
  readonly onDone: (job: PrintJobRecord) => void;
  readonly onUnauthorized: () => void;
  readonly onForbidden: () => void;
}): ReactElement {
  const { token } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const retry = job.status === "failed";
  async function confirm(): Promise<void> {
    if (!token || pending) return;
    setPending(true);
    setError("");
    try {
      const saved = retry
        ? await retryPrintJob(token, job.id)
        : await cancelPrintJob(token, job.id);
      onDone(saved);
      onClose();
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401)
        return onUnauthorized();
      if (caught instanceof ApiError && caught.status === 403)
        return onForbidden();
      setError(
        caught instanceof ApiError
          ? (caught.validationErrors.status?.[0] ?? caught.message)
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <AlertDialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia
            className={retry ? "" : "bg-destructive/10 text-destructive"}
          >
            {retry ? (
              <RotateCcw aria-hidden="true" />
            ) : (
              <TriangleAlert aria-hidden="true" />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle>
            {retry ? "Retry Print Job?" : "Batalkan Print Job?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {retry
              ? `Print Job #${job.id} akan kembali ke antrean.`
              : `Print Job #${job.id} akan dibatalkan dan tidak dicetak.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Kembali</AlertDialogCancel>
          <AlertDialogAction
            variant={retry ? "default" : "destructive"}
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending && (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            )}
            {retry ? "Retry" : "Batalkan job"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}