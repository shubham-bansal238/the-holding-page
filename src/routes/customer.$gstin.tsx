import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, Menu, Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteInvoicePayment,
  fetchAllCustomers,
  updateInvoicePayment,
} from "@/services/customerService";
import { fetchAllInvoices } from "@/services/invoiceService";
import { downloadCustomerLedgerPdf } from "@/services/ledgerPdf";
import type {
  CustomerInvoiceRef,
  CustomerPaymentRef,
  InvoiceStatusFilter,
} from "@/lib/types";
import { computeCustomerDetail } from "@/lib/derive";
import { formatCurrency, formatDate } from "@/lib/invoice-utils";
import { isAfterCutoff } from "@/lib/period";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { InvoiceRow } from "@/components/InvoiceRow";
import { ReminderDialog } from "@/components/ReminderDialog";

export const Route = createFileRoute("/customer/$gstin")({
  head: () => ({ meta: [{ title: "Customer · Outstanding Manager" }] }),
  component: CustomerPage,
});

function CustomerPage() {
  const { gstin } = Route.useParams();
  const qc = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: fetchAllCustomers,
  });

  const customers = customersQuery.data ?? {};
  const customer = customers[gstin];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all");
  const [expandedInv, setExpandedInv] = useState<string | null>(null);
  const [reminderFor, setReminderFor] = useState<CustomerInvoiceRef | null>(null);
  const [savingInv, setSavingInv] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (payment: CustomerPaymentRef) => {
      await updateInvoicePayment(gstin, payment.invoiceNumber, payment);
      return payment;
    },
    onMutate: (payment) => setSavingInv(payment.invoiceNumber),
    onSettled: () => setSavingInv(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (invoiceNumber: string) => {
      await deleteInvoicePayment(gstin, invoiceNumber);
      return invoiceNumber;
    },
    onMutate: (invoiceNumber) => setSavingInv(invoiceNumber),
    onSettled: () => setSavingInv(null),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const detail = useMemo(
    () => (customer ? computeCustomerDetail(customer) : null),
    [customer],
  );

  const handleDownloadLedger = async () => {
    if (!customer) return;
    setDownloadingPdf(true);
    try {
      const invoices = await qc.fetchQuery({
        queryKey: ["invoices"],
        queryFn: fetchAllInvoices,
      });
      await downloadCustomerLedgerPdf(customer, invoices);
    } catch (err) {
      console.error("Failed to generate ledger PDF", err);
      alert("Could not generate ledger PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const invoices = useMemo(() => {
    if (!customer) return [] as CustomerInvoiceRef[];
    const arr = Object.values(customer.invoices ?? {}).filter((i) =>
      isAfterCutoff(i.invoiceDate),
    );
    arr.sort((a, b) => (b.invoiceDate ?? "").localeCompare(a.invoiceDate ?? ""));
    const payments = customer.payments ?? {};
    const byStatus = arr.filter((inv) => {
      if (statusFilter === "all") return true;
      const pay = payments[inv.invoiceNumber];
      const s = pay?.status ?? "unpaid";
      return s === statusFilter;
    });
    const q = search.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((i) => i.invoiceNumber.toLowerCase().includes(q));
  }, [customer, search, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        customers={customers}
        period="year"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <div className="border-b border-slate-200 bg-white">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to Customers</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>
        </div>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {customersQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-xl border border-slate-200 bg-white" />
          ) : !customer ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
              Customer not found for GSTIN {gstin}.
            </div>
          ) : (
            <>
              {/* Summary */}
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
                      {customer.details.name || "Unnamed customer"}
                    </h1>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      GSTIN · {customer.details.gstin}
                    </p>
                    {customer.details.address && (
                      <p className="mt-2 max-w-xl text-sm text-slate-600">
                        {customer.details.address}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadLedger}
                    disabled={downloadingPdf}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {downloadingPdf ? "Preparing…" : "Download Account Ledger"}
                    </span>
                    <span className="sm:hidden">
                      {downloadingPdf ? "…" : "Ledger"}
                    </span>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
                  <StatCard
                    label="Total Outstanding"
                    value={formatCurrency(detail?.totalOutstanding ?? 0)}
                    emphasis
                  />
                  <StatCard
                    label="Amount Received"
                    value={formatCurrency(detail?.totalReceived ?? 0)}
                  />
                  <StatCard
                    label="Total Business"
                    value={formatCurrency(detail?.totalBusiness ?? 0)}
                  />
                  <StatCard
                    label="Total Profit"
                    value={formatCurrency(detail?.totalProfit ?? 0)}
                  />
                  <StatCard
                    label="Last Payment"
                    value={detail?.lastPaymentDate ? formatDate(detail.lastPaymentDate) : "—"}
                  />
                </div>
              </section>

              {/* Invoices */}
              <section className="mt-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600">
                    Invoices
                  </h2>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as InvoiceStatusFilter)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none sm:w-auto"
                    >
                      <option value="all">All</option>
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partially Paid</option>
                    </select>
                    <div className="relative w-full sm:w-72">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search invoice number…"
                      className="pl-9"
                    />
                    </div>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  {invoices.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      No invoices match your search.
                    </div>
                  ) : (
                    <>
                      <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 md:grid">
                        <div className="col-span-2">Invoice No.</div>
                        <div className="col-span-2">Amount to Receive</div>
                        <div className="col-span-2">Invoice Date</div>
                        <div className="col-span-2">Month</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                      {invoices.map((inv) => (
                        <InvoiceRow
                          key={inv.invoiceNumber}
                          invoice={inv}
                          payment={customer.payments?.[inv.invoiceNumber]}
                          customerName={customer.details.name}
                          expanded={expandedInv === inv.invoiceNumber}
                          saving={savingInv === inv.invoiceNumber}
                          onToggle={() =>
                            setExpandedInv((cur) =>
                              cur === inv.invoiceNumber ? null : inv.invoiceNumber,
                            )
                          }
                          onSave={(payment) => saveMutation.mutate(payment)}
                          onDelete={() => deleteMutation.mutate(inv.invoiceNumber)}
                          onReminder={() => setReminderFor(inv)}
                        />
                      ))}
                    </>
                  )}
                </div>
              </section>

              <ReminderDialog
                open={!!reminderFor}
                onOpenChange={(v) => !v && setReminderFor(null)}
                customerName={customer.details.name}
                invoiceNumber={reminderFor?.invoiceNumber ?? ""}
                invoiceDate={reminderFor?.invoiceDate ?? ""}
                pendingAmount={
                  reminderFor
                    ? computePending(reminderFor, customer.payments?.[reminderFor.invoiceNumber])
                    : 0
                }
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function computePending(inv: CustomerInvoiceRef, pay: CustomerPaymentRef | undefined): number {
  if (!pay) return inv.invoiceAmount;
  if (pay.status === "paid") return 0;
  const received = (pay.entries ?? []).reduce((s, e) => s + (e.amountReceived || 0), 0);
  const rem = inv.invoiceAmount - received;
  return rem > 0 ? rem : 0;
}

function StatCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        emphasis ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-wider ${
          emphasis ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${emphasis ? "text-white" : "text-slate-900"}`}>
        {value}
      </p>
    </div>
  );
}