import {
  ArrowLeft,
  CalendarX,
  CircleAlert,
  Frame as FrameIcon,
  ImageOff,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/features/auth/auth-context";
import { getBooths } from "@/features/booths/booth-service";
import type { BoothRecord } from "@/features/booths/booth.types";
import {
  createEvent,
  getEvent,
  getEventConfigurationOptions,
  updateEvent,
} from "@/features/events/event-service";
import type {
  EventConfigurationOption,
  EventConfigurationOptions,
  EventRecord,
  EventStatus,
} from "@/features/events/event.types";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface EventFormState {
  booth_id: string;
  event_name: string;
  template_ids: ReadonlyArray<string>;
  filter_ids: ReadonlyArray<string>;
  camera_profile_id: string;
  printer_profile_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  price: string;
  print_count_limit: string;
  print_options: ReadonlyArray<PrintOptionForm>;
  status: EventStatus;
}

interface PrintOptionForm {
  id: number;
  paper_size: "2r" | "4r";
  unit_quantity: string;
  quantity_step: string;
  price: string;
}

type PrintOptionField = Exclude<keyof PrintOptionForm, "id">;
type PrintOptionErrors = Partial<
  Record<number, Partial<Record<PrintOptionField, string>>>
>;

let nextPrintOptionId = 1;

function newPrintOption(): PrintOptionForm {
  return {
    id: nextPrintOptionId++,
    paper_size: "2r",
    unit_quantity: "1",
    quantity_step: "1",
    price: "0",
  };
}

type EventFormErrors = Partial<Record<keyof EventFormState, string>>;

function initialForm(event: EventRecord | null): EventFormState {
  return {
    booth_id: event ? String(event.booth.id) : "",
    event_name: event?.event_name ?? "",
    template_ids: event
      ? (event.configuration.templates ?? [event.configuration.template]).map(
          (template) => String(template.template_id),
        )
      : [],
    filter_ids: event
      ? (event.configuration.filters ?? [event.configuration.filter]).map(
          (filter) => String(filter.filter_id),
        )
      : [],
    camera_profile_id: event
      ? String(event.configuration.camera.camera_profile_id)
      : "",
    printer_profile_id: event
      ? String(event.configuration.printer.printer_profile_id)
      : "",
    event_date: event?.event_date ?? "",
    start_time: event?.start_time.slice(0, 5) ?? "",
    end_time: event?.end_time.slice(0, 5) ?? "",
    price: event ? String(event.price) : "0",
    print_count_limit: event ? String(event.print_count_limit) : "0",
    print_options: [],
    status: event?.status ?? "draft",
  };
}

function validate(form: EventFormState, editing: boolean): EventFormErrors {
  const errors: EventFormErrors = {};
  const requiredIds: ReadonlyArray<keyof EventFormState> = editing
    ? []
    : ["booth_id", "camera_profile_id", "printer_profile_id"];

  for (const field of requiredIds) {
    if (!Number.isInteger(Number(form[field])) || Number(form[field]) <= 0) {
      errors[field] = "Pilihan ini wajib diisi.";
    }
  }
  if (!editing && form.template_ids.length === 0)
    errors.template_ids = "Pilih minimal satu Frame.";
  if (!editing && form.filter_ids.length === 0)
    errors.filter_ids = "Pilih minimal satu Filter.";
  if (!form.event_name.trim()) errors.event_name = "Nama Event wajib diisi.";
  else if (form.event_name.trim().length > 150)
    errors.event_name = "Maksimal 150 karakter.";
  if (!form.event_date) errors.event_date = "Tanggal Event wajib diisi.";
  if (!form.start_time) errors.start_time = "Jam mulai wajib diisi.";
  if (!form.end_time) errors.end_time = "Jam selesai wajib diisi.";
  else if (form.start_time && form.end_time <= form.start_time)
    errors.end_time = "Jam selesai harus setelah jam mulai.";

  const price = Number(form.price);
  if (form.price.trim() !== "" && (!Number.isFinite(price) || price < 0))
    errors.price = "Harga tidak boleh negatif.";
  const printLimit = Number(form.print_count_limit);
  if (
    form.print_count_limit.trim() !== "" &&
    (!Number.isInteger(printLimit) || printLimit < 0)
  )
    errors.print_count_limit = "Batas cetak harus bilangan bulat minimal 0.";

  return errors;
}

function mapValidationErrors(error: ApiError): EventFormErrors {
  const errors: EventFormErrors = {};
  const fields = initialForm(null);
  for (const [field, messages] of Object.entries(error.validationErrors)) {
    const [message] = messages;
    if (message && field in fields)
      errors[field as keyof EventFormState] = message;
  }
  return errors;
}

function validatePrintOptions(
  options: ReadonlyArray<PrintOptionForm>,
): PrintOptionErrors {
  const errors: PrintOptionErrors = {};

  for (const option of options) {
    const row: Partial<Record<PrintOptionField, string>> = {};
    const quantity = Number(option.unit_quantity);
    const step = Number(option.quantity_step);
    const price = Number(option.price);

    if (!Number.isInteger(quantity) || quantity < 1)
      row.unit_quantity = "Minimal 1.";
    if (!Number.isInteger(step) || step < 1) row.quantity_step = "Minimal 1.";
    if (!Number.isFinite(price) || price < 0) row.price = "Minimal Rp0.";
    if (Object.keys(row).length > 0) errors[option.id] = row;
  }

  return errors;
}

function ConfigurationSelect({
  id,
  label,
  value,
  options,
  error,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly options: ReadonlyArray<EventConfigurationOption>;
  readonly error?: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select<string>
        value={value || null}
        onValueChange={(next) => next !== null && onChange(next)}
      >
        <SelectTrigger id={id} className="w-full" aria-invalid={Boolean(error)}>
          <SelectValue placeholder={`Pilih ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.name}
              {option.is_global ? " (Global)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ConfigurationChecklist({
  label,
  options,
  values,
  error,
  onChange,
}: {
  readonly label: string;
  readonly options: ReadonlyArray<EventConfigurationOption>;
  readonly values: ReadonlyArray<string>;
  readonly error?: string;
  readonly onChange: (values: ReadonlyArray<string>) => void;
}) {
  function toggle(value: string, checked: boolean) {
    onChange(
      checked ? [...values, value] : values.filter((item) => item !== value),
    );
  }

  const allSelected = options.length > 0 && values.length === options.length;
  const partiallySelected = values.length > 0 && !allSelected;

  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div
        className="grid max-h-44 gap-1 overflow-y-auto rounded-md border p-2"
        aria-invalid={Boolean(error)}
      >
        <label className="flex cursor-pointer items-center gap-3 border-b px-2 py-2 text-sm font-medium">
          <Checkbox
            checked={allSelected}
            indeterminate={partiallySelected}
            onCheckedChange={(checked) =>
              onChange(
                checked ? options.map((option) => String(option.id)) : [],
              )
            }
          />
          <span>Pilih semua</span>
        </label>
        {options.map((option) => {
          const value = String(option.id);
          const selectedIndex = values.indexOf(value);
          return (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-muted"
            >
              <Checkbox
                checked={selectedIndex >= 0}
                onCheckedChange={(checked) => toggle(value, checked)}
              />
              <span className="min-w-0 flex-1 truncate">
                {option.name}
                {option.is_global ? " (Global)" : ""}
              </span>
              {selectedIndex === 0 && (
                <span className="text-xs font-medium text-primary">
                  Default
                </span>
              )}
            </label>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Pilihan pertama digunakan sebagai default.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}

/** Kartu pilihan Frame: gambar jadi patokan utama, bukan hanya namanya. */
function FrameOptionCard({
  option,
  selected,
  isDefault,
  onToggle,
  onExpired,
}: {
  readonly option: EventConfigurationOption;
  readonly selected: boolean;
  readonly isDefault: boolean;
  readonly onToggle: () => void;
  readonly onExpired: () => void;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <div
      role="checkbox"
      aria-checked={selected}
      aria-label={`Frame ${option.name}`}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(keyEvent) => {
        if (keyEvent.key === " " || keyEvent.key === "Enter") {
          keyEvent.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-lg border bg-background outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "hover:border-primary/40",
      )}
    >
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={{
          backgroundImage:
            "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%)",
          backgroundSize: "16px 16px",
        }}
      >
        {option.image_url && !broken ? (
          <img
            src={option.image_url}
            alt={`Frame ${option.name}`}
            loading="lazy"
            className="absolute inset-0 size-full object-contain p-3"
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center gap-2 p-3 text-center">
            {broken ? (
              <ImageOff className="size-6 text-muted-foreground" />
            ) : (
              <FrameIcon className="size-8 text-muted-foreground" />
            )}
            {broken && (
              <button
                type="button"
                className="text-xs font-medium text-primary underline"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  onExpired();
                }}
              >
                <RefreshCw className="mr-1 inline size-3" aria-hidden="true" />
                Muat ulang
              </button>
            )}
          </div>
        )}
        <Checkbox
          checked={selected}
          tabIndex={-1}
          aria-hidden="true"
          onCheckedChange={onToggle}
          className="pointer-events-none absolute left-2 top-2 bg-background"
        />
        {isDefault && (
          <Badge className="absolute right-2 top-2" variant="secondary">
            Default
          </Badge>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-2 border-t px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium" title={option.name}>
          {option.name}
        </span>
        {option.is_global && <Badge variant="outline">Global</Badge>}
      </div>
    </div>
  );
}

function FrameChecklist({
  options,
  values,
  error,
  onChange,
  onExpired,
}: {
  readonly options: ReadonlyArray<EventConfigurationOption>;
  readonly values: ReadonlyArray<string>;
  readonly error?: string;
  readonly onChange: (values: ReadonlyArray<string>) => void;
  readonly onExpired: () => void;
}) {
  function toggle(value: string, checked: boolean) {
    onChange(
      checked ? [...values, value] : values.filter((item) => item !== value),
    );
  }

  const allSelected = options.length > 0 && values.length === options.length;
  const partiallySelected = values.length > 0 && !allSelected;

  return (
    <fieldset className="grid gap-3" aria-invalid={Boolean(error)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
          <Checkbox
            checked={allSelected}
            indeterminate={partiallySelected}
            onCheckedChange={(checked) =>
              onChange(
                checked ? options.map((option) => String(option.id)) : [],
              )
            }
          />
          <span>Pilih semua ({options.length} Frame)</span>
        </label>
        <p className="text-xs text-muted-foreground">
          Pilihan pertama menjadi Frame default.
        </p>
      </div>
      <div className="grid max-h-96 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
        {options.map((option) => {
          const value = String(option.id);
          const selected = values.includes(value);
          return (
            <FrameOptionCard
              key={`${option.id}-${option.image_url ?? "none"}`}
              option={option}
              selected={selected}
              isDefault={values[0] === value}
              onToggle={() => toggle(value, !selected)}
              onExpired={onExpired}
            />
          );
        })}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </fieldset>
  );
}

function parseId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function EventFormPage(): ReactElement {
  const { eventId: eventIdParam } = useParams<{ eventId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const editing = eventIdParam !== undefined;
  const eventId = editing ? parseId(eventIdParam) : null;
  const invalidEventId = editing && eventId === null;
  const [event, setEvent] = useState<EventRecord | null>(null);
  const [booths, setBooths] = useState<ReadonlyArray<BoothRecord>>([]);
  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "not-found" | "error"
  >("loading");
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [optionsRetryKey, setOptionsRetryKey] = useState(0);
  const [form, setForm] = useState<EventFormState>(() => initialForm(null));
  const [errors, setErrors] = useState<EventFormErrors>({});
  const [printOptionErrors, setPrintOptionErrors] = useState<PrintOptionErrors>(
    {},
  );
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [configurationState, setConfigurationState] = useState<
    "idle" | "loading" | "success" | "error"
  >(event ? "success" : "idle");
  const [options, setOptions] = useState<EventConfigurationOptions>({
    templates: [],
    filters: [],
    cameras: [],
    printers: [],
  });

  const selectedBooth = booths.find(
    (booth) => String(booth.id) === form.booth_id,
  );

  const handleUnauthorized = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true, state: { from: location } });
  }, [location, logout, navigate]);

  const handleForbidden = useCallback(() => {
    navigate("/admin/forbidden", {
      replace: true,
      state: { from: location.pathname },
    });
  }, [location.pathname, navigate]);

  /** Booth (untuk create) dan Event (untuk edit) dimuat di halaman, bukan diwarisi dari dialog. */
  useEffect(() => {
    if (!token || invalidEventId) return;
    const controller = new AbortController();
    const eventRequest =
      eventId === null
        ? Promise.resolve(null)
        : getEvent(token, eventId, controller.signal);
    const boothsRequest = editing
      ? Promise.resolve(null)
      : getBooths(token, { per_page: 100 }, controller.signal);

    void Promise.all([eventRequest, boothsRequest])
      .then(([loadedEvent, boothsResponse]) => {
        if (controller.signal.aborted) return;
        if (boothsResponse) setBooths(boothsResponse.data);
        if (loadedEvent) {
          setEvent(loadedEvent);
          setForm(initialForm(loadedEvent));
          setConfigurationState("success");
        }
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401)
          return void handleUnauthorized();
        if (error instanceof ApiError && error.status === 403)
          return handleForbidden();
        if (error instanceof ApiError && error.status === 404)
          return setLoadState("not-found");
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "Data Event tidak dapat dimuat.",
        );
        setLoadState("error");
      });

    return () => controller.abort();
  }, [
    editing,
    eventId,
    handleForbidden,
    handleUnauthorized,
    invalidEventId,
    retryKey,
    token,
  ]);

  useEffect(() => {
    if (event || !token || !selectedBooth) return;
    const accessToken = token;
    const partnerId = selectedBooth.partner.id;
    const controller = new AbortController();

    async function loadOptions() {
      setConfigurationState("loading");
      setFormError("");
      try {
        const result = await getEventConfigurationOptions(
          accessToken,
          partnerId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setOptions(result);
        setConfigurationState("success");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401)
          return void handleUnauthorized();
        if (error instanceof ApiError && error.status === 403)
          return handleForbidden();
        setConfigurationState("error");
        setFormError(
          error instanceof ApiError
            ? error.message
            : "Konfigurasi Event gagal dimuat.",
        );
      }
    }

    void loadOptions();

    return () => controller.abort();
  }, [
    event,
    handleForbidden,
    handleUnauthorized,
    optionsRetryKey,
    selectedBooth,
    token,
  ]);

  function updateField<Field extends keyof EventFormState>(
    field: Field,
    value: EventFormState[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function changeBooth(value: string) {
    setForm((current) => ({
      ...current,
      booth_id: value,
      template_ids: [],
      filter_ids: [],
      camera_profile_id: "",
      printer_profile_id: "",
    }));
    setOptions({ templates: [], filters: [], cameras: [], printers: [] });
    setErrors({});
  }

  function addPrintOption() {
    updateField("print_options", [...form.print_options, newPrintOption()]);
  }

  function updatePrintOption(
    id: number,
    field: PrintOptionField,
    value: string,
  ) {
    updateField(
      "print_options",
      form.print_options.map((option) =>
        option.id === id ? { ...option, [field]: value } : option,
      ),
    );
    setPrintOptionErrors((current) => ({
      ...current,
      [id]: { ...current[id], [field]: undefined },
    }));
  }

  function removePrintOption(id: number) {
    updateField(
      "print_options",
      form.print_options.filter((option) => option.id !== id),
    );
    setPrintOptionErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    if (!token || pending) return;

    const validationErrors = validate(form, event !== null);
    const optionErrors = event ? {} : validatePrintOptions(form.print_options);
    if (
      Object.keys(validationErrors).length > 0 ||
      Object.keys(optionErrors).length > 0
    ) {
      setErrors(validationErrors);
      setPrintOptionErrors(optionErrors);
      return;
    }

    setPending(true);
    setErrors({});
    setPrintOptionErrors({});
    setFormError("");

    const common = {
      event_name: form.event_name.trim(),
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time,
      price: form.price.trim() === "" ? 0 : Number(form.price),
      print_count_limit:
        form.print_count_limit.trim() === ""
          ? 0
          : Number(form.print_count_limit),
    };

    try {
      const saved = event
        ? await updateEvent(token, event.id, { ...common, status: form.status })
        : await createEvent(token, {
            ...common,
            booth_id: Number(form.booth_id),
            template_id: Number(form.template_ids[0]),
            template_ids: form.template_ids.map(Number),
            filter_id: Number(form.filter_ids[0]),
            filter_ids: form.filter_ids.map(Number),
            print_options: form.print_options.map((option) => ({
              paper_size: option.paper_size,
              unit_quantity: Number(option.unit_quantity),
              quantity_step: Number(option.quantity_step),
              price: Number(option.price),
            })),
            camera_profile_id: Number(form.camera_profile_id),
            printer_profile_id: Number(form.printer_profile_id),
            status: form.status === "scheduled" ? "scheduled" : "draft",
          });

      toast.success(
        event
          ? `Event ${saved.event_name} diperbarui.`
          : `Event ${saved.event_name} ditambahkan.`,
      );
      if (event) setEvent(saved);
      else navigate(`/admin/events/${saved.id}`, { replace: true });
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401)
        return void handleUnauthorized();
      if (error instanceof ApiError && error.status === 403)
        return handleForbidden();
      if (error instanceof ApiError && error.status === 422) {
        const fieldErrors = mapValidationErrors(error);
        setErrors(fieldErrors);
        const messages = Object.values(error.validationErrors).flat();
        setFormError(
          Object.keys(fieldErrors).length
            ? "Periksa kembali isian yang ditandai."
            : (messages[0] ?? error.message),
        );
        return;
      }
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Tidak dapat terhubung ke server.",
      );
    } finally {
      setPending(false);
    }
  }

  const configurationMissing =
    !event &&
    configurationState === "success" &&
    Object.values(options).some((items) => items.length === 0);

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
      <header className="space-y-5">
        <Button
          variant="ghost"
          className="-ml-2"
          render={<Link to="/admin/events" />}
        >
          <ArrowLeft aria-hidden="true" /> Daftar Event
        </Button>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {event ? "Edit Event" : "Tambah Event"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {event
              ? "Konfigurasi snapshot tidak berubah saat jadwal Event diedit."
              : "Pilih Booth, Frame, dan konfigurasi yang akan disalin menjadi snapshot Event."}
          </p>
        </div>
      </header>

      <form
        className="grid max-w-6xl gap-4"
        onSubmit={(submitEvent) => void handleSubmit(submitEvent)}
        noValidate
      >
          {!event && (
            <div className="grid gap-2">
              <Label htmlFor="event-booth">Booth</Label>
              <Select<string>
                value={form.booth_id || null}
                onValueChange={(value) => value !== null && changeBooth(value)}
              >
                <SelectTrigger
                  id="event-booth"
                  className="w-full"
                  aria-invalid={Boolean(errors.booth_id)}
                >
                  <SelectValue placeholder="Pilih Booth" />
                </SelectTrigger>
                <SelectContent>
                  {booths.map((booth) => (
                    <SelectItem key={booth.id} value={String(booth.id)}>
                      {booth.name} —{" "}
                      {booth.partner.brand_name || booth.partner.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.booth_id && (
                <p className="text-xs text-destructive">{errors.booth_id}</p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="event-name">Nama Event</Label>
            <Input
              id="event-name"
              value={form.event_name}
              maxLength={150}
              aria-invalid={Boolean(errors.event_name)}
              onChange={(inputEvent) =>
                updateField("event_name", inputEvent.target.value)
              }
            />
            {errors.event_name && (
              <p className="text-xs text-destructive">{errors.event_name}</p>
            )}
          </div>

          {!event && selectedBooth && configurationState === "loading" && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Memuat
              konfigurasi Partner...
            </p>
          )}

          {!event && configurationState === "success" && (
            <div className="grid gap-6">
              <FrameChecklist
                options={options.templates}
                values={form.template_ids}
                error={errors.template_ids}
                onChange={(values) => updateField("template_ids", values)}
                onExpired={() => setOptionsRetryKey((value) => value + 1)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <ConfigurationChecklist
                  label="Filter"
                  values={form.filter_ids}
                  options={options.filters}
                  error={errors.filter_ids}
                  onChange={(values) => updateField("filter_ids", values)}
                />
                <ConfigurationSelect
                  id="event-camera"
                  label="Camera Profile"
                  value={form.camera_profile_id}
                  options={options.cameras}
                  error={errors.camera_profile_id}
                  onChange={(value) => updateField("camera_profile_id", value)}
                />
                <ConfigurationSelect
                  id="event-printer"
                  label="Printer Profile"
                  value={form.printer_profile_id}
                  options={options.printers}
                  error={errors.printer_profile_id}
                  onChange={(value) => updateField("printer_profile_id", value)}
                />
              </div>
            </div>
          )}

          {configurationMissing && (
            <p className="text-sm text-destructive">
              Event belum dapat dibuat karena salah satu konfigurasi
              aktif/published belum tersedia.
            </p>
          )}

          {!event && (
            <section className="grid gap-3 border-t pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium">Paket cetak</h3>
                  <p className="text-xs text-muted-foreground">
                    Atur pilihan jumlah dan harga cetak untuk pelanggan.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPrintOption}
                >
                  <Plus aria-hidden="true" /> Tambah paket
                </Button>
              </div>

              {form.print_options.length === 0 && (
                <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                  Belum ada paket cetak.
                </p>
              )}

              {form.print_options.map((option, index) => {
                const rowErrors = printOptionErrors[option.id];
                return (
                  <div
                    key={option.id}
                    className="grid gap-3 rounded-md border p-3 sm:grid-cols-[0.8fr_1fr_1fr_1.25fr_auto] sm:items-start"
                  >
                    <div className="grid gap-2">
                      <Label htmlFor={`print-paper-${option.id}`}>Ukuran</Label>
                      <Select<"2r" | "4r">
                        value={option.paper_size}
                        onValueChange={(value) =>
                          value !== null &&
                          updatePrintOption(option.id, "paper_size", value)
                        }
                      >
                        <SelectTrigger
                          id={`print-paper-${option.id}`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2r">2R</SelectItem>
                          <SelectItem value="4r">4R</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`print-quantity-${option.id}`}>
                        Jumlah dasar
                      </Label>
                      <Input
                        id={`print-quantity-${option.id}`}
                        type="number"
                        min={1}
                        step={1}
                        value={option.unit_quantity}
                        aria-invalid={Boolean(rowErrors?.unit_quantity)}
                        onChange={(inputEvent) =>
                          updatePrintOption(
                            option.id,
                            "unit_quantity",
                            inputEvent.target.value,
                          )
                        }
                      />
                      {rowErrors?.unit_quantity && (
                        <p className="text-xs text-destructive">
                          {rowErrors.unit_quantity}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`print-step-${option.id}`}>
                        Kelipatan
                      </Label>
                      <Input
                        id={`print-step-${option.id}`}
                        type="number"
                        min={1}
                        step={1}
                        value={option.quantity_step}
                        aria-invalid={Boolean(rowErrors?.quantity_step)}
                        onChange={(inputEvent) =>
                          updatePrintOption(
                            option.id,
                            "quantity_step",
                            inputEvent.target.value,
                          )
                        }
                      />
                      {rowErrors?.quantity_step && (
                        <p className="text-xs text-destructive">
                          {rowErrors.quantity_step}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor={`print-price-${option.id}`}>Harga</Label>
                      <Input
                        id={`print-price-${option.id}`}
                        type="number"
                        min={0}
                        step="0.01"
                        value={option.price}
                        aria-invalid={Boolean(rowErrors?.price)}
                        onChange={(inputEvent) =>
                          updatePrintOption(
                            option.id,
                            "price",
                            inputEvent.target.value,
                          )
                        }
                      />
                      {rowErrors?.price && (
                        <p className="text-xs text-destructive">
                          {rowErrors.price}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="sm:mt-6"
                      aria-label={`Hapus paket cetak ${index + 1}`}
                      title="Hapus paket"
                      onClick={() => removePrintOption(option.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="event-date">Tanggal</Label>
              <Input
                id="event-date"
                type="date"
                value={form.event_date}
                aria-invalid={Boolean(errors.event_date)}
                onChange={(inputEvent) =>
                  updateField("event_date", inputEvent.target.value)
                }
              />
              {errors.event_date && (
                <p className="text-xs text-destructive">{errors.event_date}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-start">Jam mulai</Label>
              <Input
                id="event-start"
                type="time"
                value={form.start_time}
                aria-invalid={Boolean(errors.start_time)}
                onChange={(inputEvent) =>
                  updateField("start_time", inputEvent.target.value)
                }
              />
              {errors.start_time && (
                <p className="text-xs text-destructive">{errors.start_time}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-end">Jam selesai</Label>
              <Input
                id="event-end"
                type="time"
                value={form.end_time}
                aria-invalid={Boolean(errors.end_time)}
                onChange={(inputEvent) =>
                  updateField("end_time", inputEvent.target.value)
                }
              />
              {errors.end_time && (
                <p className="text-xs text-destructive">{errors.end_time}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="event-price">Harga</Label>
              <Input
                id="event-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                aria-invalid={Boolean(errors.price)}
                onChange={(inputEvent) =>
                  updateField("price", inputEvent.target.value)
                }
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-print-limit">Batas cetak</Label>
              <Input
                id="event-print-limit"
                type="number"
                min={0}
                step={1}
                value={form.print_count_limit}
                aria-invalid={Boolean(errors.print_count_limit)}
                onChange={(inputEvent) =>
                  updateField("print_count_limit", inputEvent.target.value)
                }
              />
              {errors.print_count_limit && (
                <p className="text-xs text-destructive">
                  {errors.print_count_limit}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-status">Status</Label>
              <Select<EventStatus>
                value={form.status}
                onValueChange={(value) =>
                  value !== null && updateField("status", value)
                }
              >
                <SelectTrigger id="event-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(event
                    ? ([
                        "draft",
                        "scheduled",
                        "ongoing",
                        "completed",
                        "cancelled",
                      ] as const)
                    : (["draft", "scheduled"] as const)
                  ).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
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
