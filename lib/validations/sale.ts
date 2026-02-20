import { z } from "zod";
import { PaymentMode } from "@/lib/types";

const requiredString = (name: string) =>
  z.string().trim().min(1, `${name} is required`);

const numberAmount = z.coerce.number().min(0, "Amount cannot be negative");

/** Optional GUID (UUID) for existing customer */
const optionalCustomerId = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => !val || /^[0-9a-fA-F-]{32,36}$/.test(val),
    { message: "Customer ID must be a valid GUID" },
  );

/** ISO 8601 datetime; not future (per API doc) */
const saleDateIso8601 = z
  .string()
  .trim()
  .min(1, "Sale date is required")
  .refine(
    (val) => !Number.isNaN(new Date(val).getTime()),
    { message: "Sale date must be a valid ISO 8601 datetime" },
  )
  .refine(
    (val) => new Date(val).getTime() <= Date.now() + 86400000,
    { message: "Sale date cannot be in the future" },
  );

export const saleSchema = z
  .object({
    vehicleId: requiredString("Vehicle"),
    vehiclePrice: z.coerce.number().positive("Vehicle price is required"),
    customerId: optionalCustomerId,
    customerPhotoUrl: requiredString("Customer photo"),
    customerName: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    paymentMode: z.nativeEnum(PaymentMode),
    cashAmount: numberAmount,
    upiAmount: numberAmount,
    financeAmount: numberAmount,
    financeCompany: z.string().optional(),
    saleDate: saleDateIso8601,
    rcBookReceived: z.boolean().optional(),
    ownershipTransferAccepted: z.boolean().optional(),
    vehicleAcceptedInAsIsCondition: z.boolean().optional(),
  })
  .superRefine((values, context) => {
    const hasCustomerId = !!values.customerId?.trim();
    if (!hasCustomerId) {
      if (!values.customerName?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerName"],
          message: "Customer name is required when not selecting an existing customer",
        });
      }
      if (!values.phone?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Phone is required when not selecting an existing customer",
        });
      }
    }

    const amountPath: (string | number)[] =
      values.paymentMode === PaymentMode.Cash
        ? ["cashAmount"]
        : values.paymentMode === PaymentMode.UPI
          ? ["upiAmount"]
          : ["financeAmount"];

    if (values.paymentMode === PaymentMode.Cash && values.cashAmount <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cashAmount"],
        message: "Cash amount is required",
      });
    }

    if (values.paymentMode === PaymentMode.UPI && values.upiAmount <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["upiAmount"],
        message: "UPI amount is required",
      });
    }

    if (values.paymentMode === PaymentMode.Finance && values.financeAmount <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["financeAmount"],
        message: "Finance amount is required",
      });
    }

    if (
      values.paymentMode === PaymentMode.Finance &&
      values.financeAmount > 0 &&
      !values.financeCompany?.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["financeCompany"],
        message: "Finance company is required when finance amount is set",
      });
    }

    const totalPayment =
      values.cashAmount + values.upiAmount + values.financeAmount;

    if (Math.abs(totalPayment - values.vehiclePrice) > 0.001) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: amountPath,
        message: "Total payment must equal vehicle selling price",
      });
    }
  });

export type SaleFormValues = z.infer<typeof saleSchema>;
