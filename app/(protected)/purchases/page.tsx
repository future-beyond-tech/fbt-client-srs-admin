"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Purchase } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatCurrencyINR, formatDateDDMMYYYY } from "@/lib/formatters";
import { buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

export default function PurchasesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<Purchase[]>("/purchases");
        setRows(response.data);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="srs-page-title">Purchases</h2>
          <p className="srs-muted">Manage all purchased vehicles.</p>
        </div>

        <Link
          href="/purchases/new"
          className={cn(buttonVariants({ variant: "accent" }), "w-full sm:w-auto")}
        >
          <Plus className="h-4 w-4" />
          Add Purchase
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Reg No</TableHead>
                <TableHead>Buying Cost</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Seller Name</TableHead>
                <TableHead>Purchase Date</TableHead>
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
                rows.map((purchase) => (
                  <TableRow
                    key={purchase.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/purchases/${purchase.id}`)}
                  >
                    <TableCell>{purchase.brand}</TableCell>
                    <TableCell>{purchase.model}</TableCell>
                    <TableCell>{purchase.year}</TableCell>
                    <TableCell>{purchase.registrationNumber}</TableCell>
                    <TableCell>{formatCurrencyINR(purchase.buyingCost)}</TableCell>
                    <TableCell>{formatCurrencyINR(purchase.sellingPrice)}</TableCell>
                    <TableCell>{purchase.sellerName}</TableCell>
                    <TableCell>{formatDateDDMMYYYY(purchase.purchaseDate)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    No purchases found.
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
