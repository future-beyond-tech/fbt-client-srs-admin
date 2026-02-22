// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Vehicle } from "@/lib/types";
import { VehicleStatus } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatCurrencyINR } from "@/lib/formatters";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

interface EditValues {
  sellingPrice: string;
  registrationNumber: string;
  colour: string;
}

function emptyEditValues(): EditValues {
  return {
    sellingPrice: "",
    registrationNumber: "",
    colour: "",
  };
}

export default function VehiclesPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workingVehicleId, setWorkingVehicleId] = useState<string | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditValues>(emptyEditValues);
  const [confirmDeleteVehicle, setConfirmDeleteVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = showAvailableOnly ? "/vehicles/available" : "/vehicles";
      const response = await apiClient.get<Vehicle[]>(endpoint);
      setRows(response.data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showAvailableOnly]);

  useEffect(() => {
    void fetchVehicles();
  }, [fetchVehicles]);

  const beginEdit = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setEditValues({
      sellingPrice: String(vehicle.sellingPrice ?? 0),
      registrationNumber: vehicle.registrationNumber ?? "",
      colour: vehicle.colour ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingVehicleId(null);
    setEditValues(emptyEditValues());
  };

  const saveEdit = async (vehicleId: string) => {
    const sellingPrice = Number(editValues.sellingPrice);

    if (!Number.isFinite(sellingPrice) || sellingPrice < 0) {
      toast({
        title: "Invalid selling price",
        description: "Selling price must be zero or greater.",
        variant: "error",
      });
      return;
    }

    setWorkingVehicleId(vehicleId);
    try {
      await apiClient.put(`/vehicles/${encodeURIComponent(vehicleId)}`, {
        sellingPrice,
        registrationNumber: editValues.registrationNumber.trim(),
        colour: editValues.colour.trim() || null,
      });
      toast({
        title: "Vehicle updated",
        description: "Vehicle details updated successfully.",
        variant: "success",
      });
      cancelEdit();
      await fetchVehicles();
    } catch (error: unknown) {
      toast({
        title: "Update failed",
        description: getApiErrorMessage(error, "Failed to update vehicle."),
        variant: "error",
      });
    } finally {
      setWorkingVehicleId(null);
    }
  };

  const toggleStatus = async (vehicle: Vehicle) => {
    const nextStatus =
      vehicle.status === VehicleStatus.Available
        ? VehicleStatus.Sold
        : VehicleStatus.Available;
    setWorkingVehicleId(vehicle.id);
    try {
      await apiClient.patch(`/vehicles/${encodeURIComponent(vehicle.id)}/status`, {
        status: nextStatus,
      });
      setRows((prev) =>
        prev.map((row) =>
          row.id === vehicle.id ? { ...row, status: nextStatus } : row,
        ),
      );
      toast({
        title: "Status updated",
        description: `Vehicle marked as ${nextStatus.toLowerCase()}.`,
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Status update failed",
        description: getApiErrorMessage(error, "Failed to update vehicle status."),
        variant: "error",
      });
    } finally {
      setWorkingVehicleId(null);
    }
  };

  const deleteVehicle = async () => {
    if (!confirmDeleteVehicle) {
      return;
    }

    const vehicle = confirmDeleteVehicle;
    setWorkingVehicleId(vehicle.id);
    try {
      await apiClient.delete(`/vehicles/${encodeURIComponent(vehicle.id)}`);
      setRows((prev) => prev.filter((row) => row.id !== vehicle.id));
      toast({
        title: "Vehicle deleted",
        description: "Vehicle removed successfully.",
        variant: "success",
      });
      setConfirmDeleteVehicle(null);
    } catch (error: unknown) {
      toast({
        title: "Delete failed",
        description: getApiErrorMessage(error, "Failed to delete vehicle."),
        variant: "error",
      });
    } finally {
      setWorkingVehicleId(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="srs-page-title">Vehicles</h2>
          <p className="srs-muted">Track and manage vehicle inventory.</p>
        </div>

        <Button
          type="button"
          variant={showAvailableOnly ? "accent" : "outline"}
          onClick={() => setShowAvailableOnly((prev) => !prev)}
          className="w-full sm:w-auto"
        >
          {showAvailableOnly ? "Showing Available" : "Show Available Only"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-3 p-4 md:hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-lg border bg-muted/30 p-4">
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : rows.length ? (
              rows.map((vehicle) => {
                const isEditing = editingVehicleId === vehicle.id;
                const isWorking = workingVehicleId === vehicle.id;
                return (
                  <div
                    key={vehicle.id}
                    className="rounded-lg border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-primary">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.year} · {vehicle.registrationNumber}
                        </p>
                      </div>
                      <Badge
                        variant={vehicle.status === "AVAILABLE" ? "success" : "destructive"}
                        className="shrink-0"
                      >
                        {vehicle.status === "AVAILABLE" ? "Available" : "Sold"}
                      </Badge>
                    </div>

                    {isEditing ? (
                      <div className="mt-3 space-y-2">
                        <Input
                          value={editValues.registrationNumber}
                          onChange={(event) =>
                            setEditValues((prev) => ({
                              ...prev,
                              registrationNumber: event.target.value,
                            }))
                          }
                          placeholder="Registration number"
                        />
                        <Input
                          value={editValues.colour}
                          onChange={(event) =>
                            setEditValues((prev) => ({
                              ...prev,
                              colour: event.target.value,
                            }))
                          }
                          placeholder="Colour"
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.sellingPrice}
                          onChange={(event) =>
                            setEditValues((prev) => ({
                              ...prev,
                              sellingPrice: event.target.value,
                            }))
                          }
                          placeholder="Selling price"
                        />
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Colour: {vehicle.colour || "—"}</p>
                        <p className="font-semibold text-primary">
                          {formatCurrencyINR(vehicle.sellingPrice)}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/vehicles/${encodeURIComponent(vehicle.id)}`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              void saveEdit(vehicle.id);
                            }}
                            disabled={isWorking}
                          >
                            {isWorking ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={cancelEdit}
                            disabled={isWorking}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => beginEdit(vehicle)}
                          disabled={isWorking}
                        >
                          Edit
                        </Button>
                      )}

                      {vehicle.status === VehicleStatus.Available ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            void toggleStatus(vehicle);
                          }}
                          disabled={isWorking}
                        >
                          Mark Sold
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmDeleteVehicle(vehicle)}
                        disabled={isWorking}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No vehicles found.
              </p>
            )}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Reg No</TableHead>
                  <TableHead>Colour</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={idx}>
                      {Array.from({ length: 8 }).map((__, cellIdx) => (
                        <TableCell key={cellIdx}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length ? (
                  rows.map((vehicle) => {
                    const isEditing = editingVehicleId === vehicle.id;
                    const isWorking = workingVehicleId === vehicle.id;
                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell>{vehicle.brand}</TableCell>
                        <TableCell>{vehicle.model}</TableCell>
                        <TableCell>{vehicle.year}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.registrationNumber}
                              onChange={(event) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  registrationNumber: event.target.value,
                                }))
                              }
                            />
                          ) : (
                            vehicle.registrationNumber
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              value={editValues.colour}
                              onChange={(event) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  colour: event.target.value,
                                }))
                              }
                            />
                          ) : (
                            vehicle.colour || "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editValues.sellingPrice}
                              onChange={(event) =>
                                setEditValues((prev) => ({
                                  ...prev,
                                  sellingPrice: event.target.value,
                                }))
                              }
                            />
                          ) : (
                            formatCurrencyINR(vehicle.sellingPrice)
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={vehicle.status === "AVAILABLE" ? "success" : "destructive"}
                          >
                            {vehicle.status === "AVAILABLE" ? "Available" : "Sold"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/vehicles/${encodeURIComponent(vehicle.id)}`}
                              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    void saveEdit(vehicle.id);
                                  }}
                                  disabled={isWorking}
                                >
                                  {isWorking ? "Saving..." : "Save"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={cancelEdit}
                                  disabled={isWorking}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => beginEdit(vehicle)}
                                disabled={isWorking}
                              >
                                Edit
                              </Button>
                            )}
                            {vehicle.status === VehicleStatus.Available ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  void toggleStatus(vehicle);
                                }}
                                disabled={isWorking}
                              >
                                Mark Sold
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => setConfirmDeleteVehicle(vehicle)}
                              disabled={isWorking}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(confirmDeleteVehicle)}
        title="Delete Vehicle"
        description={
          confirmDeleteVehicle
            ? `Delete ${confirmDeleteVehicle.brand} ${confirmDeleteVehicle.model} (${confirmDeleteVehicle.registrationNumber})?`
            : ""
        }
        confirmLabel="Delete"
        loading={
          confirmDeleteVehicle != null &&
          workingVehicleId === confirmDeleteVehicle.id
        }
        onCancel={() => setConfirmDeleteVehicle(null)}
        onConfirm={() => {
          void deleteVehicle();
        }}
      />
    </div>
  );
}
