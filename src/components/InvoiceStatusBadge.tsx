import type { CustomerPaymentRef } from "@/lib/types";

const styles: Record<CustomerPaymentRef["status"], { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  partial: { label: "Partially Paid", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  unpaid: { label: "Pending", className: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export function InvoiceStatusBadge({ status }: { status: CustomerPaymentRef["status"] }) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}
    >
      {s.label}
    </span>
  );
}