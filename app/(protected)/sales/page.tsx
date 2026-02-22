// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Customer, FinanceCompany, PaymentMode, Vehicle } from "@/lib/types";
import { PaymentMode as PaymentModeEnum } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatCurrencyINR } from "@/lib/formatters";
import { saleSchema, type SaleFormValues } from "@/lib/validations/sale";
import { createCustomer, searchCustomersByPhone } from "@/lib/api/customers";
import {
  createFinanceCompany,
  getFinanceCompanies,
} from "@/lib/api/finance-companies";
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

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerMatches, setCustomerMatches] = useState<Customer[]>([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [financeCompanies, setFinanceCompanies] = useState<FinanceCompany[]>([]);
  const [loadingFinanceCompanies, setLoadingFinanceCompanies] = useState(false);
  const [creatingFinanceCompany, setCreatingFinanceCompany] = useState(false);
  const [newFinanceCompanyName, setNewFinanceCompanyName] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    register,
    watch,
    control,
    setValue,
    getValues,
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
      rcBookReceived: false,
      ownershipTransferAccepted: false,
      vehicleAcceptedInAsIsCondition: false,
    },
  });

  const paymentMode = watch("paymentMode");
  const vehiclePrice = watch("vehiclePrice") || 0;
  const cashAmount = watch("cashAmount") || 0;
  const upiAmount = watch("upiAmount") || 0;
  const financeAmount = watch("financeAmount") || 0;
  const customerId = watch("customerId") || "";
  const phone = watch("phone") || "";
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

  const applyCustomer = useCallback(
    (customer: Customer) => {
      setSelectedCustomer(customer);
      setValue("customerId", customer.id, { shouldDirty: true, shouldValidate: true });
      setValue("customerName", customer.name, { shouldDirty: true, shouldValidate: true });
      setValue("phone", customer.phone, { shouldDirty: true, shouldValidate: true });
      setValue("address", customer.address ?? "", { shouldDirty: true, shouldValidate: true });
    },
    [setValue],
  );

  const loadFinanceCompanies = useCallback(async () => {
    setLoadingFinanceCompanies(true);
    try {
      const rows = await getFinanceCompanies();
      setFinanceCompanies(rows);
    } catch {
      setFinanceCompanies([]);
    } finally {
      setLoadingFinanceCompanies(false);
    }
  }, []);

  useEffect(() => {
    void loadFinanceCompanies();
  }, [loadFinanceCompanies]);

  useEffect(() => {
    const query = phone.trim();

    if (!query) {
      setCustomerMatches([]);
      setSearchingCustomer(false);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearchingCustomer(true);
      try {
        const rows = await searchCustomersByPhone(query);
        setCustomerMatches(rows);

        const normalizedInputPhone = normalizePhone(query);
        const exactMatch = rows.find(
          (customer) => normalizePhone(customer.phone) === normalizedInputPhone,
        );

        if (exactMatch) {
          setSelectedCustomer(exactMatch);
          setValue("customerId", exactMatch.id, { shouldValidate: true });
        } else if (customerId) {
          setSelectedCustomer(null);
          setValue("customerId", "", { shouldDirty: true, shouldValidate: true });
        }
      } catch {
        setCustomerMatches([]);
      } finally {
        setSearchingCustomer(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [phone, customerId, setValue]);

  const handleCreateFinanceCompany = async () => {
    const name = newFinanceCompanyName.trim();

    if (!name) {
      return;
    }

    setCreatingFinanceCompany(true);
    try {
      const created = await createFinanceCompany(name);
      setFinanceCompanies((prev) => {
        const merged = [...prev, created];
        const seen = new Set<number>();
        return merged.filter((company) => {
          if (seen.has(company.id)) return false;
          seen.add(company.id);
          return true;
        });
      });
      setValue("financeCompany", created.name, { shouldDirty: true, shouldValidate: true });
      setNewFinanceCompanyName("");
      toast({
        title: "Finance company added",
        description: `${created.name} is now available for sales.`,
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Unable to add finance company",
        description: getApiErrorMessage(error, "Failed to create finance company."),
        variant: "error",
      });
    } finally {
      setCreatingFinanceCompany(false);
    }
  };

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
      const inputName = values.customerName?.trim() ?? "";
      const inputPhone = values.phone?.trim() ?? "";
      const inputAddress = values.address?.trim() ?? "";
      let resolvedCustomerId = values.customerId?.trim() || "";

      if (!resolvedCustomerId && inputPhone) {
        const matches = await searchCustomersByPhone(inputPhone).catch(() => []);
        const normalizedInputPhone = normalizePhone(inputPhone);
        const matched =
          matches.find(
            (customer) => normalizePhone(customer.phone) === normalizedInputPhone,
          ) ?? null;

        if (matched) {
          resolvedCustomerId = matched.id;
          applyCustomer(matched);
        }
      }

      if (
        !resolvedCustomerId &&
        inputName &&
        inputPhone
      ) {
        const created = await createCustomer({
          name: inputName,
          phone: inputPhone,
          address: inputAddress || null,
        }).catch(() => null);

        if (created) {
          resolvedCustomerId = created.id;
          applyCustomer(created);
          setCustomerMatches((prev) => {
            const existing = prev.some((row) => row.id === created.id);
            return existing ? prev : [created, ...prev];
          });
        }
      }

      const response = await apiClient.post<{ billNumber: number }>("/sales", {
        ...values,
        customerName: inputName,
        phone: inputPhone,
        address: inputAddress,
        customerId: resolvedCustomerId || undefined,
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
      <div className="space-y-4 sm:space-y-6">
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h2 className="srs-page-title">Create Sale</h2>
        <p className="srs-muted">Record sale and capture payment details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Sales Entry Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("customerId")} />
            <input type="hidden" {...register("customerPhotoUrl")} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
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
                <Input
                  id="customerName"
                  {...register("customerName", {
                    onChange: () => {
                      if (getValues("customerId")) {
                        setValue("customerId", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                      setSelectedCustomer(null);
                    },
                  })}
                />
                <FormError message={errors.customerName?.message} />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register("phone", {
                    onChange: () => {
                      if (getValues("customerId")) {
                        setValue("customerId", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                      setSelectedCustomer(null);
                    },
                  })}
                />
                <FormError message={errors.phone?.message} />
              </div>
            </div>

            {phone.trim() ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-primary">Existing Customers</p>
                  {searchingCustomer ? (
                    <span className="text-xs text-muted-foreground">Searching...</span>
                  ) : null}
                </div>

                {selectedCustomer ? (
                  <p className="mt-2 text-xs text-emerald-700">
                    Using existing customer: {selectedCustomer.name} ({selectedCustomer.phone})
                  </p>
                ) : null}

                {!searchingCustomer && customerMatches.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {customerMatches.slice(0, 6).map((customer) => (
                      <Button
                        key={customer.id}
                        type="button"
                        variant={customer.id === customerId ? "accent" : "outline"}
                        size="sm"
                        onClick={() => applyCustomer(customer)}
                      >
                        {customer.name} ({customer.phone})
                      </Button>
                    ))}
                  </div>
                ) : null}

                {!searchingCustomer && customerMatches.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No existing customer found for this phone. A new customer will be created
                    automatically when sale is submitted.
                  </p>
                ) : null}
              </div>
            ) : null}

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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
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
                    <Controller
                      control={control}
                      name="financeCompany"
                      render={({ field }) => (
                        <Select
                          id="financeCompany"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        >
                          <option value="">
                            {loadingFinanceCompanies
                              ? "Loading finance companies..."
                              : "Select finance company"}
                          </option>
                          {financeCompanies.map((company) => (
                            <option key={company.id} value={company.name}>
                              {company.name}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                    <FormError message={errors.financeCompany?.message} />
                    <div className="mt-2 flex gap-2">
                      <Input
                        id="newFinanceCompany"
                        placeholder="Add new finance company"
                        value={newFinanceCompanyName}
                        onChange={(event) => setNewFinanceCompanyName(event.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          void handleCreateFinanceCompany();
                        }}
                        disabled={creatingFinanceCompany || !newFinanceCompanyName.trim()}
                      >
                        {creatingFinanceCompany ? "Adding..." : "Add"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-lg border bg-background p-4">
              <p className="text-sm font-medium text-primary">Sale Confirmations</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Confirm all required declarations before submitting the sale.
              </p>

              <div className="mt-3 space-y-3">
                <Controller
                  control={control}
                  name="rcBookReceived"
                  render={({ field }) => (
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(field.value)}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border border-input text-primary focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-sm text-foreground">RC Book Received</span>
                    </label>
                  )}
                />

                <Controller
                  control={control}
                  name="ownershipTransferAccepted"
                  render={({ field }) => (
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(field.value)}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border border-input text-primary focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-sm text-foreground">
                        Ownership Transfer Accepted
                      </span>
                    </label>
                  )}
                />

                <Controller
                  control={control}
                  name="vehicleAcceptedInAsIsCondition"
                  render={({ field }) => (
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(field.value)}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border border-input text-primary focus:ring-2 focus:ring-ring"
                      />
                      <span className="text-sm text-foreground">
                        Vehicle Accepted in As-Is Condition
                      </span>
                    </label>
                  )}
                />
              </div>
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
