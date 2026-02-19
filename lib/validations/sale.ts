import { z } from "zod";
import { PaymentMode } from "@/lib/types";

const requiredString = (name: string) =>
  z.string().trim().min(1, `${name} is required`);

const numberAmount = z.coerce.number().min(0, "Amount cannot be negative");

export const saleSchema = z
  .object({
    vehicleId: requiredString("Vehicle"),
    vehiclePrice: z.coerce.number().positive("Vehicle price is required"),
    customerPhotoUrl: requiredString("Customer photo"),
    customerName: requiredString("Customer name"),
    phone: requiredString("Phone"),
    address: z.string().trim().optional(),
    paymentMode: z.nativeEnum(PaymentMode),
    cashAmount: numberAmount,
    upiAmount: numberAmount,
    financeAmount: numberAmount,
    financeCompany: z.string().optional(),
    saleDate: requiredString("Sale date"),
  })
  .superRefine((values, context) => {
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
        message: "Finance company is required",
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
