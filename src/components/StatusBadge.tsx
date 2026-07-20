import type { CustomerSummary } from "@/lib/derive";

const styles: Record<CustomerSummary["status"], { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  unpaid: { label: "Unpaid", className: "bg-amber-50 text-amber-700 ring-amber-200" },
  overdue: { label: "Overdue", className: "bg-rose-50 text-rose-700 ring-rose-200" },
  none: { label: "No Invoices", className: "bg-slate-50 text-slate-600 ring-slate-200" },
};

export function StatusBadge({ status }: { status: CustomerSummary["status"] }) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}
    >
      {s.label}
    </span>
  );
}