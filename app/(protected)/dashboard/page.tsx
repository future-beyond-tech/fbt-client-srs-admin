"use client";

import { useEffect, useState } from "react";
import {
  CircleDollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import type { DashboardStats } from "@/lib/types";
import apiClient from "@/lib/api/client";
import { formatCurrencyINR } from "@/lib/formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const statsConfig = [
  {
    key: "totalVehiclesPurchased" as const,
    label: "Total Vehicles Purchased",
    icon: ShoppingCart,
    format: "number" as const,
  },
  {
    key: "totalVehiclesSold" as const,
    label: "Total Vehicles Sold",
    icon: Package,
    format: "number" as const,
  },
  {
    key: "availableVehicles" as const,
    label: "Available Vehicles",
    icon: Warehouse,
    format: "number" as const,
  },
  {
    key: "totalProfit" as const,
    label: "Total Profit",
    icon: CircleDollarSign,
    format: "currency" as const,
  },
  {
    key: "salesThisMonth" as const,
    label: "Sales This Month",
    icon: TrendingUp,
    format: "currency" as const,
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get<DashboardStats>("/dashboard");
        setStats(response.data);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="srs-page-title">Dashboard</h2>
        <p className="srs-muted">Overview of dealership inventory and performance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statsConfig.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.key} className="animate-fade-in hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading || !stats ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <CardTitle className="text-2xl text-primary">
                    {item.format === "currency"
                      ? formatCurrencyINR(stats[item.key])
                      : stats[item.key].toLocaleString("en-IN")}
                  </CardTitle>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
