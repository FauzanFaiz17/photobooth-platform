import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateOnly(
  value: string | null,
  fallback = "—",
): string {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
  }).format(new Date(`${value}T00:00:00`));
}

export function date(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

export function currency(value: string | number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function positiveInteger(
  value: string | null,
  fallback?: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : (fallback ?? 0);
}

export function parseId(value: string | undefined): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function subjectName(value: string | null): string {
  return value?.split("\\").at(-1) ?? "Sistem";
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CHECKERBOARD = {
  backgroundImage:
    "repeating-conic-gradient(rgba(0,0,0,0.06) 0% 25%, transparent 0% 50%)",
  backgroundSize: "16px 16px",
} as const;