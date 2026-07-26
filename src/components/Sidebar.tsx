import { useMemo } from "react";
import type { CustomerDoc, DashboardPeriod } from "@/lib/types";
import { buildGlobalSummary } from "@/lib/derive";
import { formatCurrency } from "@/lib/invoice-utils";
import { PERIOD_LABELS } from "@/lib/period";
import { LogOut, X, ArrowLeftRight } from "lucide-react";
import {
  allowedCompaniesFor,
  clearSession,
  getCompany,
  readSession,
  writeSession,
} from "@/lib/firebase";

export function Sidebar({
  customers,
  period,
  open = false,
  onClose,
}: {
  customers: Record<string, CustomerDoc>;
  period: DashboardPeriod;
  open?: boolean;
  onClose?: () => void;
}) {
  const summary = useMemo(() => buildGlobalSummary(customers, period), [customers, period]);
  const session = readSession();
  const activeCompany = session?.company ? getCompany(session.company) : null;
  const canSwitch =
    session && allowedCompaniesFor(session.code).length > 1;

  function handleLogout() {
    clearSession();
    window.location.replace("/login");
  }

  function handleChangeModule() {
    if (!session) return;
    writeSession({ code: session.code, company: null, module: null });
    window.location.replace("/select-module");
  }

  function handleSwitch() {
    if (!session) return;
    writeSession({ code: session.code, company: null, module: "outstanding" });
    window.location.replace("/select-company");
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85%] flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-out lg:z-20 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Accounts Receivable
          </p>
          <p className="text-sm font-semibold text-slate-900">Outstanding Manager</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Outstanding Summary
          </h2>

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs text-slate-500">Total Outstanding</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(summary.totalOutstanding)}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs text-slate-500">Period</p>
            <p className="mt-1 text-sm font-medium text-slate-800">{PERIOD_LABELS[period]}</p>
          </div>

          <dl className="mt-4 space-y-3">
            <Row label="Amount Collected" value={formatCurrency(summary.amountCollected)} />
            <Row label="Total Sales" value={formatCurrency(summary.totalSales)} />
            <Row label="Business Done (Pre-GST)" value={formatCurrency(summary.totalSalesPreGst)} />
            <Row
              label="Total Profit"
              value={formatCurrency(summary.totalProfit)}
              valueClass="text-emerald-700"
            />
          </dl>
        </section>

        <div className="my-6 h-px bg-slate-200" />

        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Invoice Summary
          </h2>
          <dl className="mt-3 space-y-3">
            <Row label="Total Invoices" value={summary.totalInvoices.toString()} />
            <Row label="Pending" value={summary.pendingInvoices.toString()} />
            <Row label="Paid" value={summary.paidInvoices.toString()} />
          </dl>
        </section>
      </div>

      <div className="border-t border-slate-200 px-6 py-3 text-[11px] text-slate-400">
        {activeCompany ? (
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Company</p>
              <p className="text-xs font-medium text-slate-700">{activeCompany.name}</p>
            </div>
            <div className="flex gap-2">
              {canSwitch && (
                <button
                  onClick={handleSwitch}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Switch
                </button>
              )}
              <button
                onClick={handleChangeModule}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Change Module
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        ) : (
          "Phase 1 · Read-only insights"
        )}
      </div>
      </aside>
    </>
  );
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className={`text-sm font-semibold ${valueClass ?? "text-slate-900"}`}>{value}</dd>
    </div>
  );
}