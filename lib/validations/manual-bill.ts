import { z } from "zod";

const requiredString = (name: string) =>
  z.string().trim().min(1, `${name} is required`);

const numberAmount = z.coerce.number().min(0, "Amount cannot be negative");

export const PAYMENT_MODE_OPTIONS = ["Cash", "UPI", "Finance"] as const;
export type PaymentModeOption = (typeof PAYMENT_MODE_OPTIONS)[number];

/** Title prefix for customer and seller names (Mr, Miss, Mrs). */
export const NAME_TITLE_OPTIONS = ["Mr", "Miss", "Mrs"] as const;
export type NameTitleOption = (typeof NAME_TITLE_OPTIONS)[number];

/** Normalize to +91 + 10 digits for display/API. */
export function normalizePhoneIndia(value: string): string {
  const digits = value.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `+91${digits}` : value.trim();
}

export const manualBillSchema = z
  .object({
    customerNameTitle: z.enum(NAME_TITLE_OPTIONS).optional().nullable(),
    customerName: requiredString("Customer name"),
    phone: requiredString("Phone").refine(
      (val) => {
        const digits = val.replace(/\D/g, "");
        return (digits.length === 10 && /^\d+$/.test(digits)) ||
          (digits.length === 12 && digits.startsWith("91") && /^\d+$/.test(digits));
      },
      { message: "Phone must be 10 digits or +91 followed by 10 digits." },
    ),
    address: z.string().trim().optional(),
    itemDescription: requiredString("Item/Description"),
    chassisNumber: z.string().trim().optional(),
    engineNumber: z.string().trim().optional(),
    color: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    totalAmount: numberAmount.refine((n) => n > 0, "Total amount must be greater than 0"),
    paymentMode: z.enum(PAYMENT_MODE_OPTIONS, { required_error: "Select payment mode" }),
    financeCompany: z.string().trim().optional(),
    sellerName: z.string().trim().optional(),
    sellerNameTitle: z.enum(NAME_TITLE_OPTIONS).optional().nullable(),
    sellerAddress: z.string().trim().optional(),
    photoUrl: requiredString("Photo"),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode === "Finance" && !(data.financeCompany ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["financeCompany"],
        message: "Finance company / name is required when payment mode is Finance",
      });
    }
  });

export type ManualBillFormValues = z.infer<typeof manualBillSchema>;
