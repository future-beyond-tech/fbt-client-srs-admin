// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Customer } from "@/lib/types";
import {
  createCustomer,
  getCustomerById,
  getCustomers,
  searchCustomersByPhone,
} from "@/lib/api/customers";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimeDDMMYYYY } from "@/lib/formatters";

export default function CustomersPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [rows, setRows] = useState<Customer[]>([]);
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [serverError, setServerError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const query = searchPhone.trim();

    if (!query) {
      void loadCustomers();
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const data = await searchCustomersByPhone(query);
        setRows(data);
      } catch {
        setRows([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchPhone, loadCustomers]);

  const selectCustomer = async (customerId: string) => {
    setLoadingSelected(true);
    try {
      const data = await getCustomerById(customerId);
      setSelectedCustomer(data);
    } finally {
      setLoadingSelected(false);
    }
  };

  const addCustomer = async () => {
    setServerError("");
    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();

    if (!normalizedName || !normalizedPhone) {
      setServerError("Name and phone are required.");
      return;
    }

    setCreating(true);
    try {
      const created = await createCustomer({
        name: normalizedName,
        phone: normalizedPhone,
        address: address.trim() || null,
      });
      setRows((prev) => [created, ...prev]);
      setSelectedCustomer(created);
      setName("");
      setPhone("");
      setAddress("");
      toast({
        title: "Customer created",
        description: "Customer added successfully.",
        variant: "success",
      });
    } catch (error: unknown) {
      setServerError(getApiErrorMessage(error, "Failed to create customer."));
    } finally {
      setCreating(false);
    }
  };

  const listContent = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (!rows.length) {
      return <p className="text-sm text-muted-foreground">No customers found.</p>;
    }

    return (
      <div className="space-y-2">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => {
              void selectCustomer(row.id);
            }}
            className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/30"
          >
            <p className="font-medium text-primary">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.phone}</p>
          </button>
        ))}
      </div>
    );
  }, [loading, rows]);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h2 className="srs-page-title">Customers</h2>
        <p className="srs-muted">Manage customer records and phone search.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-primary">Customer List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="searchPhone">Search by phone</Label>
              <Input
                id="searchPhone"
                value={searchPhone}
                onChange={(event) => setSearchPhone(event.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            {listContent}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Customer Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSelected ? (
              <Skeleton className="h-28 w-full" />
            ) : selectedCustomer ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="font-medium">{selectedCustomer.name}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-medium">{selectedCustomer.phone}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Address: </span>
                  <span className="font-medium">{selectedCustomer.address || "—"}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Created: </span>
                  <span className="font-medium">
                    {formatDateTimeDDMMYYYY(selectedCustomer.createdAt)}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a customer to view details.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Create Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
            <div>
              <Label htmlFor="customerName">Name</Label>
              <Input
                id="customerName"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="customerAddress">Address</Label>
            <Textarea
              id="customerAddress"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </div>

          <FormError message={serverError} />

          <Button
            type="button"
            onClick={() => {
              void addCustomer();
            }}
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Customer"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
