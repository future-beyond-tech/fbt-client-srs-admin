"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatDateDDMMYYYY } from "@/lib/formatters";
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
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<SearchResult[]>("/search", {
          params: {
            q: query,
          },
        });

        setRows(response.data);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="srs-page-title">Search Sales</h2>
        <p className="srs-muted">Find sales by bill number, customer, phone, or vehicle.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 md:p-6">
          <Input
            placeholder="Search by bill number, customer, phone, vehicle, registration number..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Number</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Reg No</TableHead>
                <TableHead>Sale Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    {Array.from({ length: 6 }).map((__, cellIdx) => (
                      <TableCell key={cellIdx}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow
                    key={row.saleId}
                    className="cursor-pointer"
                    onClick={() => router.push(`/sales/${row.saleId}`)}
                  >
                    <TableCell>{row.billNumber}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell>{row.vehicle}</TableCell>
                    <TableCell>{row.registrationNumber}</TableCell>
                    <TableCell>{formatDateDDMMYYYY(row.saleDate)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    No matching records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
