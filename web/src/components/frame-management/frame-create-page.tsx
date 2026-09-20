import { LoaderCircle } from "lucide-react";
import { type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import { FrameCanvasArea } from "./components/frame-canvas-area";
import { FrameHeader } from "./components/frame-header";
import { FrameImageCard } from "./components/frame-image-card";
import { FrameSettingsCard } from "./components/frame-settings-card";
import { FrameSlotEditorCard } from "./components/frame-slot-editor-card";
import { FrameSlotDetectDialog } from "./frame-slot-detect-dialog";
import { useFrameForm } from "./hooks/use-frame-form";
import { useFrameKeyboard } from "./hooks/use-frame-keyboard";

export function FrameCreatePage(): ReactElement {
  const form = useFrameForm();

  const {
    editing,
    superAdmin,
    copiedSlotRef,
    overlayInputRef,
    canvasAreaRef,
    overlayUrl,
    overlayBroken,
    slotsInFront,
    canvasDark,
    partners,
    partnerId,
    name,
    status,
    size,
    orientation,
    slots,
    selectedSlotId,
    errors,
    formError,
    pending,
    mode,
    loadState,
    detection,
    selectedSlot,
    canvasSize,
    displayWidth,
    displayHeight,
    selectedRatio,
    setOverlayBroken,
    setSlotsInFront,
    setCanvasDark,
    setPartnerId,
    setName,
    setStatus,
    setSelectedSlotId,
    setErrors,
    setMode,
    pickOverlay,
    applyDetected,
    applySlotRatio,
    updateSlot,
    duplicateSlot,
    removeSlot,
    changeSlotNumber,
    changeFrameSize,
    changeOrientation,
    handleSubmit,
  } = form;

  useFrameKeyboard({
    mode,
    selectedSlot,
    copiedSlotRef,
    updateSlot,
    duplicateSlot,
  });

  if (loadState === "loading") {
    return (
      <div className="grid h-screen place-items-center">
        <LoaderCircle
          className="size-8 animate-spin text-muted-foreground"
          aria-label="Memuat Frame"
        />
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="grid h-screen place-items-center p-6 text-center">
        <div>
          <p className="font-medium">Frame tidak dapat dimuat</p>
          <p className="mt-1 text-sm text-muted-foreground">{formError}</p>
          <Button
            className="mt-4"
            type="button"
            variant="outline"
            onClick={() => form.navigate("/frame-photo")}
          >
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex h-screen min-w-0 flex-col overflow-hidden bg-muted/40"
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
    >
      <FrameHeader
        editing={editing}
        name={name}
        size={size}
        canvasSize={canvasSize}
        status={status}
        selectedSlot={selectedSlot}
        slots={slots}
        mode={mode}
        canvasDark={canvasDark}
        superAdmin={superAdmin}
        pending={pending}
        setCanvasDark={setCanvasDark}
        setMode={setMode}
        onNavigateBack={() => form.navigate("/frame-photo")}
      />

      <div
        className={cn(
          "grid min-h-0 flex-1 overflow-hidden max-lg:block max-lg:overflow-y-auto",
          mode === "edit" && "lg:grid-cols-[minmax(0,1fr)_20rem]",
        )}
      >
        <FrameCanvasArea
          mode={mode}
          canvasDark={canvasDark}
          canvasSize={canvasSize}
          displayWidth={displayWidth}
          displayHeight={displayHeight}
          slots={slots}
          selectedSlotId={selectedSlotId}
          overlayUrl={overlayUrl}
          overlayBroken={overlayBroken}
          slotsInFront={slotsInFront}
          canvasAreaRef={canvasAreaRef}
          overlayInputRef={overlayInputRef}
          errors={errors}
          setSelectedSlotId={setSelectedSlotId}
          updateSlot={updateSlot}
          setOverlayBroken={setOverlayBroken}
          pickOverlay={pickOverlay}
        />

        {mode === "edit" && (
          <div className="min-h-0 space-y-4 overflow-y-auto bg-background p-4 max-lg:border-t lg:border-l">
            <FrameSettingsCard
              superAdmin={superAdmin}
              partners={partners}
              partnerId={partnerId}
              name={name}
              size={size}
              orientation={orientation}
              status={status}
              errors={errors}
              canvasSize={canvasSize}
              setPartnerId={setPartnerId}
              setName={setName}
              setStatus={setStatus}
              changeFrameSize={changeFrameSize}
              changeOrientation={changeOrientation}
              setErrors={setErrors}
            />

            <FrameSlotEditorCard
              selectedSlot={selectedSlot}
              slots={slots}
              selectedRatio={selectedRatio}
              canvasSize={canvasSize}
              duplicateSlot={duplicateSlot}
              removeSlot={removeSlot}
              applySlotRatio={applySlotRatio}
              changeSlotNumber={changeSlotNumber}
            />

            <FrameImageCard
              overlayUrl={overlayUrl}
              overlayBroken={overlayBroken}
              overlayInputRef={overlayInputRef}
              errors={errors}
              slotsInFront={slotsInFront}
              canvasSize={canvasSize}
              setOverlayBroken={setOverlayBroken}
              setSlotsInFront={setSlotsInFront}
              pickOverlay={pickOverlay}
            />

            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {formError}
              </p>
            )}
          </div>
        )}
      </div>

      {detection && (
        <FrameSlotDetectDialog
          imageUrl={detection.imageUrl}
          canvas={canvasSize}
          slots={detection.slots}
          replacedCount={slots.length}
          onCancel={() => detection}
          onApply={applyDetected}
        />
      )}

      <Toaster position="top-right" />
    </form>
  );
}
