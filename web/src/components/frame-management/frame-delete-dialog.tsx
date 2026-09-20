import { LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";

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
import { useAuth } from "@/features/auth/auth-context";
import { deleteTemplate } from "@/features/templates/template-service";
import type { TemplateRecord } from "@/features/templates/template.types";
import { ApiError } from "@/lib/api-client";

export function FrameDeleteDialog({
  frame,
  open,
  onOpenChange,
  onDeleted,
  onUnauthorized,
  onForbidden,
}: {
  readonly frame: TemplateRecord;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDeleted: (frame: TemplateRecord) => void;
  readonly onUnauthorized: () => void;
  readonly onForbidden: () => void;
}) {
  const { token } = useAuth();
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    if (!token || pending) return;
    setPending(true);
    setErrorMessage("");
    try {
      await deleteTemplate(token, frame.id);
      onDeleted(frame);
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401)
        return onUnauthorized();
      if (error instanceof ApiError && error.status === 403)
        return onForbidden();
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Frame?</AlertDialogTitle>
          <AlertDialogDescription>
            Frame {frame.name} akan dihapus dari Partner ini.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage && (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => void handleDelete()}
          >
            {pending && (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            )}
            Hapus Frame
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
