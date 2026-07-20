import { Link } from "@tanstack/react-router";
import type { CustomerSummary } from "@/lib/derive";
import { formatCurrency, formatDate } from "@/lib/invoice-utils";
import { StatusBadge } from "./StatusBadge";

export function CustomerCard({ summary }: { summary: CustomerSummary }) {
  return (
    <Link
      to="/customer/$gstin"
      params={{ gstin: summary.gstin }}
      className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900">{summary.name}</h3>
          <p className="mt-0.5 truncate font-mono text-xs text-slate-500">{summary.gstin}</p>
        </div>
        <div className="shrink-0">
          <StatusBadge status={summary.status} />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-slate-500">Outstanding</p>
          <p className="mt-1 truncate text-xl font-semibold text-slate-900 sm:text-2xl">
            {formatCurrency(summary.outstanding)}
          </p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Business</p>
          <p className="mt-1 truncate text-sm font-medium text-slate-700">
            {formatCurrency(summary.totalBusiness)}
          </p>
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Total Profit</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-emerald-700">
            {formatCurrency(summary.totalProfit)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-xs">
        <div>
          <p className="text-slate-500">Pending</p>
          <p className="mt-0.5 font-medium text-slate-800">{summary.pendingInvoices}</p>
        </div>
        <div>
          <p className="text-slate-500">Last Invoice</p>
          <p className="mt-0.5 font-medium text-slate-800">{formatDate(summary.lastInvoiceDate)}</p>
        </div>
        <div>
          <p className="text-slate-500">Last Payment</p>
          <p className="mt-0.5 font-medium text-slate-800">
            {summary.lastPaymentDate ? formatDate(summary.lastPaymentDate) : "—"}
          </p>
        </div>
      </div>
    </Link>
  );
}