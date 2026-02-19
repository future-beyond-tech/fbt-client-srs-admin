import { notFound } from "next/navigation";
import { InvoiceActions } from "@/components/layout/invoice-actions";
import { formatCurrencyINR, formatDateTimeDDMMYYYY } from "@/lib/formatters";
import { getServerSaleDetail } from "@/lib/api/server-sale-detail";

interface InvoicePageProps {
  params: {
    id: string;
  };
}

function getPhotoSrc(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  return `/api/media?src=${encodeURIComponent(normalized)}`;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const sale = await getServerSaleDetail(params.id);

  if (!sale) {
    notFound();
  }

  const customerPhotoSrc = getPhotoSrc(sale.customerPhotoUrl ?? "");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="srs-page-title">Invoice</h2>
          <p className="srs-muted">Bill Number: {sale.billNumber}</p>
        </div>
        <InvoiceActions
          billNumber={sale.billNumber}
          customerName={sale.customerName}
          invoiceElementId="sale-invoice-sheet"
        />
      </div>

      <div
        id="sale-invoice-sheet"
        className="mx-auto max-w-3xl rounded-xl border bg-white p-8 shadow-soft print:max-w-none print:rounded-none print:border-0 print:shadow-none"
      >
        <div className="flex items-start justify-between border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">SRS Vehicle Management System</h1>
            <p className="mt-1 text-sm text-muted-foreground">Dealership Sale Invoice</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-primary">Bill: {sale.billNumber}</p>
            <p className="text-muted-foreground">Date: {formatDateTimeDDMMYYYY(sale.saleDate)}</p>
          </div>
        </div>

        <div className="grid gap-8 py-6 md:grid-cols-2">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Customer</h3>
            <p className="mt-3 text-sm">{sale.customerName}</p>
            <p className="text-sm text-muted-foreground">{sale.phone}</p>
            <p className="mt-1 text-sm text-muted-foreground">{sale.address}</p>
            {customerPhotoSrc ? (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Customer Photo
                </p>
                <div className="mt-2 overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={customerPhotoSrc}
                    alt={`${sale.customerName} photo`}
                    className="h-44 w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            ) : null}
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">Vehicle</h3>
            <p className="mt-3 text-sm">
              {sale.vehicle.brand} {sale.vehicle.model} ({sale.vehicle.year})
            </p>
            <p className="text-sm text-muted-foreground">
              Reg No: {sale.vehicle.registrationNumber}
            </p>
            <p className="text-sm text-muted-foreground">
              Engine: {sale.vehicle.engineNumber}
            </p>
          </section>
        </div>

        <div className="rounded-lg border">
          <div className="grid grid-cols-2 border-b bg-muted/50 px-4 py-2 text-sm font-semibold text-primary">
            <span>Description</span>
            <span className="text-right">Amount</span>
          </div>

          <InvoiceRow label="Vehicle Selling Price" value={sale.vehicle.sellingPrice} />
          <InvoiceRow label="Cash Payment" value={sale.cashAmount} />
          <InvoiceRow label="UPI Payment" value={sale.upiAmount} />
          <InvoiceRow label="Finance Payment" value={sale.financeAmount} />

          <div className="grid grid-cols-2 border-t px-4 py-3 text-sm font-semibold text-primary">
            <span>Total Paid</span>
            <span className="text-right">{formatCurrencyINR(sale.totalPayment)}</span>
          </div>
        </div>

        {sale.financeCompany ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Finance Company: <span className="font-medium text-foreground">{sale.financeCompany}</span>
          </p>
        ) : null}

        <p className="mt-8 border-t pt-4 text-xs text-muted-foreground">
          This is a computer-generated invoice and does not require a signature.
        </p>
      </div>
    </div>
  );
}

function InvoiceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-2 border-b px-4 py-2 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{formatCurrencyINR(value)}</span>
    </div>
  );
}
