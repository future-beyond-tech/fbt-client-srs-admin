// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatDateDDMMYYYY } from "@/lib/formatters";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useToast } from "@/components/providers/toast-provider";
import { Card, CardContent } from "@/components/ui/card";
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

export default function SearchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<SearchResult[]>("/search", {
          params: { q: query },
        });
        const data = response.data;
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setRows([]);
        const message = getApiErrorMessage(err, "Search failed. Please try again.");
        setError(message);
        toast({ title: "Search failed", description: message, variant: "error" });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, toast]);

  const handleRowClick = (row: SearchResult) => {
    const type = row.type ?? "Sale";
    const billNumber = String(row.billNumber);
    if (type === "ManualBill") {
      router.push(`/manual-billing?billNumber=${encodeURIComponent(billNumber)}`);
    } else {
      router.push(`/sales/${billNumber}`);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h2 className="srs-page-title">Search Bills</h2>
        <p className="srs-muted">
          Find sales and manual bills by bill number, customer, phone, or vehicle.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-5 md:p-6 lg:p-6">
          <Input
            placeholder="Search by bill number, customer, phone, vehicle..."
            className="min-h-touch"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          {/* Mobile/tablet: card list */}
          <div className="space-y-3 md:hidden">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-lg border bg-muted/30 p-4">
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : rows.length ? (
              rows.map((row, idx) => (
                <button
                  type="button"
                  key={`${row.type ?? "Sale"}-${row.billNumber}-${idx}`}
                  className="w-full rounded-lg border bg-card p-4 text-left shadow-sm transition-colors active:bg-muted/50"
                  onClick={() => handleRowClick(row)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary">
                      Bill #{row.billNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {row.type === "ManualBill" ? "Manual" : "Sale"} · {formatDateDDMMYYYY(row.saleDate)}
                    </span>
                  </div>
                  <div className="mt-1 font-medium">{row.customerName}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {row.vehicle || row.registrationNumber
                      ? `${row.vehicle || "—"}${row.registrationNumber ? ` · ${row.registrationNumber}` : ""}`
                      : "Manual bill"}
                  </div>
                  {row.customerPhone ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {row.customerPhone}
                    </div>
                  ) : null}
                </button>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No matching records found.
              </p>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Vehicle / Item</TableHead>
                  <TableHead>Reg No</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      {Array.from({ length: 7 }).map((__, cellIdx) => (
                        <TableCell key={cellIdx}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length ? (
                  rows.map((row, idx) => (
                    <TableRow
                      key={`${row.type ?? "Sale"}-${row.billNumber}-${idx}`}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(row)}
                    >
                      <TableCell>{row.billNumber}</TableCell>
                      <TableCell>{row.type === "ManualBill" ? "Manual" : "Sale"}</TableCell>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>{row.customerPhone}</TableCell>
                      <TableCell>{row.vehicle || "—"}</TableCell>
                      <TableCell>{row.registrationNumber || "—"}</TableCell>
                      <TableCell>{formatDateDDMMYYYY(row.saleDate)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No matching records found.
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
