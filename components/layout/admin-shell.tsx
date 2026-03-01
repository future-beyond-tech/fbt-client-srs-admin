// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Car,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  ShoppingBag,
  Tag,
  Users,
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
    href: "/customers",
    label: "Customers",
    icon: Users,
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
    label: "New Sale",
    icon: Tag,
  },
  {
    href: "/sales/list",
    label: "Sales History",
    icon: History,
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
  },
  {
    href: "/manual-billing",
    label: "Manual Billing",
    icon: FileText,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
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
      <div className="flex min-h-touch items-center justify-between border-b px-4 py-3 sm:h-16 sm:px-5">
        <Link
          href="/"
          className="min-w-0 flex-1 transition-opacity duration-200 hover:opacity-90"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Shree Raamalingam Sons
          </p>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-touch min-w-touch md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 sm:space-y-1">
        {navItems.map((item) => {
          const hasChildRoute = navItems.some(
            (other) => other.href !== item.href && other.href.startsWith(`${item.href}/`),
          );
          const active = hasChildRoute
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-touch items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ease-out active:bg-slate-200 sm:py-2.5",
                active
                  ? "bg-primary text-white shadow-soft"
                  : "text-slate-700 hover:bg-slate-100",
              )}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <Button
          type="button"
          variant="destructive"
          className="min-h-touch w-full justify-start"
          onClick={() => setConfirmOpen(true)}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">{sidebar}</div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden animate-fade-in-overlay">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 transition-opacity duration-200 ease-out"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute inset-y-0 left-0 w-[min(280px,85vw)] max-w-[280px] shadow-xl animate-slide-in-left">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur transition-shadow duration-200 supports-[backdrop-filter]:bg-white/90">
          <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-2 sm:min-h-16 sm:px-4 md:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-touch min-w-touch shrink-0 lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Link
                href="/"
                className="min-w-0 flex-1 transition-opacity duration-200 hover:opacity-90"
              >
                <h1 className="truncate text-sm font-semibold text-primary sm:text-base">
                  Shree Raamalingam Sons
                </h1>
                <p className="hidden truncate text-xs text-muted-foreground xs:block sm:block">
                  Dealership Administration
                </p>
              </Link>
            </div>
            <div className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 sm:px-3">
              Admin
            </div>
          </div>
        </header>

        <main className="srs-container py-4 sm:py-6 lg:py-8 transition-opacity duration-200 ease-out">
          {children}
        </main>
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
