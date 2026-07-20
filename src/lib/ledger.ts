import type { CustomerDoc, Party, RawInvoice } from "./types";
import { isAfterCutoff } from "./period";
import { sumEntries } from "./derive";

export interface LedgerEntry {
  date: string; // ISO
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerData {
  company: Party;
  entries: LedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  outstanding: number;
  totalBusiness: number;
  lastPaymentDate: string;
}

function paymentMethodLabel(m: string | undefined): string {
  switch (m) {
    case "cheque":
      return "Payment (Cheque)";
    case "upi":
      return "Payment (UPI)";
    case "cash":
      return "Payment (Cash)";
    case "bank-transfer":
      return "Payment (Bank Transfer)";
    case "other":
      return "Payment (Other)";
    default:
      return "Payment";
  }
}

export function buildLedger(
  customer: CustomerDoc,
  invoices: RawInvoice[],
): LedgerData {
  const gstin = customer.details.gstin;
  // Pick latest invoice for this customer to source seller/company info.
  const forCustomer = invoices
    .filter(
      (i) =>
        i.consignee?.gstin?.trim() === gstin && isAfterCutoff(i.invoiceDate),
    )
    .sort((a, b) => (b.invoiceDate ?? "").localeCompare(a.invoiceDate ?? ""));
  const company: Party = forCustomer[0]?.seller ?? {};

  const raw: LedgerEntry[] = [];
  let totalBusiness = 0;

  const payments = customer.payments ?? {};
  for (const inv of Object.values(customer.invoices ?? {})) {
    if (!isAfterCutoff(inv.invoiceDate)) continue;
    totalBusiness += inv.invoiceAmount || 0;
    raw.push({
      date: inv.invoiceDate,
      particulars: inv.invoiceNumber,
      debit: inv.invoiceAmount || 0,
      credit: 0,
      balance: 0,
    });

    const pay = payments[inv.invoiceNumber];
    if (pay?.entries?.length) {
      for (const e of pay.entries) {
        if (!e.paymentDate || !isAfterCutoff(e.paymentDate)) continue;
        raw.push({
          date: e.paymentDate,
          particulars: paymentMethodLabel(e.paymentMethod),
          debit: 0,
          credit: Number(e.amountReceived) || 0,
          balance: 0,
        });
      }
    } else if (pay?.status === "paid") {
      // No entries recorded but marked paid — synthesize on invoice date.
      raw.push({
        date: inv.invoiceDate,
        particulars: "Payment",
        debit: 0,
        credit: inv.invoiceAmount || 0,
        balance: 0,
      });
    }
  }

  raw.sort((a, b) => {
    const c = (a.date ?? "").localeCompare(b.date ?? "");
    if (c !== 0) return c;
    // Invoice before payment on the same day.
    return b.debit - a.debit;
  });

  let balance = 0;
  let totalDebit = 0;
  let totalCredit = 0;
  let lastPaymentDate = "";
  for (const entry of raw) {
    balance += entry.debit - entry.credit;
    entry.balance = balance;
    totalDebit += entry.debit;
    totalCredit += entry.credit;
    if (entry.credit > 0 && entry.date > lastPaymentDate) {
      lastPaymentDate = entry.date;
    }
  }

  return {
    company,
    entries: raw,
    totalDebit,
    totalCredit,
    outstanding: balance,
    totalBusiness,
    lastPaymentDate,
  };
}