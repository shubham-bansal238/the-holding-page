import type { DashboardPeriod, StatusFilter } from "@/lib/types";
import { Menu } from "lucide-react";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partially Paid" },
  { value: "overdue", label: "Overdue" },
];

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "month", label: "This Month" },
  { value: "quarter", label: "This Quarter" },
  { value: "last-quarter", label: "Last Quarter" },
  { value: "q1", label: "Quarter 1 (Apr–Jun)" },
  { value: "q2", label: "Quarter 2 (Jul–Sep)" },
  { value: "q3", label: "Quarter 3 (Oct–Dec)" },
  { value: "q4", label: "Quarter 4 (Jan–Mar)" },
  { value: "year", label: "This Year" },
];

interface Props {
  search: string;
  onSearch: (v: string) => void;
  filter: StatusFilter;
  onFilter: (v: StatusFilter) => void;
  period: DashboardPeriod;
  onPeriod: (v: DashboardPeriod) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onOpenSidebar?: () => void;
}

export function TopNavbar({
  search,
  onSearch,
  filter,
  onFilter,
  period,
  onPeriod,
  onRefresh,
  refreshing,
  onOpenSidebar,
}: Props) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">Customers</h1>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:gap-3 lg:ml-6 lg:justify-start">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none"
            />
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </div>

          <select
            value={filter}
            onChange={(e) => onFilter(e.target.value as StatusFilter)}
            className="hidden shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none sm:block"
          >
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <select
            value={period}
            onChange={(e) => onPeriod(e.target.value as DashboardPeriod)}
            className="hidden shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none md:block"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="hidden shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 lg:inline-flex"
          >
            {refreshing ? "Syncing…" : "Sync"}
          </button>
        </div>
      </div>

      {/* Secondary row: filter + period on small screens */}
      <div className="flex items-center gap-2 border-t border-slate-100 px-4 pb-3 pt-2 sm:px-6 md:hidden">
        <select
          value={filter}
          onChange={(e) => onFilter(e.target.value as StatusFilter)}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none sm:hidden"
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => onPeriod(e.target.value as DashboardPeriod)}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-slate-400 focus:outline-none"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {refreshing ? "…" : "Sync"}
        </button>
      </div>
    </header>
  );
}