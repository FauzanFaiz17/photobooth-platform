import { useEffect } from "react";
import type { PhotoSlot } from "@/features/templates/template.types";

interface UseFrameKeyboardOptions {
  mode: "edit" | "preview";
  selectedSlot: PhotoSlot | null;
  copiedSlotRef: React.MutableRefObject<PhotoSlot | null>;
  updateSlot: (slotId: number, updates: Partial<Omit<PhotoSlot, "id">>) => void;
  duplicateSlot: (source: PhotoSlot) => void;
}

export function useFrameKeyboard({
  mode,
  selectedSlot,
  copiedSlotRef,
  updateSlot,
  duplicateSlot,
}: UseFrameKeyboardOptions) {
  useEffect(() => {
    function handleEditorShortcut(event: KeyboardEvent): void {
      if (mode !== "edit") return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      )
        return;

      const nudge = event.shiftKey ? 10 : 1;
      const delta =
        event.key === "ArrowUp"
          ? { x: 0, y: -nudge }
          : event.key === "ArrowDown"
            ? { x: 0, y: nudge }
            : event.key === "ArrowLeft"
              ? { x: -nudge, y: 0 }
              : event.key === "ArrowRight"
                ? { x: nudge, y: 0 }
                : null;
      if (delta) {
        if (!selectedSlot) return;
        event.preventDefault();
        updateSlot(selectedSlot.id, {
          x: selectedSlot.x + delta.x,
          y: selectedSlot.y + delta.y,
        });
        return;
      }

      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "c" && selectedSlot) {
        event.preventDefault();
        copiedSlotRef.current = { ...selectedSlot };
      } else if (key === "v" && copiedSlotRef.current) {
        event.preventDefault();
        duplicateSlot(copiedSlotRef.current);
      }
    }

    window.addEventListener("keydown", handleEditorShortcut);
    return () => window.removeEventListener("keydown", handleEditorShortcut);
  }, [duplicateSlot, mode, selectedSlot, updateSlot, copiedSlotRef]);
}
