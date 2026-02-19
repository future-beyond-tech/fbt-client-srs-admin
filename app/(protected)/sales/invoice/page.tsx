import { redirect } from "next/navigation";

interface InvoiceRedirectPageProps {
  searchParams: {
    id?: string;
    saleId?: string;
  };
}

export default function InvoiceRedirectPage({ searchParams }: InvoiceRedirectPageProps) {
  const rawSaleId = searchParams.saleId ?? searchParams.id;
  const saleId = typeof rawSaleId === "string" ? rawSaleId.trim() : "";

  if (saleId) {
    redirect(`/sales/${encodeURIComponent(saleId)}/invoice`);
  }

  redirect("/search");
}
