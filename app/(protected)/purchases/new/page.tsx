"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, X } from "lucide-react";
import { format } from "date-fns";
import apiClient from "@/lib/api/client";
import { uploadVehiclePhotos } from "@/lib/api/vehicles";
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

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 10;

export default function CreatePurchasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

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

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) {
      setSelectedFiles([]);
      setPreviewUrls([]);
      return;
    }

    const list = Array.from(files).slice(0, MAX_FILES);
    const invalid = list.filter((f) => !f.type.startsWith("image/"));
    if (invalid.length > 0) {
      toast({
        title: "Invalid file",
        description: "Only image files are allowed.",
        variant: "error",
      });
    }
    const valid = list.filter((f) => f.type.startsWith("image/"));
    const oversized = valid.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (oversized.length > 0) {
      toast({
        title: "File too large",
        description: `Some images exceed ${MAX_IMAGE_SIZE / 1024 / 1024}MB. Max ${MAX_FILES} images.`,
        variant: "error",
      });
    }
    const toAdd = valid.filter((f) => f.size <= MAX_IMAGE_SIZE).slice(0, MAX_FILES);
    setSelectedFiles(toAdd);
    setPreviewUrls(toAdd.map((f) => URL.createObjectURL(f)));
    event.target.value = "";
  };

  const removePhoto = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const url = prev[index];
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (values: PurchaseFormValues) => {
    setServerError("");

    try {
      const { data } = await apiClient.post<Record<string, unknown>>("/purchases", values);

      const vehicleId =
        typeof data?.vehicleId === "number"
          ? data.vehicleId
          : typeof data?.vehicle_id === "number"
            ? data.vehicle_id
            : undefined;

      if (vehicleId != null && selectedFiles.length > 0) {
        try {
          const formData = new FormData();
          selectedFiles.forEach((file) => formData.append("Files", file));
          await uploadVehiclePhotos(String(vehicleId), formData);
          toast({
            title: "Purchase added",
            description: `Vehicle purchase and ${selectedFiles.length} photo(s) saved successfully.`,
            variant: "success",
          });
        } catch (uploadError) {
          toast({
            title: "Purchase added",
            description: getApiErrorMessage(
              uploadError,
              "Photos could not be uploaded. You can add them from the vehicle page.",
            ),
            variant: "default",
          });
        }
      } else if (selectedFiles.length > 0 && vehicleId == null) {
        toast({
          title: "Purchase added",
          description: "Vehicle created. Photos could not be uploaded (vehicle ID not returned). Add them from the vehicle page.",
          variant: "default",
        });
      } else {
        toast({
          title: "Purchase added",
          description: "Vehicle purchase recorded successfully.",
          variant: "success",
        });
      }

      router.push("/purchases");
      router.refresh();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Failed to create purchase.");
      setServerError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="srs-page-title">Create Purchase</h2>
        <p className="srs-muted">Add a newly purchased vehicle to inventory.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Vehicle Purchase Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="rounded-lg border border-dashed border-primary/30 p-4">
              <p className="text-sm font-medium text-primary">Vehicle Photos (Optional)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add up to {MAX_FILES} images, max {MAX_IMAGE_SIZE / 1024 / 1024}MB each. Photos are
                uploaded after the purchase is created.
              </p>

              <div className="mt-3 flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Label
                    htmlFor="vehicle-photos"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Choose photos
                  </Label>
                  <Input
                    id="vehicle-photos"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={onFileChange}
                  />
                </div>

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {previewUrls.map((url, index) => (
                      <div
                        key={url}
                        className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-1 top-1 h-7 w-7 rounded-full opacity-90"
                          onClick={() => removePhoto(index)}
                          aria-label="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
