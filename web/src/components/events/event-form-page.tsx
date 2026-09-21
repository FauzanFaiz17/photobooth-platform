import {
  ArrowLeft,
  CalendarX,
  CircleAlert,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { type ReactElement } from "react";
import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  EventInfoSection,
  ConfigurationSection,
  PricingSection,
  PrintOptionsSection,
} from "./components/event-form-sections";
import { useEventForm } from "./hooks/use-event-form";
import SectionHeader from "../shared/section-header";

export function EventFormPage(): ReactElement {
  const { eventId: eventIdParam } = useParams<{ eventId: string }>();
  const {
    event,
    booths,
    loadState,
    loadError,
    form,
    errors,
    printOptionErrors,
    formError,
    pending,
    configurationState,
    options,
    configurationMissing,
    invalidEventId,
    updateField,
    changeBooth,
    addPrintOption,
    updatePrintOption,
    removePrintOption,
    handleSubmit,
    setRetryKey,
    setOptionsRetryKey,
    navigate,
  } = useEventForm(eventIdParam);

  if (loadState === "loading")
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8" aria-busy>
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );

  if (invalidEventId || loadState === "not-found")
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="grid min-h-72 place-items-center text-center">
            <div>
              <CalendarX className="mx-auto size-10 text-muted-foreground" />
              <h1 className="mt-4 text-xl font-semibold">
                Event tidak ditemukan
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Event sudah dihapus atau tidak tersedia untuk akun Anda.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                render={<Link to="/admin/events" />}
              >
                <ArrowLeft aria-hidden="true" /> Daftar Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  if (loadState === "error")
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="grid min-h-72 place-items-center text-center">
            <div>
              <CircleAlert className="mx-auto size-10 text-destructive" />
              <h1 className="mt-4 text-xl font-semibold">
                Form Event gagal dimuat
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => setRetryKey((value) => value + 1)}
              >
                <RefreshCw aria-hidden="true" /> Coba lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="space-y-5">
        <Button
          variant="ghost"
          className="-ml-2"
          render={<Link to="/admin/events" />}
        >
          <ArrowLeft aria-hidden="true" /> Daftar Event
        </Button>
        
        <SectionHeader
          heading={event ? "Edit Event" : "Tambah Event"}
          description={
            event
              ? "Ubah jadwal dan Frame Photo event. Filter, Camera, dan Printer tidak dapat diubah setelah event dibuat."
              : "Pilih Booth, Frame, dan konfigurasi yang akan disalin menjadi snapshot Event."
          }
        />
      </div>

      <form
        className="grid max-w-6xl gap-4"
        onSubmit={(submitEvent) => void handleSubmit(submitEvent)}
        noValidate
      >
        <EventInfoSection
          event={event}
          form={form}
          errors={errors}
          booths={booths}
          onUpdateField={updateField}
          onChangeBooth={changeBooth}
        />

        {configurationState === "loading" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Memuat
            konfigurasi Partner...
          </p>
        )}

        {configurationState === "success" && (
          <ConfigurationSection
            event={event}
            form={form}
            errors={errors}
            options={options}
            onSetOptionsRetryKey={setOptionsRetryKey}
            onUpdateField={updateField}
          />
        )}

        {configurationMissing && (
          <p className="text-sm text-destructive">
            Event belum dapat dibuat karena salah satu konfigurasi
            aktif/published belum tersedia.
          </p>
        )}

        <PricingSection
          event={event}
          form={form}
          errors={errors}
          options={options}
          onUpdateField={updateField}
        />

        <PrintOptionsSection
          form={form}
          printOptionErrors={printOptionErrors}
          onAddPrintOption={addPrintOption}
          onUpdatePrintOption={updatePrintOption}
          onRemovePrintOption={removePrintOption}
        />

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              navigate(event ? `/admin/events/${event.id}` : "/admin/events")
            }
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={
              pending ||
              (!event &&
                (configurationState !== "success" || configurationMissing))
            }
          >
            {pending && (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            )}
            {event ? "Simpan perubahan" : "Tambah Event"}
          </Button>
        </div>
      </form>

      <Toaster position="top-right" />
    </div>
  );
}
