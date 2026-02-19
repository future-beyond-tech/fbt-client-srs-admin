import { format, parseISO } from "date-fns";

export function formatCurrencyINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateDDMMYYYY(value: string) {
  return format(parseISO(value), "dd-MM-yyyy");
}

export function formatDateTimeDDMMYYYY(value: string) {
  return format(parseISO(value), "dd-MM-yyyy hh:mm a");
}
