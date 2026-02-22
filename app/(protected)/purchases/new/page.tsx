// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import apiClient from "@/lib/api/client";
import {
  purchaseSchema,
  type PurchaseFormValues,
} from "@/lib/validations/purchase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/error-message";

export default function CreatePurchasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      registrationNumber: "",
      chassisNumber: "",
      engineNumber: "",
      colour: "",
      sellingPrice: 0,
      sellerName: "",
      sellerPhone: "",
      sellerAddress: "",
      buyingCost: 0,
      expense: 0,
      purchaseDate: format(new Date(), "yyyy-MM-dd"),
      imageUrl: "",
    },
  });

  const onSubmit = async (values: PurchaseFormValues) => {
    setServerError("");

    try {
      await apiClient.post("/purchases", values);
      toast({
        title: "Purchase added",
        description: "Vehicle purchase recorded successfully.",
        variant: "success",
      });
      router.push("/purchases");
      router.refresh();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Failed to create purchase.");
      setServerError(message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h2 className="srs-page-title">Create Purchase</h2>
        <p className="srs-muted">Add a newly purchased vehicle to inventory.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Vehicle Purchase Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" {...register("brand")} />
                <FormError message={errors.brand?.message} />
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" {...register("model")} />
                <FormError message={errors.model?.message} />
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" {...register("year", { valueAsNumber: true })} />
                <FormError message={errors.year?.message} />
              </div>

              <div>
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input id="registrationNumber" {...register("registrationNumber")} />
                <FormError message={errors.registrationNumber?.message} />
              </div>

              <div>
                <Label htmlFor="chassisNumber">Chassis Number</Label>
                <Input id="chassisNumber" {...register("chassisNumber")} />
                <FormError message={errors.chassisNumber?.message} />
              </div>

              <div>
                <Label htmlFor="engineNumber">Engine Number</Label>
                <Input id="engineNumber" {...register("engineNumber")} />
                <FormError message={errors.engineNumber?.message} />
              </div>

              <div>
                <Label htmlFor="colour">Colour (optional)</Label>
                <Input id="colour" {...register("colour")} />
                <FormError message={errors.colour?.message} />
              </div>

              <div>
                <Label htmlFor="sellingPrice">Selling Price</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  {...register("sellingPrice", { valueAsNumber: true })}
                />
                <FormError message={errors.sellingPrice?.message} />
              </div>

              <div>
                <Label htmlFor="buyingCost">Buying Cost</Label>
                <Input
                  id="buyingCost"
                  type="number"
                  step="0.01"
                  {...register("buyingCost", { valueAsNumber: true })}
                />
                <FormError message={errors.buyingCost?.message} />
              </div>

              <div>
                <Label htmlFor="expense">Expense</Label>
                <Input
                  id="expense"
                  type="number"
                  step="0.01"
                  {...register("expense", { valueAsNumber: true })}
                />
                <FormError message={errors.expense?.message} />
              </div>

              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input id="purchaseDate" type="date" {...register("purchaseDate")} />
                <FormError message={errors.purchaseDate?.message} />
              </div>

              <div>
                <Label htmlFor="sellerName">Seller Name</Label>
                <Input id="sellerName" {...register("sellerName")} />
                <FormError message={errors.sellerName?.message} />
              </div>

              <div>
                <Label htmlFor="sellerPhone">Seller Phone</Label>
                <Input id="sellerPhone" {...register("sellerPhone")} />
                <FormError message={errors.sellerPhone?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="sellerAddress">Seller Address</Label>
              <Textarea id="sellerAddress" {...register("sellerAddress")} />
              <FormError message={errors.sellerAddress?.message} />
            </div>

            <FormError message={serverError} />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/purchases")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Create Purchase"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
