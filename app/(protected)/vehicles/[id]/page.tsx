// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import type { Vehicle, VehiclePhoto } from "@/lib/types";
import {
  getVehicleById,
  uploadVehiclePhotos,
  setPrimaryVehiclePhoto,
  deleteVehiclePhoto,
} from "@/lib/api/vehicles";
import { formatCurrencyINR } from "@/lib/formatters";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ArrowLeft, ImagePlus, Loader2, Star, Trash2 } from "lucide-react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 10;

function getPhotoDisplayUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `/api/media?src=${encodeURIComponent(trimmed)}`;
}

export default function VehicleDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [workingPhotoId, setWorkingPhotoId] = useState<number | null>(null);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState<VehiclePhoto | null>(null);

  const fetchVehicle = useCallback(async (vehicleId: string) => {
    setLoading(true);
    try {
      const data = await getVehicleById(vehicleId);
      setVehicle(data ?? null);
    } catch {
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) void fetchVehicle(id);
  }, [id, fetchVehicle]);

  const handleUploadPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length || !id) return;

    const fileList = Array.from(files).slice(0, MAX_FILES);
    const oversized = fileList.filter((f) => f.size > MAX_IMAGE_SIZE);
    if (oversized.length > 0) {
      toast({
        title: "File too large",
        description: `Some images exceed ${MAX_IMAGE_SIZE / 1024 / 1024}MB. Skipped.`,
        variant: "error",
      });
    }

    const toUpload = fileList.filter((f) => f.size <= MAX_IMAGE_SIZE);
    if (toUpload.length === 0) return;

    const formData = new FormData();
    // Backend: List<IFormFile> Files — form field name must match "Files"
    toUpload.forEach((file) => {
      formData.append("Files", file);
    });

    setUploading(true);
    try {
      await uploadVehiclePhotos(id, formData);
      toast({
        title: "Photos uploaded",
        description: `${toUpload.length} photo(s) added.`,
        variant: "success",
      });
      await fetchVehicle(id);
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: getApiErrorMessage(error, "Failed to upload photos."),
        variant: "error",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSetPrimary = async (photoId: number) => {
    if (!id) return;
    setWorkingPhotoId(photoId);
    try {
      await setPrimaryVehiclePhoto(id, photoId);
      toast({
        title: "Primary photo updated",
        description: "Primary photo set successfully.",
        variant: "success",
      });
      await fetchVehicle(id);
    } catch (error: unknown) {
      toast({
        title: "Update failed",
        description: getApiErrorMessage(error, "Failed to set primary photo."),
        variant: "error",
      });
    } finally {
      setWorkingPhotoId(null);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirmDeletePhoto) return;
    const photoId = confirmDeletePhoto.id;
    setWorkingPhotoId(photoId);
    try {
      await deleteVehiclePhoto(photoId);
      setVehicle((prev) =>
        prev
          ? {
              ...prev,
              photos: (prev.photos ?? []).filter((p) => p.id !== photoId),
            }
          : null,
      );
      toast({
        title: "Photo deleted",
        description: "Photo removed successfully.",
        variant: "success",
      });
      setConfirmDeletePhoto(null);
    } catch (error: unknown) {
      toast({
        title: "Delete failed",
        description: getApiErrorMessage(error, "Failed to delete photo."),
        variant: "error",
      });
    } finally {
      setWorkingPhotoId(null);
    }
  };

  if (loading) {
    return (
<div className="space-y-4 sm:space-y-6">
      <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Vehicle not found.</p>
        <Link href="/vehicles" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Vehicles
        </Link>
      </div>
    );
  }

  const photos = vehicle.photos ?? [];

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/vehicles"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            aria-label="Back to vehicles"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h2 className="srs-page-title">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="srs-muted">
              {vehicle.year} · {vehicle.registrationNumber}
            </p>
          </div>
        </div>
        <Link
          href="/vehicles"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          Back to Vehicles
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
          <InfoRow label="Brand" value={vehicle.brand} />
          <InfoRow label="Model" value={vehicle.model} />
          <InfoRow label="Year" value={String(vehicle.year)} />
          <InfoRow label="Registration No" value={vehicle.registrationNumber} />
          <InfoRow label="Colour" value={vehicle.colour ?? "—"} />
          <InfoRow label="Selling Price" value={formatCurrencyINR(vehicle.sellingPrice)} />
          <InfoRow
            label="Status"
            value={
              <Badge
                variant={vehicle.status === "AVAILABLE" ? "success" : "destructive"}
              >
                {vehicle.status === "AVAILABLE" ? "Available" : "Sold"}
              </Badge>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Photos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload multiple images (max {MAX_FILES} at a time, {MAX_IMAGE_SIZE / 1024 / 1024}MB each).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleUploadPhotos}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload Photos"}
          </Button>

          {photos.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => {
                const src = getPhotoDisplayUrl(photo.url);
                const isWorking = workingPhotoId === photo.id;
                return (
                  <div
                    key={photo.id}
                    className="relative overflow-hidden rounded-lg border bg-muted/30"
                  >
                    {src ? (
                      <img
                        src={src}
                        alt=""
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 flex gap-2 bg-black/60 p-2">
                      {!photo.isPrimary && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={isWorking}
                          onClick={() => void handleSetPrimary(photo.id)}
                          title="Set as primary"
                        >
                          {isWorking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {photo.isPrimary && (
                        <span className="flex flex-1 items-center justify-center gap-1 text-xs font-medium text-white">
                          <Star className="h-3 w-3 fill-current" />
                          Primary
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isWorking}
                        onClick={() => setConfirmDeletePhoto(photo)}
                        title="Delete photo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No photos yet. Upload to add.</p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(confirmDeletePhoto)}
        title="Delete Photo"
        description="Remove this photo from the vehicle? This cannot be undone."
        confirmLabel="Delete"
        loading={confirmDeletePhoto != null && workingPhotoId === confirmDeletePhoto?.id}
        onCancel={() => setConfirmDeletePhoto(null)}
        onConfirm={() => void handleDeletePhoto()}
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
