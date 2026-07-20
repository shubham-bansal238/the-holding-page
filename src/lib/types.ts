export interface InvoiceProduct {
  name?: string;
  description?: string;
  qty?: number;
  quantity?: number;
  rate?: number;
  price?: number;
  amount?: number;
  total?: number;
}

export interface RawInvoice {
  id: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  paymentDueDate?: string;
  paymentTerms?: string;
  buyer?: Party;
  consignee?: Party;
  seller?: Party;
  products?: InvoiceProduct[];
  gstRate?: number;
  totalAmount?: number;
  grandTotal?: number;
  amount?: number;
  freight?: number;
  freightCharges?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Party {
  name?: string;
  gstin?: string;
  address?: string;
}

export interface CustomerInvoiceRef {
  invoiceNumber: string;
  invoiceAmount: number;
  invoiceDate: string;
  month: string; // YYYY-MM
}

export interface CustomerPaymentRef {
  invoiceNumber: string;
  rmCost: number | null;
  status: "unpaid" | "paid" | "partial";
  profit: number | null;
  chequeNos: string[];
  paymentDates: string[];
  bank: string;
  tds: number | null;
  entries?: CustomerPaymentEntry[];
}

export type PaymentMethod = "cash" | "cheque" | "bank-transfer" | "upi" | "other";

export interface CustomerPaymentEntry {
  amountReceived: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  chequeOrRef: string;
  bankName: string;
  tds: number | null;
}

export interface CustomerDetails {
  name: string;
  gstin: string;
  address: string;
  paymentTerms: string;
  creditDays: number | null;
  lastInvoiceDate: string;
  totalBusinessDone: number | null;
  totalOutstanding: number | null;
}

export interface CustomerDoc {
  details: CustomerDetails;
  invoices: Record<string, CustomerInvoiceRef>;
  payments: Record<string, CustomerPaymentRef>;
}

export type PeriodType = "month" | "quarter" | "year";
export type StatusFilter = "all" | "paid" | "unpaid" | "partial" | "overdue";

export type DashboardPeriod =
  | "month"
  | "quarter"
  | "last-quarter"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "year";

export type InvoiceStatusFilter = "all" | "paid" | "unpaid" | "partial";