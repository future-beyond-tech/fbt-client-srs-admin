// ✅ Sales invoice PDF from backend (GET /api/sales/{billNumber}/pdf). No client-side DOM capture.
"use client";

import { useState } from "react";
import { CheckCircle, Download, Loader2, MessageCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import apiClient from "@/lib/api/client";
import { getSalesInvoicePdfBlob, processInvoice } from "@/lib/api/sales";
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
  invoiceElementId: _invoiceElementId,
}: InvoiceActionsProps) {
  const { toast } = useToast();
  const [workingAction, setWorkingAction] = useState<
    "download" | "whatsapp" | "process" | null
  >(null);
  const fileName = `Invoice-${billNumber || "sale"}.pdf`;

  const handleProcessInvoice = async () => {
    if (!billNumber) return;
    try {
      setWorkingAction("process");
      await processInvoice(billNumber);
      toast({
        title: "Invoice processed",
        description: "Invoice marked as processed.",
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Process failed",
        description: getApiErrorMessage(error, "Failed to process invoice."),
        variant: "error",
      });
    } finally {
      setWorkingAction(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!billNumber) return;
    try {
      setWorkingAction("download");
      const blob = await getSalesInvoicePdfBlob(billNumber);
      downloadBlob(blob, fileName);
      toast({
        title: "PDF downloaded",
        description: "Invoice PDF downloaded successfully.",
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "PDF download failed",
        description: getApiErrorMessage(error, "Unable to load invoice PDF from server."),
        variant: "error",
      });
    } finally {
      setWorkingAction(null);
    }
  };

  const handlePrint = () => {
    if (!billNumber) return;
    const path = `/api/sales/${encodeURIComponent(String(billNumber))}/pdf`;
    window.open(path, "_blank", "noopener,noreferrer");
    toast({
      title: "Opening PDF",
      description: "Print from the new tab.",
      variant: "success",
    });
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

  const handleSharePdf = async () => {
    if (!billNumber) return;
    try {
      setWorkingAction("whatsapp");
      const blob = await getSalesInvoicePdfBlob(billNumber);
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
    } catch (error: unknown) {
      toast({
        title: "Share failed",
        description: getApiErrorMessage(
          error,
          "Unable to load invoice PDF from server. Try Download PDF first.",
        ),
        variant: "error",
      });
    } finally {
      setWorkingAction(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <Button
        type="button"
        variant="accent"
        onClick={handlePrint}
        className="min-h-touch"
      >
        <Printer className="h-4 w-4" />
        Print Invoice
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => void handleDownloadPdf()}
        disabled={workingAction !== null}
        className="min-h-touch"
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
        onClick={() => void handleSendViaServer()}
        disabled={workingAction !== null}
        className="min-h-touch"
        title="Send invoice to customer via WhatsApp (server)"
      >
        {workingAction === "whatsapp" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        Send via WhatsApp
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => void handleSharePdf()}
        disabled={workingAction !== null}
        className="min-h-touch"
        title="Share PDF (device share or download + WhatsApp)"
      >
        {workingAction === "whatsapp" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageCircle className="h-4 w-4" />
        )}
        Share PDF
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={() => void handleProcessInvoice()}
        disabled={workingAction !== null}
        title="Mark invoice as processed"
        className="min-h-touch"
      >
        {workingAction === "process" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        Mark as Processed
      </Button>
    </div>
  );
}
