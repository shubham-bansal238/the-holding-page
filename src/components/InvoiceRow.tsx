import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Bell, Plus, Save, Trash2 } from "lucide-react";
import type {
  CustomerInvoiceRef,
  CustomerPaymentEntry,
  CustomerPaymentRef,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/invoice-utils";
import { invoiceOutstanding, preGstAmount, sumEntries } from "@/lib/derive";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentEntryFields } from "./PaymentEntryFields";

function monthName(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { month: "long" });
}

function makeEmptyEntry(): CustomerPaymentEntry {
  return {
    amountReceived: 0,
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "bank-transfer",
    chequeOrRef: "",
    bankName: "",
    tds: null,
  };
}

function normalizePayment(
  invoiceNumber: string,
  pay: CustomerPaymentRef | undefined,
): CustomerPaymentRef {
  return {
    invoiceNumber,
    rmCost: pay?.rmCost ?? null,
    status: pay?.status ?? "unpaid",
    profit: pay?.profit ?? null,
    chequeNos: pay?.chequeNos ?? [],
    paymentDates: pay?.paymentDates ?? [],
    bank: pay?.bank ?? "",
    tds: pay?.tds ?? null,
    entries: pay?.entries ?? [],
  };
}

interface Props {
  invoice: CustomerInvoiceRef;
  payment: CustomerPaymentRef | undefined;
  customerName: string;
  expanded: boolean;
  saving: boolean;
  onToggle: () => void;
  onSave: (payment: CustomerPaymentRef) => void;
  onDelete: () => void;
  onReminder: () => void;
}

export function InvoiceRow({
  invoice,
  payment,
  expanded,
  saving,
  onToggle,
  onSave,
  onDelete,
  onReminder,
}: Props) {
  const [draft, setDraft] = useState<CustomerPaymentRef>(() =>
    normalizePayment(invoice.invoiceNumber, payment),
  );

  useEffect(() => {
    setDraft(normalizePayment(invoice.invoiceNumber, payment));
  }, [payment, invoice.invoiceNumber]);

  const preGst = useMemo(() => preGstAmount(invoice.invoiceAmount), [invoice.invoiceAmount]);
  const profit = useMemo(() => {
    if (draft.rmCost === null || draft.rmCost === undefined) return null;
    return Math.round((preGst - draft.rmCost) * 100) / 100;
  }, [preGst, draft.rmCost]);

  const totalReceived = sumEntries(draft.entries);
  const rowOutstanding = invoiceOutstanding(invoice, {
    ...draft,
    entries: draft.entries,
  });
  const displayStatus = payment?.status ?? "unpaid";

  const suggestPaid =
    draft.status !== "paid" &&
    totalReceived > 0 &&
    Math.abs(totalReceived - invoice.invoiceAmount) < 1;

  const setStatus = (status: CustomerPaymentRef["status"]) => {
    setDraft((d) => {
      let entries = d.entries ?? [];
      if (status !== "unpaid" && entries.length === 0) entries = [makeEmptyEntry()];
      if (status === "unpaid") entries = [];
      return { ...d, status, entries };
    });
  };

  const patchEntry = (index: number, patch: Partial<CustomerPaymentEntry>) => {
    setDraft((d) => ({
      ...d,
      entries: (d.entries ?? []).map((e, i) => (i === index ? { ...e, ...patch } : e)),
    }));
  };

  const removeEntry = (index: number) => {
    setDraft((d) => ({ ...d, entries: (d.entries ?? []).filter((_, i) => i !== index) }));
  };

  const addEntry = () => {
    setDraft((d) => ({ ...d, entries: [...(d.entries ?? []), makeEmptyEntry()] }));
  };

  const handleSave = () => {
    const entries = draft.entries ?? [];
    const paymentDates = entries.map((e) => e.paymentDate).filter(Boolean);
    const chequeNos = entries.map((e) => e.chequeOrRef).filter(Boolean);
    onSave({ ...draft, profit, entries, paymentDates, chequeNos });
  };

  const handleDelete = () => {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Clear all payment details and RM cost for invoice ${invoice.invoiceNumber}?`,
      )
    ) {
      return;
    }
    onDelete();
  };

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      {/* Row header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-4 text-left transition hover:bg-slate-50 sm:px-5 md:grid md:grid-cols-12 md:items-center md:gap-4"
      >
        {/* Mobile card layout */}
        <div className="md:hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm font-medium text-slate-900">
                {invoice.invoiceNumber}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDate(invoice.invoiceDate)} · {monthName(invoice.invoiceDate)}
              </p>
            </div>
            <div className="shrink-0">
              <InvoiceStatusBadge status={displayStatus} />
            </div>
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Amount to Receive</p>
              <p className="truncate text-lg font-semibold text-slate-900">
                {formatCurrency(rowOutstanding)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onReminder();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onReminder();
                  }
                }}
                className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Bell className="h-3.5 w-3.5" /> Remind
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-400 transition ${expanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>
        </div>

        {/* Desktop grid columns */}
        <div className="hidden md:col-span-2 md:block md:truncate md:font-mono md:text-sm md:font-medium md:text-slate-900">
          {invoice.invoiceNumber}
        </div>
        <div className="hidden md:col-span-2 md:block md:text-sm md:font-semibold md:text-slate-900">
          {formatCurrency(rowOutstanding)}
        </div>
        <div className="hidden md:col-span-2 md:block md:text-sm md:text-slate-700">
          {formatDate(invoice.invoiceDate)}
        </div>
        <div className="hidden md:col-span-2 md:block md:text-sm md:text-slate-700">
          {monthName(invoice.invoiceDate)}
        </div>
        <div className="hidden md:col-span-2 md:block">
          <InvoiceStatusBadge status={displayStatus} />
        </div>
        <div className="hidden md:col-span-2 md:flex md:items-center md:justify-end md:gap-2">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onReminder();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onReminder();
              }
            }}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Bell className="h-3.5 w-3.5" /> Remind
          </span>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-5 sm:px-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Invoice Amount (Pre-GST)" value={formatCurrency(preGst)} />
            <div>
              <Label className="text-xs text-slate-600">RM Cost</Label>
              <Input
                type="number"
                className="mt-1"
                placeholder="0"
                value={draft.rmCost ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    rmCost: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
              />
            </div>
            <Metric
              label="Profit"
              value={profit === null ? "—" : formatCurrency(profit)}
            />
            <div>
              <Label className="text-xs text-slate-600">Payment Status</Label>
              <Select value={draft.status} onValueChange={(v) => setStatus(v as never)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {draft.status !== "unpaid" && (
            <div className="mt-5 space-y-3">
              {(draft.entries ?? []).map((entry, i) => (
                <PaymentEntryFields
                  key={i}
                  entry={entry}
                  index={i}
                  onChange={(patch) => patchEntry(i, patch)}
                  onRemove={() => removeEntry(i)}
                />
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEntry}
                className="w-full gap-1 sm:w-auto"
              >
                <Plus className="h-3.5 w-3.5" /> Add Another Payment
              </Button>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-600">
              {draft.status !== "unpaid" && (
                <>
                  Received: <span className="font-medium text-slate-900">
                    {formatCurrency(totalReceived)}
                  </span>
                  <span className="mx-2 text-slate-300">•</span>
                  Outstanding:{" "}
                  <span className="font-medium text-slate-900">
                    {formatCurrency(rowOutstanding)}
                  </span>
                  {suggestPaid && (
                    <button
                      type="button"
                      onClick={() => setStatus("paid")}
                      className="ml-3 text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
                    >
                      Mark as Paid?
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                size="sm"
                variant="outline"
                className="w-full gap-1 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:w-auto"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                className="w-full gap-1 sm:w-auto"
              >
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-600">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}