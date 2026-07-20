import { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/invoice-utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  pendingAmount: number;
}

export function ReminderDialog({
  open,
  onOpenChange,
  customerName,
  invoiceNumber,
  invoiceDate,
  pendingAmount,
}: Props) {
  const [copied, setCopied] = useState(false);

  const message =
    `Dear ${customerName || "Customer"},\n\n` +
    `This is a gentle reminder that invoice ${invoiceNumber} dated ${formatDate(invoiceDate)} ` +
    `has an outstanding balance of ${formatCurrency(pendingAmount)}.\n\n` +
    `Kindly arrange the payment at your earliest convenience. If the payment has already been made, ` +
    `please share the payment details so we can update our records.\n\n` +
    `Thank you for your business.`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:w-full">
        <DialogHeader>
          <DialogTitle>Payment Reminder</DialogTitle>
          <DialogDescription>Copy the message and share it with the customer.</DialogDescription>
        </DialogHeader>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          {message}
        </pre>
        <DialogFooter>
          <Button onClick={handleCopy} variant="default">
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}