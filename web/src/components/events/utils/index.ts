import type { EventFormErrors, EventFormState, EventRecord, PrintOptionErrors, PrintOptionField, PrintOptionForm } from "@/features/events/event.types";
import type { ApiError } from "@/lib/api-client";

export function parseId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
    new Date(`${value}T00:00:00`),
  );
}

export function formatPrice(value: string | number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

let nextPrintOptionId = 1
export function newPrintOption(): PrintOptionForm {
  return {
    id: nextPrintOptionId++,
    paper_size: "2r",
    unit_quantity: "1",
    quantity_step: "1",
    price: "0",
  };
}

export function initialForm(event: EventRecord | null): EventFormState {
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

export function validate(form: EventFormState, editing: boolean): EventFormErrors {
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



export function mapValidationErrors(error: ApiError): EventFormErrors {
  const errors: EventFormErrors = {};
  const fields = initialForm(null);
  for (const [field, messages] of Object.entries(error.validationErrors)) {
    const [message] = messages;
    if (message && field in fields)
      errors[field as keyof EventFormState] = message;
  }
  return errors;
}

export function validatePrintOptions(
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
