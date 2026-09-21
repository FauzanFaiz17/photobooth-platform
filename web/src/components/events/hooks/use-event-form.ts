import { getBooths } from "@/features/booths/booth-service";
import type { BoothRecord } from "@/features/booths/booth.types";
import {
  createEvent,
  getEvent,
  getEventConfigurationOptions,
  updateEvent,
} from "@/features/events/event-service";
import type {
  EventConfigurationOptions,
  EventFormErrors,
  EventFormState,
  EventRecord,
  PrintOptionErrors,
  PrintOptionField,
} from "@/features/events/event.types";
import { ApiError } from "@/lib/api-client";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  initialForm,
  mapValidationErrors,
  newPrintOption,
  parseId,
  validate,
  validatePrintOptions,
} from "../utils";
import { useEventHandler } from "./use-event-handler";

export function useEventForm(eventIdParam: string | undefined) {
  const navigate = useNavigate();
  const { token, handleApiError } = useEventHandler();

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
    gif_templates: [],
    filters: [],
    cameras: [],
    printers: [],
  });

  const selectedBooth = booths.find(
    (booth) => String(booth.id) === form.booth_id,
  );

  useEffect(() => {
    if (!token || invalidEventId) return;
    const controller = new AbortController();
    const eventRequest =
      eventId === null
        ? Promise.resolve(null)
        : getEvent(token, eventId, controller.signal);
    const boothsRequest = getBooths(token, { per_page: 100 }, controller.signal);

    void Promise.all([eventRequest, boothsRequest])
      .then(([loadedEvent, boothsResponse]) => {
        if (controller.signal.aborted) return;
        if (boothsResponse) setBooths(boothsResponse.data);
        if (loadedEvent) {
          setEvent(loadedEvent);
          setForm(initialForm(loadedEvent));
        }
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (handleApiError(error)) return;
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
    handleApiError,
    invalidEventId,
    retryKey,
    token,
  ]);

  useEffect(() => {
    if (!token || !selectedBooth) return;
    if (configurationState === "success") return;
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
        if (handleApiError(error)) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- configurationState is intentionally excluded: including it caused the effect to re-run when it sets "loading", aborting the in-flight request.
  }, [
    handleApiError,
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
      gif_template_id: null,
      filter_ids: [],
      camera_profile_id: "",
      printer_profile_id: "",
    }));
    setOptions({ templates: [], gif_templates: [], filters: [], cameras: [], printers: [] });
    setConfigurationState("idle");
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
    const optionErrors = validatePrintOptions(form.print_options);
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
      print_count_limit:
        form.print_count_limit.trim() === ""
          ? 0
          : Number(form.print_count_limit),
      payment_mode: form.payment_mode,
      video_enabled: form.video_enabled,
      gif_enabled: form.gif_enabled,
    };

    try {
      const saved = event
        ? await updateEvent(token, event.id, {
            ...common,
            status: form.status,
            template_ids: form.template_ids.map(Number),
            filter_ids: form.filter_ids.map(Number),
            gif_template_id: form.gif_template_id ? Number(form.gif_template_id) : null,
            print_options: form.print_options.map((option) => ({
              paper_size: option.paper_size,
              unit_quantity: Number(option.unit_quantity),
              quantity_step: Number(option.quantity_step),
              price: Number(option.price),
              discount:
                option.discount.trim() === ""
                  ? null
                  : Number(option.discount),
            })),
          })
        : await createEvent(token, {
            ...common,
            booth_id: Number(form.booth_id),
            template_id: Number(form.template_ids[0]),
            template_ids: form.template_ids.map(Number),
            gif_template_id: form.gif_template_id ? Number(form.gif_template_id) : null,
            filter_id: Number(form.filter_ids[0]),
            filter_ids: form.filter_ids.map(Number),
            print_options: form.print_options.map((option) => ({
              paper_size: option.paper_size,
              unit_quantity: Number(option.unit_quantity),
              quantity_step: Number(option.quantity_step),
              price: Number(option.price),
              discount:
                option.discount.trim() === ""
                  ? null
                  : Number(option.discount),
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
      if (handleApiError(error)) return;
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

  return {
    event,
    booths,
    loadState,
    loadError,
    retryKey,
    optionsRetryKey,
    form,
    errors,
    printOptionErrors,
    formError,
    pending,
    configurationState,
    options,
    selectedBooth,
    configurationMissing,
    editing,
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
  };
}
