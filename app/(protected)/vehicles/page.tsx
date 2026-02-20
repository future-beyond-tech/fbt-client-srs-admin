"use client";

import { useEffect, useState } from "react";
import type { Vehicle } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatCurrencyINR } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function VehiclesPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = showAvailableOnly ? "/vehicles/available" : "/vehicles";
        const response = await apiClient.get<Vehicle[]>(endpoint);
        setRows(response.data);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [showAvailableOnly]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="srs-page-title">Vehicles</h2>
          <p className="srs-muted">Track all vehicles and current availability status.</p>
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
          {/* Mobile/tablet: card list */}
          <div className="space-y-3 p-4 md:hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-lg border bg-muted/30 p-4">
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : rows.length ? (
              rows.map((vehicle) => (
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
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {formatCurrencyINR(vehicle.sellingPrice)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No vehicles found.
              </p>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Reg No</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={idx}>
                      {Array.from({ length: 6 }).map((__, cellIdx) => (
                        <TableCell key={cellIdx}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length ? (
                  rows.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.brand}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>{vehicle.registrationNumber}</TableCell>
                      <TableCell>{formatCurrencyINR(vehicle.sellingPrice)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={vehicle.status === "AVAILABLE" ? "success" : "destructive"}
                        >
                          {vehicle.status === "AVAILABLE" ? "Available" : "Sold"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No vehicles found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
