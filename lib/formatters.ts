import { format, isValid, parseISO } from "date-fns";

export function formatCurrencyINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeDate(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  return null;
}

export function formatDateDDMMYYYY(value: unknown) {
  const date = normalizeDate(value);

  if (!date) {
    return "-";
  }

  return format(date, "dd-MM-yyyy");
}

export function formatDateTimeDDMMYYYY(value: unknown) {
  const date = normalizeDate(value);

  if (!date) {
    return "-";
  }

  return format(date, "dd-MM-yyyy hh:mm a");
}
