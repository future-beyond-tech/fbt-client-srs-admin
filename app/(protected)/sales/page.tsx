"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PaymentMode, Vehicle } from "@/lib/types";
import { PaymentMode as PaymentModeEnum } from "@/lib/types";
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

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

function resetAmountsForMode(
  mode: PaymentMode,
  price: number,
  setValue: (name: keyof SaleFormValues, value: string | number) => void,
) {
  if (mode === PaymentModeEnum.Cash) {
    setValue("cashAmount", price);
    setValue("upiAmount", 0);
    setValue("financeAmount", 0);
    setValue("financeCompany", "");
    return;
  }

  if (mode === PaymentModeEnum.UPI) {
    setValue("cashAmount", 0);
    setValue("upiAmount", price);
    setValue("financeAmount", 0);
    setValue("financeCompany", "");
    return;
  }

  if (mode === PaymentModeEnum.Finance) {
    setValue("cashAmount", 0);
    setValue("upiAmount", 0);
    setValue("financeAmount", price);
    return;
  }
}

export default function SalesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [serverError, setServerError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      customerId: "",
      customerPhotoUrl: "",
      customerName: "",
      phone: "",
      address: "",
      paymentMode: PaymentModeEnum.Cash,
      cashAmount: 0,
      upiAmount: 0,
      financeAmount: 0,
      financeCompany: "",
      saleDate: new Date().toISOString(),
      rcBookReceived: undefined,
      ownershipTransferAccepted: undefined,
      vehicleAcceptedInAsIsCondition: undefined,
    },
  });

  const paymentMode = watch("paymentMode");
  const vehiclePrice = watch("vehiclePrice") || 0;
  const cashAmount = watch("cashAmount") || 0;
  const upiAmount = watch("upiAmount") || 0;
  const financeAmount = watch("financeAmount") || 0;
  const customerPhotoUrl = watch("customerPhotoUrl") || "";

  const totalPayment = useMemo(
    () => Number(cashAmount) + Number(upiAmount) + Number(financeAmount),
    [cashAmount, upiAmount, financeAmount],
  );
  const discountAmount = useMemo(
    () => Math.max(Number(vehiclePrice) - Number(totalPayment), 0),
    [vehiclePrice, totalPayment],
  );
  const displayPhotoPreview = photoPreview || customerPhotoUrl;

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !streamRef.current) {
      return;
    }

    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => undefined);
  }, [cameraOpen]);

  const uploadPhoto = async (file: File) => {
    setPhotoUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.post<{ url: string }>("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setValue("customerPhotoUrl", response.data.url, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setPhotoPreview(response.data.url);
      toast({
        title: "Customer photo uploaded",
        description: "Photo uploaded successfully.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Upload failed",
        description: "Unable to upload customer photo.",
        variant: "error",
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const onSelectPhotoFile = async (file: File | null) => {
    if (!file) {
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

    stopCamera();
    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);
    await uploadPhoto(file);
  };

  const startCamera = async () => {
    setCameraError("");

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported in this browser. Please upload a photo.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
      });

      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError("Unable to access camera. Please allow permission or upload a photo.");
      setCameraOpen(false);
    }
  };

  const captureFromCamera = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const canvas = document.createElement("canvas");
    const width = video.videoWidth || 720;
    const height = video.videoHeight || 540;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      toast({
        title: "Capture failed",
        description: "Unable to capture image from camera.",
        variant: "error",
      });
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });

    if (!blob) {
      toast({
        title: "Capture failed",
        description: "Unable to capture image from camera.",
        variant: "error",
      });
      return;
    }

    const file = new File([blob], `customer-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    const localPreview = URL.createObjectURL(file);
    setPhotoPreview(localPreview);
    await uploadPhoto(file);
    stopCamera();
  };

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
      const response = await apiClient.post<{ billNumber: number }>("/sales", {
        ...values,
        saleDate: new Date().toISOString(),
      });

      toast({
        title: "Sale completed",
        description: `Bill Number: ${response.data.billNumber}`,
        variant: "success",
      });

      router.push(`/sales/${response.data.billNumber}/invoice`);
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
            <input type="hidden" {...register("customerPhotoUrl")} />

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
                      <option value={PaymentModeEnum.Cash}>Cash</option>
                      <option value={PaymentModeEnum.UPI}>UPI</option>
                      <option value={PaymentModeEnum.Finance}>Finance</option>
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

            <div className="rounded-lg border border-dashed border-primary/30 p-4">
              <p className="text-sm font-medium text-primary">
                Customer Photo <span className="text-red-600">*</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Capture from camera or upload from device (max 2MB).
              </p>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={photoUploading}
                  onChange={(event) => {
                    void onSelectPhotoFile(event.target.files?.[0] ?? null);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={photoUploading}
                  onClick={() => {
                    if (cameraOpen) {
                      stopCamera();
                      return;
                    }

                    void startCamera();
                  }}
                >
                  {cameraOpen ? "Close Camera" : "Use Camera"}
                </Button>
                {cameraOpen ? (
                  <Button
                    type="button"
                    variant="accent"
                    disabled={photoUploading}
                    onClick={() => {
                      void captureFromCamera();
                    }}
                  >
                    Capture
                  </Button>
                ) : null}
              </div>

              {cameraError ? (
                <p className="mt-2 text-sm text-red-600">{cameraError}</p>
              ) : null}

              {cameraOpen ? (
                <div className="mt-4 overflow-hidden rounded-lg border">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-56 w-full object-cover"
                  />
                </div>
              ) : null}

              {displayPhotoPreview ? (
                <div className="mt-4 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayPhotoPreview}
                    alt="Customer preview"
                    className="h-44 w-full object-cover"
                  />
                </div>
              ) : null}

              <FormError message={errors.customerPhotoUrl?.message} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {paymentMode === PaymentModeEnum.Cash && (
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

              {paymentMode === PaymentModeEnum.UPI && (
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

              {paymentMode === PaymentModeEnum.Finance && (
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
                    totalPayment <= vehiclePrice + 0.001
                      ? "font-semibold text-emerald-700"
                      : "font-semibold text-red-600"
                  }
                >
                  {formatCurrencyINR(Number(totalPayment))}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Discount Given</span>
                <span className="font-semibold text-amber-700">
                  {formatCurrencyINR(Number(discountAmount))}
                </span>
              </div>
            </div>

            <FormError message={serverError} />

            <Button type="submit" disabled={isSubmitting || photoUploading}>
              {isSubmitting ? "Saving Sale..." : "Submit Sale"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
