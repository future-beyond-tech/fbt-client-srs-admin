import { z } from "zod";

const requiredString = (name: string) =>
  z.string().trim().min(1, `${name} is required`);

/** ISO 8601 datetime (e.g. 2026-02-20T10:30:00Z or 2026-02-20T10:30:00.000Z) */
const iso8601DateTime = z
  .string()
  .trim()
  .min(1, "Purchase date is required")
  .refine(
    (val) => {
      const date = new Date(val);
      return !Number.isNaN(date.getTime());
    },
    { message: "Purchase date must be a valid ISO 8601 datetime" },
  )
  .refine(
    (val) => {
      const date = new Date(val);
      return date.getTime() <= Date.now() + 86400000; // allow up to 1 day in future for timezone edge cases
    },
    { message: "Purchase date cannot be in the future" },
  );

export const purchaseSchema = z
  .object({
    brand: requiredString("Brand"),
    model: requiredString("Model"),
    year: z.coerce
      .number({ invalid_type_error: "Year is required" })
      .int("Year must be a whole number")
      .min(1900, "Year must be 1900 or later"),
    registrationNumber: requiredString("Registration number"),
    chassisNumber: z.string().trim().optional(),
    engineNumber: z.string().trim().optional(),
    colour: z.string().trim().optional(),
    sellingPrice: z.coerce
      .number({ invalid_type_error: "Selling price is required" })
      .min(0, "Selling price cannot be negative"),
    sellerName: requiredString("Seller name"),
    sellerPhone: requiredString("Seller phone"),
    sellerAddress: z.string().trim().optional(),
    buyingCost: z.coerce
      .number({ invalid_type_error: "Buying cost is required" })
      .min(0, "Buying cost cannot be negative"),
    expense: z.coerce
      .number({ invalid_type_error: "Expense is required" })
      .min(0, "Expense cannot be negative"),
    purchaseDate: iso8601DateTime,
    imageUrl: z.string().optional(),
  })
  .refine((data) => data.sellingPrice > data.buyingCost, {
    message: "Selling price must be greater than buying cost",
    path: ["sellingPrice"],
  });

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
