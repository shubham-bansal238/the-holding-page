import { Trash2 } from "lucide-react";
import type { CustomerPaymentEntry, PaymentMethod } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cheque", label: "Cheque" },
  { value: "bank-transfer", label: "Bank Transfer" },
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
];

interface Props {
  entry: CustomerPaymentEntry;
  index: number;
  onChange: (patch: Partial<CustomerPaymentEntry>) => void;
  onRemove: () => void;
}

export function PaymentEntryFields({ entry, index, onChange, onRemove }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Payment #{index + 1}
        </p>
        <Button
          type="button"
          onClick={onRemove}
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-slate-500 hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Amount Received">
          <Input
            type="number"
            value={entry.amountReceived || ""}
            onChange={(e) => onChange({ amountReceived: Number(e.target.value) || 0 })}
            placeholder="0"
          />
        </Field>
        <Field label="Payment Date">
          <Input
            type="date"
            value={entry.paymentDate || ""}
            onChange={(e) => onChange({ paymentDate: e.target.value })}
          />
        </Field>
        <Field label="Payment Method">
          <Select
            value={entry.paymentMethod}
            onValueChange={(v) => onChange({ paymentMethod: v as PaymentMethod })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Cheque / Reference No.">
          <Input
            value={entry.chequeOrRef}
            onChange={(e) => onChange({ chequeOrRef: e.target.value })}
            placeholder="—"
          />
        </Field>
        <Field label="Bank Name">
          <Input
            value={entry.bankName}
            onChange={(e) => onChange({ bankName: e.target.value })}
            placeholder="—"
          />
        </Field>
        <Field label="TDS">
          <Input
            type="number"
            value={entry.tds ?? ""}
            onChange={(e) =>
              onChange({ tds: e.target.value === "" ? null : Number(e.target.value) })
            }
            placeholder="0"
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}