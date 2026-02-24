// ✅ Made fully responsive (mobile → tablet → desktop) - Functionality untouched
import { notFound } from "next/navigation";
import { InvoiceActions } from "@/components/layout/invoice-actions";
import {
  formatCurrencyINR,
  formatDateDDMMYYYY,
  formatDateTimeDDMMYYYY,
} from "@/lib/formatters";
import { getServerSaleInvoice } from "@/lib/api/server-sale-invoice";
import { getServerDeliveryNoteSettings } from "@/lib/api/server-delivery-note-settings";

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
  const [sale, deliverySettings] = await Promise.all([
    getServerSaleInvoice(params.id),
    getServerDeliveryNoteSettings(),
  ]);

  if (!sale) {
    notFound();
  }

  const shopName = deliverySettings?.shopName || "Shree Raamalingam Sons";
  const shopAddress = deliverySettings?.shopAddress || "";
  const contactNumber = deliverySettings?.contactNumber || "";
  const gstNumber = deliverySettings?.gstNumber || "";
  const logoUrl = deliverySettings?.logoUrl || "";
  const footerText =
    deliverySettings?.footerText ||
    "இந்த பில் கணினி மூலம் தயாரிக்கப்பட்டது. கையொப்பம் தேவையில்லை.";
  const signatureLine = deliverySettings?.signatureLine || "";
  const customerPhotoSrc = getPhotoSrc(sale.customerPhotoUrl ?? "");
  const amountNumber = sale.totalPayment || sale.vehicle.sellingPrice;
  const amountInWords = numberToIndianWords(Math.round(amountNumber));
  const companyHeaderName = "SREE RAMALINGAM SONS";
  const fromName = sale.vehicle.sellerName || shopName;
  const fromAddress = sale.vehicle.sellerAddress || shopAddress || "-";
  const fromPhone = sale.vehicle.sellerPhone || contactNumber;
  const toName = sale.customerName || "-";
  const toAddress = sale.address || "-";
  const toPhone = sale.phone || "-";
  const vehicleRefText = [
    sale.vehicle.registrationNumber,
    sale.vehicle.brand,
    sale.vehicle.model,
    sale.vehicle.colour,
  ]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(" / ");
  const makeValue =
    [sale.vehicle.brand, sale.vehicle.model].map((part) => (part || "").trim()).filter(Boolean).join(" ") ||
    String(sale.vehicle.year || "-");

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="srs-page-title">Delivery Note</h2>
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
        className="mx-auto w-full max-w-3xl rounded-xl border bg-white p-4 shadow-soft sm:p-6 lg:p-8 print:max-w-none print:rounded-none print:border-0 print:shadow-none"
      >
        {/* Top header – arranged like the sample bill */}
        <header className="border-b pb-4">
          {/* Blue company banner */}
          <div className="mb-3 rounded-sm bg-sky-700 px-3 py-2 text-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xl font-extrabold uppercase tracking-wide">
                  {companyHeaderName}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-sky-100">
                  Preferred Two Wheeler Dealer
                </p>
                <p className="text-[10px] uppercase tracking-wide text-sky-100">
                  All Kinds of Two Wheelers Buying & Selling
                </p>
              </div>
              <div className="max-w-[45%] text-right text-[10px] leading-snug text-sky-50">
                {shopAddress ? <p>{shopAddress}</p> : null}
                {contactNumber ? <p>Phone: {contactNumber}</p> : null}
              </div>
            </div>
          </div>

          {/* Bill / Date row */}
          <div className="flex items-start justify-between text-[11px] text-foreground">
            <p>
              <span className="font-semibold">Bill No:</span> {sale.billNumber}
            </p>
            <p>
              <span className="font-semibold">Date:</span> {formatDateDDMMYYYY(sale.saleDate)}
            </p>
          </div>

          {/* Center title + right photo/logo */}
          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="flex-1 text-center">
              <h1 className="text-base font-bold uppercase tracking-wide text-primary">
                Delivery Note
              </h1>
              <p className="text-[11px] font-medium text-muted-foreground">
                Only on Commission Basis
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              {logoUrl ? (
                <div className="overflow-hidden rounded-md border bg-muted/40 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={`${shopName} logo`}
                    className="h-16 w-32 object-contain"
                  />
                </div>
              ) : null}
              {customerPhotoSrc ? (
                <div className="overflow-hidden rounded-md border bg-muted/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={customerPhotoSrc}
                    alt={`${sale.customerName} photo`}
                    className="h-16 w-16 object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* Supporting business details */}
          <div className="mt-2 text-center text-[11px] text-muted-foreground">
            {gstNumber ? <p>GSTIN: {gstNumber}</p> : null}
            <p className="font-semibold text-foreground">{shopName}</p>
          </div>
        </header>

        {/* From / To */}
        <section className="mt-4 grid gap-4 text-[12px] md:grid-cols-2">
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="inline-block bg-yellow-300 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
              From:
            </p>
            <p className="mt-1 font-medium text-foreground">{fromName}</p>
            <p className="text-muted-foreground">{fromAddress}</p>
            {fromPhone ? (
              <p className="mt-1 text-muted-foreground">
                Phone: {fromPhone}
              </p>
            ) : null}
          </div>

          <div className="rounded-md border bg-muted/20 p-3">
            <p className="inline-block bg-yellow-300 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
              To:
            </p>
            <p className="mt-1 font-medium text-foreground">{toName}</p>
            <p className="text-muted-foreground">{toAddress}</p>
            {toPhone ? (
              <p className="mt-1 text-muted-foreground">Phone: {toPhone}</p>
            ) : null}
          </div>
        </section>

        {/* Reference and statement */}
        <section className="mt-4 space-y-3 text-[12px] leading-relaxed">
          <p className="text-[12px]">Sir,</p>
          <p className="rounded bg-yellow-200 px-2 py-1 text-[12px]">
            <span className="font-semibold text-primary">Ref:</span>{" "}
            <span className="font-semibold text-foreground">
              {vehicleRefText || "-"}
            </span>
          </p>
          <p>
            I have this day purchased the above vehicle from you for the sum of{" "}
            <span className="font-semibold text-foreground">
              Rs. {formatCurrencyINR(amountNumber).replace("₹", "")}
            </span>{" "}
            (Rupees in Words:{" "}
            <span className="font-semibold text-foreground">{amountInWords} only</span>) and I have
            taken the delivery of the said vehicle to my entire satisfaction.
          </p>
          <p>
            The entire risk is being borne by me / us from this time{" "}
            <span className="font-semibold text-foreground">
              {formatDateTimeDDMMYYYY(sale.saleDate)}
            </span>
            .
          </p>
        </section>

        {/* Vehicle & payment details */}
        <section className="mt-5 grid gap-4 text-[12px] md:grid-cols-2">
          <div className="rounded-md border">
            <div className="border-b bg-muted/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
              Vehicle Details
            </div>
            <div className="divide-y text-[12px]">
              <DetailRow label="Make" value={makeValue} />
              <DetailRow label="Chase No" value={sale.vehicle.chassisNumber || "-"} />
              <DetailRow label="Engine No" value={sale.vehicle.engineNumber || "-"} />
              <DetailRow label="EMI / Tenure" value="-" />
              <DetailRow label="Exchange Of" value="-" />
            </div>
          </div>

          <div className="rounded-md border">
            <div className="border-b bg-muted/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
              Payment Details
            </div>
            <div className="divide-y text-[12px]">
              <DetailRow
                label="1) Payment Type"
                value={`${formatCurrencyINR(amountNumber).replace("₹", "")} / ${sale.paymentMode}`}
              />
              <DetailRow label="2) Payment Type" value="/" />
              <DetailRow label="Exchange Amount" value="-" />
              <DetailRow label="Balance" value="-" />
              <DetailRow label="Finance" value={sale.financeCompany || "-"} />
              <DetailRow label="Bank Name" value="-" />
            </div>
          </div>
        </section>

        {/* Footer / signatures */}
        <section className="mt-8 border-t pt-4 text-[11px]">
          {/* Tamil bullet points exactly like the sample */}
          <ul className="space-y-1 text-[11px] leading-relaxed text-red-700">
            <li>☑ இந்த வண்டியை எந்தவொரு தவறுகளும் இன்றி வாங்க சம்மதிக்கிறேன்.</li>
            <li>☑ இந்த வண்டியில் ரிப்பெயர் செலவு ஏதேனும் வந்தாலும் நிர்வாகம் பொறுப்பல்ல.</li>
            <li>
              ☑ வண்டியில் ஏதேனும் சேதம் அல்லது எந்தவித காரணத்தால் கோளாறு ஏற்பட்டாலும் இதற்குப் தொடர்பு
              கொண்டவர்கள் பொறுப்பல்ல.
            </li>
            <li>☑ வண்டி வாங்கிய 15 நாட்களுக்குள் பெயர் மாற்றிக் கொள்ள வேண்டும்.</li>
          </ul>

          <p className="mt-4 text-muted-foreground">{footerText}</p>
          {signatureLine ? (
            <p className="mt-2 text-right font-medium text-foreground">{signatureLine}</p>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="text-left">
              <div className="h-8 border-b border-dashed" />
              <p className="mt-1 text-[11px] text-muted-foreground">Signature of Dealer</p>
            </div>
            <div className="text-right">
              <div className="h-8 border-b border-dashed" />
              <p className="mt-1 text-[11px] text-muted-foreground">Signature of Buyer</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.2fr)] items-start gap-2 px-3 py-1.5 last:border-b-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] font-medium text-foreground">{value}</span>
    </div>
  );
}

// Simple converter for amounts into Indian-style words (up to crores)
function numberToIndianWords(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "Zero Rupees";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function twoDigits(num: number): string {
    if (num < 20) return ones[num];
    const t = Math.floor(num / 10);
    const o = num % 10;
    return `${tens[t]}${o ? " " + ones[o] : ""}`;
  }

  function threeDigits(num: number): string {
    const h = Math.floor(num / 100);
    const rest = num % 100;
    const hPart = h ? `${ones[h]} Hundred` : "";
    const restPart = rest ? twoDigits(rest) : "";
    if (hPart && restPart) return `${hPart} ${restPart}`;
    return hPart || restPart || "";
  }

  const crore = Math.floor(amount / 10000000);
  amount %= 10000000;
  const lakh = Math.floor(amount / 100000);
  amount %= 100000;
  const thousand = Math.floor(amount / 1000);
  amount %= 1000;
  const hundred = amount;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  return `${parts.join(" ")} Rupees`;
}
