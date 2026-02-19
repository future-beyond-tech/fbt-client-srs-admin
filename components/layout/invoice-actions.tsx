"use client";

import { useState } from "react";
import { Download, Loader2, MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import apiClient from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/error-message";

interface InvoiceActionsProps {
  billNumber: string;
  customerName: string;
  invoiceElementId: string;
}

interface SendInvoiceResponse {
  billNumber: number;
  pdfUrl: string;
  status: string;
}

async function buildInvoicePdf(invoiceElementId: string, fileName: string) {
  const element = document.getElementById(invoiceElementId);

  if (!element) {
    throw new Error("Invoice element not found.");
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const printableHeight = pageHeight - margin * 2;
  let heightLeft = imgHeight;
  let y = margin;

  pdf.addImage(imgData, "JPEG", margin, y, imgWidth, imgHeight, undefined, "FAST");
  heightLeft -= printableHeight;

  while (heightLeft > 0) {
    y = margin - (imgHeight - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, y, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= printableHeight;
  }

  const blob = pdf.output("blob");

  return {
    blob,
    fileName,
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function InvoiceActions({
  billNumber,
  customerName,
  invoiceElementId,
}: InvoiceActionsProps) {
  const { toast } = useToast();
  const [workingAction, setWorkingAction] = useState<"download" | "whatsapp" | null>(null);
  const fileName = `invoice-${billNumber || "sale"}.pdf`;

  const handleDownloadPdf = async () => {
    try {
      setWorkingAction("download");
      const { blob } = await buildInvoicePdf(invoiceElementId, fileName);
      downloadBlob(blob, fileName);
      toast({
        title: "PDF downloaded",
        description: "Invoice PDF downloaded successfully.",
        variant: "success",
      });
    } catch {
      toast({
        title: "PDF generation failed",
        description: "Unable to generate invoice PDF.",
        variant: "error",
      });
    } finally {
      setWorkingAction(null);
    }
  };

  const handleSendViaServer = async () => {
    if (!billNumber) return;
    try {
      setWorkingAction("whatsapp");
      const { data } = await apiClient.post<SendInvoiceResponse>(
        `/sales/${encodeURIComponent(String(billNumber))}/send-invoice`,
      );
      toast({
        title: "Invoice sent",
        description: data.status || "Invoice sent via WhatsApp successfully.",
        variant: "success",
      });
    } catch (error: unknown) {
      const message = getApiErrorMessage(
        error,
        "Failed to send invoice. Check customer phone or try again later.",
      );
      toast({
        title: "Send failed",
        description: message,
        variant: "error",
      });
    } finally {
      setWorkingAction(null);
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      setWorkingAction("whatsapp");
      const { blob } = await buildInvoicePdf(invoiceElementId, fileName);
      const file = new File([blob], fileName, { type: "application/pdf" });
      const shareText = `Invoice ${billNumber} for ${customerName}`;

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: `Invoice ${billNumber}`,
          text: shareText,
          files: [file],
        });
        toast({
          title: "Shared",
          description: "Invoice shared successfully.",
          variant: "success",
        });
        return;
      }

      downloadBlob(blob, fileName);
      window.open(
        `https://wa.me/?text=${encodeURIComponent(
          `${shareText}. PDF downloaded, please attach and send.`,
        )}`,
        "_blank",
        "noopener,noreferrer",
      );
      toast({
        title: "Open WhatsApp",
        description: "PDF downloaded. Attach it in WhatsApp to send.",
        variant: "success",
      });
    } catch {
      toast({
        title: "WhatsApp send failed",
        description: "Unable to prepare invoice PDF for WhatsApp.",
        variant: "error",
      });
    } finally {
      setWorkingAction(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="accent" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print Invoice
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          void handleDownloadPdf();
        }}
        disabled={workingAction !== null}
      >
        {workingAction === "download" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Download PDF
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          void handleSendViaServer();
        }}
        disabled={workingAction !== null}
        title="Send invoice to customer via WhatsApp (server)"
      >
        {workingAction === "whatsapp" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        Send via WhatsApp
      </Button>
    </div>
  );
}
