import apiClient from "@/lib/api/client";
import type {
  DeliveryNoteSettings,
  UpdateDeliveryNoteSettingsDto,
} from "@/lib/types";

function normalizeNullable(value: unknown): string | null {
  if (typeof value !== "string") {
    return value == null ? null : String(value);
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeSettings(payload: Record<string, unknown>): DeliveryNoteSettings {
  return {
    shopName: normalizeNullable(payload.shopName),
    shopAddress: normalizeNullable(payload.shopAddress),
    gstNumber: normalizeNullable(payload.gstNumber),
    contactNumber: normalizeNullable(payload.contactNumber),
    footerText: normalizeNullable(payload.footerText),
    termsAndConditions: normalizeNullable(payload.termsAndConditions),
    logoUrl: normalizeNullable(payload.logoUrl),
    signatureLine: normalizeNullable(payload.signatureLine),
  };
}

export async function getDeliveryNoteSettings(): Promise<DeliveryNoteSettings> {
  const { data } = await apiClient.get<Record<string, unknown>>("/settings/delivery-note");
  return normalizeSettings((data ?? {}) as Record<string, unknown>);
}

export async function updateDeliveryNoteSettings(
  payload: UpdateDeliveryNoteSettingsDto,
): Promise<DeliveryNoteSettings> {
  const { data } = await apiClient.put<Record<string, unknown>>(
    "/settings/delivery-note",
    payload,
  );
  return normalizeSettings((data ?? {}) as Record<string, unknown>);
}
