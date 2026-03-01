"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  uploadPhoto,
  createManualBill,
  sendManualBillInvoice,
  downloadManualBillPdf,
  getManualBillPdfUrl,
  validatePhotoFile,
} from "@/lib/api/manual-bills";
import { normalizePhoneIndia } from "@/lib/validations/manual-bill";
import { manualBillSchema, PAYMENT_MODE_OPTIONS, NAME_TITLE_OPTIONS, type ManualBillFormValues } from "@/lib/validations/manual-bill";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/error-message";
import type { ManualBillCreateDto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Download, Loader2, MessageCircle, Printer } from "lucide-react";

type CameraFacingMode = "user" | "environment";

function sanitizeString(value: string): string {
  return value.trim().replace(/<[^>]*>/g, "");
}

function ManualBillingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraFacingMode, setCameraFacingMode] = useState<CameraFacingMode>("environment");
  const [createdBillNumber, setCreatedBillNumber] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"download" | "whatsapp" | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get("billNumber")?.trim();
    if (fromUrl) setCreatedBillNumber(fromUrl);
  }, [searchParams]);

  const { toast } = useToast();
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ManualBillFormValues>({
    resolver: zodResolver(manualBillSchema),
    defaultValues: {
      customerNameTitle: undefined,
      customerName: "",
      phone: "",
      address: "",
      itemDescription: "",
      chassisNumber: "",
      engineNumber: "",
      color: "",
      notes: "",
      totalAmount: 0,
      paymentMode: "Cash",
      financeCompany: "",
      sellerName: "",
      sellerNameTitle: undefined,
      sellerAddress: "",
      photoUrl: "",
    },
  });

  const paymentMode = watch("paymentMode") ?? "Cash";

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    videoRef.current && (videoRef.current.srcObject = null);
    setCameraOpen(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => {
    if (photoPreview.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      void videoRef.current.play().catch(() => undefined);
    }
  }, [cameraOpen]);

  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (!file) return;
      try {
        validatePhotoFile(file);
      } catch (e) {
        toast({
          title: "Invalid file",
          description: e instanceof Error ? e.message : "Only image files up to 2MB.",
          variant: "error",
        });
        return;
      }
      stopCamera();
      setPhotoUploading(true);
      try {
        const url = await uploadPhoto(file);
        setValue("photoUrl", url, { shouldDirty: true, shouldValidate: true });
        setPhotoPreview(url);
        toast({ title: "Photo uploaded", variant: "success" });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: getApiErrorMessage(error, "Unable to upload photo."),
          variant: "error",
        });
      } finally {
        setPhotoUploading(false);
      }
    },
    [setValue, stopCamera, toast],
  );

  const startCamera = useCallback(async (preferred?: CameraFacingMode) => {
    setCameraError("");
    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError("Camera not supported. Please upload a photo.");
      return;
    }
    const mode = preferred ?? cameraFacingMode;
    const fallback: CameraFacingMode = mode === "environment" ? "user" : "environment";
    const toTry: CameraFacingMode[] = [mode, fallback].filter((m, i, a) => a.indexOf(m) === i);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    for (const m of toTry) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: m } },
        });
        streamRef.current = stream;
        setCameraFacingMode(m);
        setCameraOpen(true);
        return;
      } catch {
        /* try next */
      }
    }
    setCameraError("Could not access camera. Please upload a photo.");
  }, [cameraFacingMode]);

  const captureFromCamera = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 540;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `manual-bill-${Date.now()}.jpg`, { type: "image/jpeg" });
        setPhotoPreview(URL.createObjectURL(blob));
        void handleFileSelect(file);
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  }, [handleFileSelect, stopCamera]);

  const onSubmit = async (values: ManualBillFormValues) => {
    const phone = normalizePhoneIndia(values.phone);
    const total = Number(values.totalAmount);
    const paymentModeApi: 1 | 2 | 3 =
      values.paymentMode === "Finance" ? 3 : values.paymentMode === "UPI" ? 2 : 1;
    const payload: ManualBillCreateDto = {
      customerName: sanitizeString(values.customerName),
      customerNameTitle: values.customerNameTitle?.trim() || undefined,
      phone,
      address: values.address?.trim() ? sanitizeString(values.address) : undefined,
      itemDescription: sanitizeString(values.itemDescription),
      chassisNumber: values.chassisNumber?.trim() || undefined,
      engineNumber: values.engineNumber?.trim() || undefined,
      color: values.color?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
      amountTotal: total,
      paymentMode: paymentModeApi,
      cashAmount: values.paymentMode === "Cash" ? total : undefined,
      upiAmount: values.paymentMode === "UPI" ? total : undefined,
      financeAmount: values.paymentMode === "Finance" ? total : undefined,
      financeCompany: values.paymentMode === "Finance" ? (values.financeCompany?.trim() || undefined) : undefined,
      photoUrl: values.photoUrl.trim(),
      sellerName: values.sellerName?.trim() || undefined,
      sellerNameTitle: values.sellerNameTitle?.trim() || undefined,
      sellerAddress: values.sellerAddress?.trim() || undefined,
    };
    try {
      const res = await createManualBill(payload);
      setCreatedBillNumber(String(res.billNumber));
      toast({
        title: "Bill created",
        description: `Bill number: ${res.billNumber}`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Failed to create bill",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "error",
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (!createdBillNumber) return;
    setActionLoading("download");
    try {
      const blob = await downloadManualBillPdf(createdBillNumber);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manual-bill-${createdBillNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded", variant: "success" });
    } catch (error) {
      toast({
        title: "Download failed",
        description: getApiErrorMessage(error, "Could not get PDF."),
        variant: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrint = () => {
    if (!createdBillNumber) return;
    const url = getManualBillPdfUrl(createdBillNumber);
    window.open(url, "_blank", "noopener,noreferrer");
    toast({ title: "Opened PDF", description: "Print from the new tab.", variant: "success" });
  };

  const handleSendWhatsApp = async () => {
    if (!createdBillNumber) return;
    setActionLoading("whatsapp");
    try {
      const res = await sendManualBillInvoice(createdBillNumber);
      toast({
        title: "Invoice sent",
        description: res.status || "Sent via WhatsApp successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Send failed",
        description: getApiErrorMessage(
          error,
          "Could not send. Check phone number or try again.",
        ),
        variant: "error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (createdBillNumber) {
    const pdfUrl = getManualBillPdfUrl(createdBillNumber);
    return (
      <div className="space-y-4 sm:space-y-6">
        <h2 className="srs-page-title">Manual Billing</h2>
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Bill created</CardTitle>
            <p className="text-sm text-muted-foreground">Bill number: {createdBillNumber}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              type="button"
              variant="accent"
              onClick={handlePrint}
              className="min-h-touch"
            >
              <Printer className="h-4 w-4" />
              Print / Open PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDownloadPdf()}
              disabled={actionLoading !== null}
              className="min-h-touch"
            >
              {actionLoading === "download" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSendWhatsApp()}
              disabled={actionLoading !== null}
              className="min-h-touch"
              title="Send invoice via WhatsApp"
            >
              {actionLoading === "whatsapp" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              Send via WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCreatedBillNumber(null);
                setPhotoPreview("");
                setValue("photoUrl", "");
                router.replace("/manual-billing");
              }}
              className="min-h-touch"
            >
              Create another bill
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Invoice PDF</CardTitle>
            <p className="text-sm text-muted-foreground">Preview of manual bill #{createdBillNumber}</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border bg-muted/20">
              <iframe
                title={`Manual bill ${createdBillNumber} PDF`}
                src={pdfUrl}
                className="h-[min(80vh,720px)] w-full min-h-[480px]"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="srs-page-title">Manual Billing</h2>
        <p className="srs-muted">Create a manual bill with customer details and photo.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">New manual bill</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4 sm:space-y-6"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <input type="hidden" {...register("photoUrl")} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
              <div>
                <Label htmlFor="customerNameTitle">Title (optional)</Label>
                <select
                  id="customerNameTitle"
                  {...register("customerNameTitle")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">—</option>
                  {NAME_TITLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="customerName">Customer name *</Label>
                <Input
                  id="customerName"
                  {...register("customerName")}
                  placeholder="Full name"
                  autoComplete="name"
                />
                <FormError message={errors.customerName?.message} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="10 digits (e.g. 9876543210)"
                  {...register("phone")}
                  maxLength={10}
                />
                <FormError message={errors.phone?.message} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
              <div>
                <Label htmlFor="sellerNameTitle">Seller title (optional)</Label>
                <select
                  id="sellerNameTitle"
                  {...register("sellerNameTitle")}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">—</option>
                  {NAME_TITLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="sellerName">Seller name (optional)</Label>
                <Input
                  id="sellerName"
                  {...register("sellerName")}
                  placeholder="Defaults to shop name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="sellerAddress">Seller address (optional)</Label>
              <Textarea
                id="sellerAddress"
                {...register("sellerAddress")}
                placeholder="Seller address (defaults to shop address in PDF)"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="address">Address (optional)</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Address"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="itemDescription">Item / Description *</Label>
              <Textarea
                id="itemDescription"
                {...register("itemDescription")}
                placeholder="Item or service description"
                rows={2}
              />
              <FormError message={errors.itemDescription?.message} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
              <div>
                <Label htmlFor="chassisNumber">Chassis No (optional)</Label>
                <Input
                  id="chassisNumber"
                  {...register("chassisNumber")}
                  placeholder="Chassis number"
                />
              </div>
              <div>
                <Label htmlFor="engineNumber">Engine No (optional)</Label>
                <Input
                  id="engineNumber"
                  {...register("engineNumber")}
                  placeholder="Engine number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6">
              <div>
                <Label htmlFor="color">Color (optional)</Label>
                <Input
                  id="color"
                  {...register("color")}
                  placeholder="e.g. White, Black"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  {...register("notes")}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="totalAmount">Total amount *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min={0}
                {...register("totalAmount", { valueAsNumber: true })}
              />
              <FormError message={errors.totalAmount?.message} />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium text-primary">Payment mode *</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Select how the customer is paying. If Finance, enter the finance company name.
              </p>
              <div className="mt-3 flex flex-wrap gap-4">
                {PAYMENT_MODE_OPTIONS.map((mode) => (
                  <label
                    key={mode}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="radio"
                      value={mode}
                      {...register("paymentMode")}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{mode}</span>
                  </label>
                ))}
              </div>
              <FormError message={errors.paymentMode?.message} />
              {paymentMode === "Finance" && (
                <div className="mt-3">
                  <Label htmlFor="financeCompany">Finance company / name *</Label>
                  <Input
                    id="financeCompany"
                    {...register("financeCompany")}
                    placeholder="e.g. HDFC Bank"
                  />
                  <FormError message={errors.financeCompany?.message} />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-dashed border-primary/30 p-4">
              <p className="text-sm font-medium text-primary">
                Photo * <span className="text-muted-foreground">(max 2MB, JPEG/PNG/WebP)</span>
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={photoUploading}
                  onChange={(e) => void handleFileSelect(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={photoUploading}
                  onClick={() => (cameraOpen ? stopCamera() : startCamera())}
                  className="min-h-touch"
                >
                  <Camera className="h-4 w-4" />
                  {cameraOpen ? "Close camera" : "Use camera"}
                </Button>
                {cameraOpen && (
                  <Button
                    type="button"
                    variant="accent"
                    disabled={photoUploading}
                    onClick={captureFromCamera}
                    className="min-h-touch"
                  >
                    Capture
                  </Button>
                )}
              </div>
              {cameraError && (
                <p className="mt-2 text-sm text-red-600">{cameraError}</p>
              )}
              {(photoPreview || cameraOpen) && (
                <div className="mt-4 flex items-start gap-4">
                  {cameraOpen && (
                    <div className="w-36 overflow-hidden rounded-lg border bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-44 w-36 object-cover"
                      />
                    </div>
                  )}
                  {photoPreview && !cameraOpen && (
                    <div className="w-36 overflow-hidden rounded-lg border bg-muted/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Bill photo"
                        className="h-44 w-36 object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
              <FormError message={errors.photoUrl?.message} />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || photoUploading}
              className="min-h-touch"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create bill"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ManualBillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ManualBillingContent />
    </Suspense>
  );
}
