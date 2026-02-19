"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Car,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { clearAuthSession } from "@/lib/auth/storage";
import apiClient from "@/lib/api/client";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/purchases",
    label: "Purchases",
    icon: ShoppingBag,
  },
  {
    href: "/vehicles",
    label: "Vehicles",
    icon: Car,
  },
  {
    href: "/sales",
    label: "Sales",
    icon: Tag,
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
  },
];

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);

    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore API errors and continue local cleanup.
    }

    clearAuthSession();
    setIsLoggingOut(false);
    setConfirmOpen(false);
    router.replace("/login");
    router.refresh();
  };

  const sidebar = (
    <div className="flex h-full flex-col border-r bg-white">
      <div className="flex h-16 items-center justify-between border-b px-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            SRS VMS
          </p>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white shadow-soft"
                  : "text-slate-700 hover:bg-slate-100",
              )}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Button
          type="button"
          variant="destructive"
          className="w-full justify-start"
          onClick={() => setConfirmOpen(true)}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64">{sidebar}</div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      ) : null}

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-base font-semibold text-primary">
                  SRS Vehicle Management System
                </h1>
                <p className="text-xs text-muted-foreground">Dealership Administration</p>
              </div>
            </div>
            <div className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
              Admin
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">{children}</main>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Logout"
        description="Are you sure you want to logout from the admin panel?"
        confirmLabel="Logout"
        loading={isLoggingOut}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={logout}
      />
    </div>
  );
}
