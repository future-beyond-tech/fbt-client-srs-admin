"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Purchase } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatCurrencyINR, formatDateDDMMYYYY } from "@/lib/formatters";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function PurchaseDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async (purchaseId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Purchase>(
        `/purchases/${encodeURIComponent(purchaseId)}`,
      );
      setPurchase(data);
    } catch {
      setPurchase(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) void fetchDetail(id);
  }, [id, fetchDetail]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Purchase not found.</p>
        <Link href="/purchases" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Purchases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="srs-page-title">Purchase Details</h2>
          <p className="srs-muted">
            {purchase.brand} {purchase.model} ({purchase.registrationNumber})
          </p>
        </div>

        <Link
          href="/purchases"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          Back to Purchases
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Brand" value={purchase.brand} />
          <InfoRow label="Model" value={purchase.model} />
          <InfoRow label="Year" value={String(purchase.year)} />
          <InfoRow label="Registration No" value={purchase.registrationNumber} />
          <InfoRow label="Chassis No" value={purchase.chassisNumber} />
          <InfoRow label="Engine No" value={purchase.engineNumber} />
          <InfoRow label="Selling Price" value={formatCurrencyINR(purchase.sellingPrice)} />
          <InfoRow label="Purchase Date" value={formatDateDDMMYYYY(purchase.purchaseDate)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Seller &amp; Cost</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Seller Name" value={purchase.sellerName} />
          <InfoRow label="Seller Phone" value={purchase.sellerPhone} />
          <InfoRow label="Seller Address" value={purchase.sellerAddress} />
          <InfoRow label="Buying Cost" value={formatCurrencyINR(purchase.buyingCost)} />
          <InfoRow label="Expense" value={formatCurrencyINR(purchase.expense)} />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
