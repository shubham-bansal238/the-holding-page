import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopNavbar } from "@/components/TopNavbar";
import { CustomerCard } from "@/components/CustomerCard";
import { useCustomersData } from "@/hooks/useCustomersData";
import { matchesStatus, summarizeCustomer } from "@/lib/derive";
import type { DashboardPeriod, StatusFilter } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Outstanding Manager · Accounts Receivable" },
      {
        name: "description",
        content:
          "Track outstanding invoices, customer balances, and receivables across your business.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { customersQuery, syncMutation } = useCustomersData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [period, setPeriod] = useState<DashboardPeriod>("year");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const customers = customersQuery.data ?? {};
  const summaries = useMemo(
    () =>
      Object.values(customers)
        .map((c) => summarizeCustomer(c, period))
        .sort((a, b) => b.outstanding - a.outstanding),
    [customers, period],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return summaries.filter((s) => {
      if (s.invoiceCount === 0) return false;
      if (!matchesStatus(s, filter)) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.gstin.toLowerCase().includes(q);
    });
  }, [summaries, search, filter]);

  const loading = customersQuery.isLoading || (syncMutation.isPending && summaries.length === 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        customers={customers}
        period={period}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <TopNavbar
          search={search}
          onSearch={setSearch}
          filter={filter}
          onFilter={setFilter}
          period={period}
          onPeriod={setPeriod}
          onRefresh={() => syncMutation.mutate()}
          refreshing={syncMutation.isPending}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {customersQuery.isError ? (
            <ErrorState message={(customersQuery.error as Error).message} />
          ) : loading ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState hasCustomers={summaries.length > 0} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <CustomerCard key={s.gstin} summary={s} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-44 animate-pulse rounded-xl border border-slate-200 bg-white"
        />
      ))}
    </div>
  );
}

function EmptyState({ hasCustomers }: { hasCustomers: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="text-sm font-medium text-slate-700">
        {hasCustomers ? "No customers match your filters." : "No customers yet."}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {hasCustomers
          ? "Try clearing search or switching to All."
          : "Sync from invoices to generate customers automatically."}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
      Failed to load customers: {message}
    </div>
  );
}
