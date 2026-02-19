import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrencyINR, formatDateTimeDDMMYYYY } from "@/lib/formatters";
import { getServerSaleDetail } from "@/lib/api/server-sale-detail";
import { cn } from "@/lib/utils";

interface SaleDetailPageProps {
  params: {
    id: string;
  };
}

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const sale = await getServerSaleDetail(params.id);

  if (!sale) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="srs-page-title">Sale Details</h2>
          <p className="srs-muted">Bill Number: {sale.billNumber}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/search" className={cn(buttonVariants({ variant: "outline" }))}>
            Back to Search
          </Link>
          <Link
            href={`/sales/${sale.id}/invoice`}
            className={cn(buttonVariants({ variant: "accent" }))}
          >
            Open Invoice
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Customer & Vehicle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InfoRow label="Customer Name" value={sale.customerName} />
          <InfoRow label="Phone" value={sale.phone} />
          <InfoRow label="Address" value={sale.address} />
          <InfoRow
            label="Vehicle"
            value={`${sale.vehicle.brand} ${sale.vehicle.model} (${sale.vehicle.registrationNumber})`}
          />
          <InfoRow label="Sale Date" value={formatDateTimeDDMMYYYY(sale.saleDate)} />
          <InfoRow
            label="Payment Mode"
            value={<Badge variant="secondary">{sale.paymentMode}</Badge>}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Payment Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <AmountRow label="Cash Amount" value={sale.cashAmount} />
          <AmountRow label="UPI Amount" value={sale.upiAmount} />
          <AmountRow label="Finance Amount" value={sale.financeAmount} />
          {sale.financeCompany ? (
            <InfoRow label="Finance Company" value={sale.financeCompany} />
          ) : null}
          <AmountRow label="Total Payment" value={sale.totalPayment} emphasized />
          <AmountRow label="Net Profit" value={sale.profit} emphasized />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function AmountRow({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasized ? "font-semibold text-primary" : "font-medium text-foreground"}>
        {formatCurrencyINR(value)}
      </span>
    </div>
  );
}
