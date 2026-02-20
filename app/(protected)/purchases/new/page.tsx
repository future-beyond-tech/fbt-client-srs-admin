"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
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

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export default function CreatePurchasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [serverError, setServerError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const {
    register,
    setValue,
    watch,
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

  const imageUrl = watch("imageUrl");

  const displayPreview = useMemo(() => {
    return previewUrl || imageUrl || "";
  }, [previewUrl, imageUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Only image files are allowed.",
        variant: "error",
      });
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast({
        title: "File too large",
        description: "Image size must be less than or equal to 2MB.",
        variant: "error",
      });
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(localUrl);
  };

  const uploadImage = async () => {
    if (!selectedFile) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await apiClient.post<{ url: string }>("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setValue("imageUrl", response.data.url, { shouldValidate: true });
      toast({
        title: "Image uploaded",
        description: "Vehicle image uploaded successfully.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Upload failed",
        description: "Unable to upload image. Please try again.",
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  };

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
              <p className="text-sm font-medium text-primary">Vehicle Image Upload (Optional)</p>
              <p className="mt-1 text-xs text-muted-foreground">Image only, max 2MB.</p>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    onFileChange(event.target.files?.[0] ?? null)
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={uploadImage}
                  disabled={!selectedFile || uploading}
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>

              {displayPreview ? (
                <div className="mt-4 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayPreview}
                    alt="Preview"
                    className="h-44 w-full object-cover"
                  />
                </div>
              ) : null}
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
