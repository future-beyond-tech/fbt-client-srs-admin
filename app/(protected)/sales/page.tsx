"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PaymentMode, Vehicle } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatCurrencyINR } from "@/lib/formatters";
import { saleSchema, type SaleFormValues } from "@/lib/validations/sale";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function resetAmountsForMode(
  mode: PaymentMode,
  price: number,
  setValue: (name: keyof SaleFormValues, value: string | number) => void,
) {
  if (mode === "Cash") {
    setValue("cashAmount", price);
    setValue("upiAmount", 0);
    setValue("financeAmount", 0);
    setValue("financeCompany", "");
    return;
  }

  if (mode === "UPI") {
    setValue("cashAmount", 0);
    setValue("upiAmount", price);
    setValue("financeAmount", 0);
    setValue("financeCompany", "");
    return;
  }

  if (mode === "Finance") {
    setValue("cashAmount", 0);
    setValue("upiAmount", 0);
    setValue("financeAmount", price);
    return;
  }

  setValue("cashAmount", 0);
  setValue("upiAmount", 0);
  setValue("financeAmount", 0);
  setValue("financeCompany", "");
}

export default function SalesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [serverError, setServerError] = useState("");

  const {
    register,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      vehicleId: "",
      vehiclePrice: 0,
      customerName: "",
      phone: "",
      address: "",
      paymentMode: "Cash",
      cashAmount: 0,
      upiAmount: 0,
      financeAmount: 0,
      financeCompany: "",
    },
  });

  const paymentMode = watch("paymentMode");
  const vehiclePrice = watch("vehiclePrice") || 0;
  const cashAmount = watch("cashAmount") || 0;
  const upiAmount = watch("upiAmount") || 0;
  const financeAmount = watch("financeAmount") || 0;

  const totalPayment = useMemo(
    () => Number(cashAmount) + Number(upiAmount) + Number(financeAmount),
    [cashAmount, upiAmount, financeAmount],
  );

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await apiClient.get<Vehicle[]>("/vehicles/available");
        setVehicles(response.data);
      } finally {
        setLoadingVehicles(false);
      }
    };

    void fetchVehicles();
  }, []);

  const onSubmit = async (values: SaleFormValues) => {
    setServerError("");

    try {
      const response = await apiClient.post<{
        billNumber: string;
        data: {
          id: string;
        };
      }>("/sales", values);

      toast({
        title: "Sale completed",
        description: `Bill Number: ${response.data.billNumber}`,
        variant: "success",
      });

      router.push(`/sales/${response.data.data.id}/invoice`);
      router.refresh();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Failed to complete sale.");

      setServerError(message);
    }
  };

  if (!loadingVehicles && vehicles.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="srs-page-title">Sales</h2>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No available vehicles for sale.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="srs-page-title">Create Sale</h2>
        <p className="srs-muted">Record sale and capture payment details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Sales Entry Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Vehicle</Label>
                <Controller
                  control={control}
                  name="vehicleId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value);

                        const selectedVehicle = vehicles.find(
                          (vehicle) => vehicle.id === value,
                        );
                        const price = selectedVehicle?.sellingPrice ?? 0;

                        setValue("vehiclePrice", price, { shouldValidate: true });
                        resetAmountsForMode(
                          paymentMode,
                          price,
                          (name, val) => setValue(name, val as never),
                        );
                      }}
                    >
                      <option value="">Select available vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} ({vehicle.registrationNumber})
                        </option>
                      ))}
                    </Select>
                  )}
                />
                <FormError message={errors.vehicleId?.message} />
              </div>

              <div>
                <Label>Payment Mode</Label>
                <Controller
                  control={control}
                  name="paymentMode"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onChange={(event) => {
                        const value = event.target.value as PaymentMode;
                        field.onChange(value);
                        resetAmountsForMode(
                          value,
                          vehiclePrice,
                          (name, val) => setValue(name, val as never),
                        );
                      }}
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Finance">Finance</option>
                      <option value="Mixed">Mixed</option>
                    </Select>
                  )}
                />
                <FormError message={errors.paymentMode?.message} />
              </div>

              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input id="customerName" {...register("customerName")} />
                <FormError message={errors.customerName?.message} />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
                <FormError message={errors.phone?.message} />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register("address")} />
              <FormError message={errors.address?.message} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(paymentMode === "Cash" || paymentMode === "Mixed") && (
                <div>
                  <Label htmlFor="cashAmount">Cash Amount</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    step="0.01"
                    {...register("cashAmount", { valueAsNumber: true })}
                  />
                  <FormError message={errors.cashAmount?.message} />
                </div>
              )}

              {(paymentMode === "UPI" || paymentMode === "Mixed") && (
                <div>
                  <Label htmlFor="upiAmount">UPI Amount</Label>
                  <Input
                    id="upiAmount"
                    type="number"
                    step="0.01"
                    {...register("upiAmount", { valueAsNumber: true })}
                  />
                  <FormError message={errors.upiAmount?.message} />
                </div>
              )}

              {(paymentMode === "Finance" || paymentMode === "Mixed") && (
                <>
                  <div>
                    <Label htmlFor="financeAmount">Finance Amount</Label>
                    <Input
                      id="financeAmount"
                      type="number"
                      step="0.01"
                      {...register("financeAmount", { valueAsNumber: true })}
                    />
                    <FormError message={errors.financeAmount?.message} />
                  </div>
                  <div>
                    <Label htmlFor="financeCompany">Finance Company</Label>
                    <Input id="financeCompany" {...register("financeCompany")} />
                    <FormError message={errors.financeCompany?.message} />
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vehicle Selling Price</span>
                <span className="font-semibold text-primary">
                  {formatCurrencyINR(Number(vehiclePrice))}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Entered Total Payment</span>
                <span
                  className={
                    Math.abs(totalPayment - vehiclePrice) <= 0.001
                      ? "font-semibold text-emerald-700"
                      : "font-semibold text-red-600"
                  }
                >
                  {formatCurrencyINR(Number(totalPayment))}
                </span>
              </div>
            </div>

            <FormError message={serverError} />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving Sale..." : "Submit Sale"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
