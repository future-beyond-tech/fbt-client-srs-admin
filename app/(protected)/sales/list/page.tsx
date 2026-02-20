"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import type { SalesPageResponse, SaleHistoryItem } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatCurrencyINR, formatDateDDMMYYYY } from "@/lib/formatters";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const DEFAULT_PAGE_SIZE = 10;

export default function SalesListPage() {
  const router = useRouter();
  const [data, setData] = useState<SalesPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        pageNumber,
        pageSize,
      };
      if (searchDebounced.trim()) params.search = searchDebounced.trim();
      if (fromDate.trim()) params.fromDate = `${fromDate.trim()}T00:00:00.000Z`;
      if (toDate.trim()) params.toDate = `${toDate.trim()}T23:59:59.999Z`;
      const response = await apiClient.get<SalesPageResponse>("/sales", { params });
      setData(response.data);
    } catch {
      setData({
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize, searchDebounced, fromDate, toDate]);

  useEffect(() => {
    void fetchSales();
  }, [fetchSales]);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="srs-page-title">Sales History</h2>
          <p className="srs-muted">View and filter all sales with pagination.</p>
        </div>

        <Link
          href="/sales"
          className={cn(buttonVariants({ variant: "accent" }), "w-full sm:w-auto")}
        >
          <Plus className="h-4 w-4" />
          New Sale
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Customer name, vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fromDate">From date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="toDate">To date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill No</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Reg No</TableHead>
                <TableHead className="text-right">Profit</TableHead>
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
              ) : items.length ? (
                items.map((row) => (
                  <TableRow
                    key={String(row.billNumber)}
                    className="cursor-pointer"
                    onClick={() => router.push(`/sales/${row.billNumber}`)}
                  >
                    <TableCell>{row.billNumber}</TableCell>
                    <TableCell>{formatDateDDMMYYYY(row.saleDate)}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>{row.registrationNumber ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium text-primary">
                      {formatCurrencyINR(Number((row as SaleHistoryItem).profit ?? 0))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No sales found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Showing page {pageNumber} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(
                    "rounded border px-3 py-1 text-sm",
                    pageNumber <= 1
                      ? "cursor-not-allowed border-slate-200 text-slate-400"
                      : "border-slate-300 hover:bg-slate-50",
                  )}
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded border px-3 py-1 text-sm",
                    pageNumber >= totalPages
                      ? "cursor-not-allowed border-slate-200 text-slate-400"
                      : "border-slate-300 hover:bg-slate-50",
                  )}
                  disabled={pageNumber >= totalPages}
                  onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
