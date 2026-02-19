import { z } from "zod";

const requiredString = (name: string) =>
  z.string().trim().min(1, `${name} is required`);

export const purchaseSchema = z
  .object({
    brand: requiredString("Brand"),
    model: requiredString("Model"),
    year: z.coerce
      .number({ invalid_type_error: "Year is required" })
      .int("Year must be a whole number")
      .gt(1990, "Year must be greater than 1990"),
    registrationNumber: requiredString("Registration number"),
    chassisNumber: requiredString("Chassis number"),
    engineNumber: requiredString("Engine number"),
    sellingPrice: z.coerce
      .number({ invalid_type_error: "Selling price is required" })
      .positive("Selling price must be greater than zero"),
    sellerName: requiredString("Seller name"),
    sellerPhone: requiredString("Seller phone"),
    sellerAddress: requiredString("Seller address"),
    buyingCost: z.coerce
      .number({ invalid_type_error: "Buying cost is required" })
      .positive("Buying cost must be greater than zero"),
    expense: z.coerce
      .number({ invalid_type_error: "Expense is required" })
      .min(0, "Expense cannot be negative"),
    purchaseDate: requiredString("Purchase date"),
    imageUrl: z.string().optional(),
  })
  .refine((data) => data.sellingPrice > data.buyingCost, {
    message: "Selling price must be greater than buying cost",
    path: ["sellingPrice"],
  });

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
