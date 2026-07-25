import type { RawInvoice, CustomerInvoiceRef } from "./types";

export function computeInvoiceAmount(inv: RawInvoice): number {
  // Total = (sum of product amounts + freight) + 18% GST.
  const products = inv.products ?? [];
  const productsTotal = products.reduce((sum, p) => {
    if (typeof p.total === "number") return sum + p.total;
    if (typeof p.amount === "number") return sum + p.amount;
    const qty = p.qty ?? p.quantity ?? 0;
    const rate = p.rate ?? p.price ?? 0;
    return sum + qty * rate;
  }, 0);

  const freight =
    (typeof inv.freight === "number" ? inv.freight : undefined) ??
    (typeof inv.freightCharges === "number" ? inv.freightCharges : 0);

  const subtotal = productsTotal + (freight || 0);
  if (subtotal > 0) {
    const gstRate = typeof inv.gstRate === "number" ? inv.gstRate : 18;
    return Math.round(subtotal * (1 + gstRate / 100) * 100) / 100;
  }

  // Fallback to explicit totals only when no line items are available.
  const explicit = inv.grandTotal ?? inv.totalAmount ?? inv.amount;
  if (typeof explicit === "number" && !isNaN(explicit)) return explicit;
  return 0;
}

export function extractMonth(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function toCustomerInvoiceRef(inv: RawInvoice): CustomerInvoiceRef {
  const invoiceDate = inv.invoiceDate ?? "";
  return {
    invoiceNumber: inv.invoiceNumber ?? inv.id,
    invoiceAmount: computeInvoiceAmount(inv),
    invoiceDate,
    month: extractMonth(invoiceDate),
    gstRate: typeof inv.gstRate === "number" ? inv.gstRate : undefined,
  };
}

export function formatCurrency(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}