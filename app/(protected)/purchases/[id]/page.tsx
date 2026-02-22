// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Purchase, PurchaseExpense } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatCurrencyINR, formatDateDDMMYYYY } from "@/lib/formatters";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPurchaseExpense,
  deletePurchaseExpense,
  getPurchaseExpenses,
} from "@/lib/api/purchase-expenses";
import { useToast } from "@/components/providers/toast-provider";
import { getApiErrorMessage } from "@/lib/api/error-message";

export default function PurchaseDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { toast } = useToast();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<PurchaseExpense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [addingExpense, setAddingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | null>(null);
  const [expenseType, setExpenseType] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");

  const fetchExpenses = useCallback(async (purchaseId: string) => {
    setLoadingExpenses(true);
    try {
      const rows = await getPurchaseExpenses(purchaseId);
      setExpenses(rows);
    } catch {
      setExpenses([]);
    } finally {
      setLoadingExpenses(false);
    }
  }, []);

  const fetchDetail = useCallback(async (purchaseId: string) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<Purchase>(
        `/purchases/${encodeURIComponent(purchaseId)}`,
      );
      setPurchase(data);
      void fetchExpenses(purchaseId);
    } catch {
      setPurchase(null);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [fetchExpenses]);

  useEffect(() => {
    if (id) void fetchDetail(id);
  }, [id, fetchDetail]);

  const handleAddExpense = async () => {
    if (!id) {
      return;
    }

    const normalizedType = expenseType.trim();
    const amount = Number(expenseAmount);

    if (!normalizedType) {
      toast({
        title: "Expense type required",
        description: "Enter an expense type before adding.",
        variant: "error",
      });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Expense amount must be greater than zero.",
        variant: "error",
      });
      return;
    }

    setAddingExpense(true);
    try {
      const created = await createPurchaseExpense(id, {
        expenseType: normalizedType,
        amount,
      });
      setExpenses((prev) => [created, ...prev]);
      setExpenseType("");
      setExpenseAmount("");
      toast({
        title: "Expense added",
        description: "Purchase expense added successfully.",
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Unable to add expense",
        description: getApiErrorMessage(error, "Failed to add purchase expense."),
        variant: "error",
      });
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    setDeletingExpenseId(expenseId);
    try {
      await deletePurchaseExpense(expenseId);
      setExpenses((prev) => prev.filter((row) => row.id !== expenseId));
      toast({
        title: "Expense deleted",
        description: "Purchase expense deleted successfully.",
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Unable to delete expense",
        description: getApiErrorMessage(error, "Failed to delete purchase expense."),
        variant: "error",
      });
    } finally {
      setDeletingExpenseId(null);
    }
  };

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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
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
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
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
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
          <InfoRow label="Seller Name" value={purchase.sellerName} />
          <InfoRow label="Seller Phone" value={purchase.sellerPhone} />
          <InfoRow label="Seller Address" value={purchase.sellerAddress} />
          <InfoRow label="Buying Cost" value={formatCurrencyINR(purchase.buyingCost)} />
          <InfoRow label="Expense" value={formatCurrencyINR(purchase.expense)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Additional Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr,180px,auto]">
            <div>
              <Label htmlFor="expenseType">Expense Type</Label>
              <Input
                id="expenseType"
                value={expenseType}
                onChange={(event) => setExpenseType(event.target.value)}
                placeholder="e.g. Painting, Service, Repair"
              />
            </div>
            <div>
              <Label htmlFor="expenseAmount">Amount</Label>
              <Input
                id="expenseAmount"
                type="number"
                min="0"
                step="0.01"
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => {
                  void handleAddExpense();
                }}
                disabled={addingExpense}
                className="w-full md:w-auto"
              >
                {addingExpense ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </div>

          {loadingExpenses ? (
            <Skeleton className="h-20 w-full" />
          ) : expenses.length ? (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{expense.expenseType}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrencyINR(expense.amount)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deletingExpenseId === expense.id}
                    onClick={() => {
                      void handleDeleteExpense(expense.id);
                    }}
                  >
                    {deletingExpenseId === expense.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No additional expenses recorded.</p>
          )}
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
