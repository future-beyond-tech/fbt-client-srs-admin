// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
import { AdminShell } from "@/components/layout/admin-shell";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
