import type {
  CustomerDoc,
  CustomerInvoiceRef,
  CustomerPaymentEntry,
  CustomerPaymentRef,
  DashboardPeriod,
  StatusFilter,
} from "./types";
import { invoiceInPeriod, isAfterCutoff } from "./period";

export function invoiceOutstanding(inv: CustomerInvoiceRef, pay?: CustomerPaymentRef): number {
  const received = sumEntries(pay?.entries);
  if (!pay) return inv.invoiceAmount;
  if (pay.status === "paid") return 0;
  if (pay.status === "unpaid" && received === 0) return inv.invoiceAmount;
  const remaining = inv.invoiceAmount - received;
  return remaining > 0 ? remaining : 0;
}

export function sumEntries(entries: CustomerPaymentEntry[] | undefined): number {
  if (!entries?.length) return 0;
  return entries.reduce((s, e) => s + (Number(e.amountReceived) || 0), 0);
}

export function invoiceReceived(inv: CustomerInvoiceRef, pay?: CustomerPaymentRef): number {
  if (!pay) return 0;
  if (pay.status === "paid" && !pay.entries?.length) return inv.invoiceAmount;
  return sumEntries(pay.entries);
}

export function isOverdue(inv: CustomerInvoiceRef, creditDays: number | null): boolean {
  if (!inv.invoiceDate || !creditDays) return false;
  const d = new Date(inv.invoiceDate);
  if (isNaN(d.getTime())) return false;
  const due = new Date(d);
  due.setDate(due.getDate() + creditDays);
  return due.getTime() < Date.now();
}

export interface CustomerSummary {
  gstin: string;
  name: string;
  outstanding: number;
  amountCollected: number;
  totalBusiness: number;
  totalBusinessPreGst: number;
  totalProfit: number;
  pendingInvoices: number;
  paidInvoices: number;
  invoiceCount: number;
  lastInvoiceDate: string;
  lastPaymentDate: string;
  status: "paid" | "overdue" | "unpaid" | "none";
}


export function summarizeCustomer(
  c: CustomerDoc,
  period: DashboardPeriod,
): CustomerSummary {
  const allInvs = Object.values(c.invoices ?? {});
  const invs = allInvs.filter((i) => invoiceInPeriod(i.invoiceDate, period));
  const payments = c.payments ?? {};
  let outstanding = 0;
  let amountCollected = 0;
  let totalBusiness = 0;
  let totalBusinessPreGst = 0;
  let totalProfit = 0;
  let pending = 0;
  let paid = 0;
  let latestPaymentDate = "";
  let overdueFlag = false;

  for (const inv of invs) {
    const amt = inv.invoiceAmount || 0;
    const pre = preGstAmount(amt, inv.gstRate);
    totalBusiness += amt;
    totalBusinessPreGst += pre;
    const pay = payments[inv.invoiceNumber];
    const out = invoiceOutstanding(inv, pay);
    outstanding += out;
    amountCollected += amt - out;
    if (out > 0) pending++;
    else paid++;
    if (pay?.rmCost !== null && pay?.rmCost !== undefined) {
      totalProfit += pre - pay.rmCost;
    }
    for (const e of pay?.entries ?? []) {
      if (e.paymentDate && e.paymentDate > latestPaymentDate) latestPaymentDate = e.paymentDate;
    }
    for (const d of pay?.paymentDates ?? []) {
      if (d && d > latestPaymentDate) latestPaymentDate = d;
    }
    if (out > 0 && isOverdue(inv, c.details.creditDays)) overdueFlag = true;
  }

  const lastInvoiceDate = invs.reduce(
    (acc, i) => (i.invoiceDate > acc ? i.invoiceDate : acc),
    "",
  );

  let status: CustomerSummary["status"] = "none";
  if (invs.length === 0) status = "none";
  else if (outstanding === 0) status = "paid";
  else if (overdueFlag) status = "overdue";
  else status = "unpaid";

  return {
    gstin: c.details.gstin,
    name: c.details.name || "Unnamed customer",
    outstanding,
    amountCollected: Math.round(amountCollected * 100) / 100,
    totalBusiness,
    totalBusinessPreGst: Math.round(totalBusinessPreGst * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    pendingInvoices: pending,
    paidInvoices: paid,
    invoiceCount: invs.length,
    lastInvoiceDate,
    lastPaymentDate: latestPaymentDate,
    status,
  };
}

export interface GlobalSummary {
  totalOutstanding: number;
  amountCollected: number;
  totalSales: number;
  totalSalesPreGst: number;
  totalProfit: number;
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
}

export function buildGlobalSummary(
  customers: Record<string, CustomerDoc>,
  period: DashboardPeriod,
): GlobalSummary {
  const summaries = Object.values(customers).map((c) => summarizeCustomer(c, period));
  let totalOutstanding = 0;
  let amountCollected = 0;
  let totalSales = 0;
  let totalSalesPreGst = 0;
  let totalProfit = 0;
  let totalInvoices = 0;
  let pending = 0;
  let paid = 0;

  for (const s of summaries) {
    totalOutstanding += s.outstanding;
    amountCollected += s.amountCollected;
    totalSales += s.totalBusiness;
    totalSalesPreGst += s.totalBusinessPreGst;
    totalProfit += s.totalProfit;
    totalInvoices += s.invoiceCount;
    pending += s.pendingInvoices;
    paid += s.paidInvoices;
  }

  return {
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    amountCollected: Math.round(amountCollected * 100) / 100,
    totalSales: Math.round(totalSales * 100) / 100,
    totalSalesPreGst: Math.round(totalSalesPreGst * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalInvoices,
    pendingInvoices: pending,
    paidInvoices: paid,
  };
}

export function matchesStatus(s: CustomerSummary, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "paid") return s.status === "paid";
  if (filter === "overdue") return s.status === "overdue";
  if (filter === "unpaid") return s.outstanding > 0;
  if (filter === "partial") return false; // Phase 2
  return true;
}

export interface CustomerDetail {
  totalOutstanding: number;
  totalReceived: number;
  totalBusiness: number;
  totalBusinessPreGst: number;
  totalProfit: number;
  lastPaymentDate: string;
}

export function computeCustomerDetail(c: CustomerDoc): CustomerDetail {
  let totalOutstanding = 0;
  let totalReceived = 0;
  let totalBusiness = 0;
  let totalBusinessPreGst = 0;
  let totalProfit = 0;
  let lastPaymentDate = "";
  const payments = c.payments ?? {};

  for (const inv of Object.values(c.invoices ?? {})) {
    if (!isAfterCutoff(inv.invoiceDate)) continue;
    totalBusiness += inv.invoiceAmount || 0;
    const pre = preGstAmount(inv.invoiceAmount || 0);
    totalBusinessPreGst += pre;
    const pay = payments[inv.invoiceNumber];
    totalOutstanding += invoiceOutstanding(inv, pay);
    totalReceived += invoiceReceived(inv, pay);
    if (pay?.rmCost !== null && pay?.rmCost !== undefined) {
      totalProfit += pre - pay.rmCost;
    }
    for (const d of pay?.paymentDates ?? []) {
      if (d && d > lastPaymentDate) lastPaymentDate = d;
    }
  }
  return {
    totalOutstanding,
    totalReceived,
    totalBusiness,
    totalBusinessPreGst: Math.round(totalBusinessPreGst * 100) / 100,
    totalProfit,
    lastPaymentDate,
  };
}

export function preGstAmount(invoiceAmount: number, gstRate = 18): number {
  if (!invoiceAmount) return 0;
  return Math.round((invoiceAmount / (1 + gstRate / 100)) * 100) / 100;
}