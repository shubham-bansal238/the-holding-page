import type { DashboardPeriod } from "./types";

// Sync/reporting cutoff. Only invoices on or after this date are considered
// anywhere in the app.
export const CUTOFF_DATE = new Date(2026, 3, 1); // 1 April 2026 (local)

export function isAfterCutoff(dateStr: string | undefined | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getTime() >= CUTOFF_DATE.getTime();
}

function fyStartYear(ref: Date): number {
  return ref.getMonth() >= 3 ? ref.getFullYear() : ref.getFullYear() - 1;
}

function quarterOfFy(ref: Date): 1 | 2 | 3 | 4 {
  const m = ref.getMonth();
  if (m >= 3 && m <= 5) return 1;
  if (m >= 6 && m <= 8) return 2;
  if (m >= 9 && m <= 11) return 3;
  return 4;
}

export interface DateRange {
  start: Date;
  end: Date;
}

function quarterRange(fyStart: number, q: 1 | 2 | 3 | 4): DateRange {
  // Q1: Apr-Jun (fyStart year), Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar (fyStart+1)
  const map: Record<1 | 2 | 3 | 4, [number, number, number, number]> = {
    1: [fyStart, 3, fyStart, 5],
    2: [fyStart, 6, fyStart, 8],
    3: [fyStart, 9, fyStart, 11],
    4: [fyStart + 1, 0, fyStart + 1, 2],
  };
  const [sy, sm, ey, em] = map[q];
  return {
    start: new Date(sy, sm, 1, 0, 0, 0, 0),
    end: new Date(ey, em + 1, 0, 23, 59, 59, 999),
  };
}

export function resolvePeriodRange(
  period: DashboardPeriod,
  ref: Date = new Date(),
): DateRange {
  const fy = fyStartYear(ref);
  switch (period) {
    case "month": {
      const s = new Date(ref.getFullYear(), ref.getMonth(), 1);
      const e = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: s, end: e };
    }
    case "year":
      return {
        start: new Date(fy, 3, 1),
        end: new Date(fy + 1, 2, 31, 23, 59, 59, 999),
      };
    case "q1":
      return quarterRange(fy, 1);
    case "q2":
      return quarterRange(fy, 2);
    case "q3":
      return quarterRange(fy, 3);
    case "q4":
      return quarterRange(fy, 4);
    case "quarter":
      return quarterRange(fy, quarterOfFy(ref));
    case "last-quarter": {
      const q = quarterOfFy(ref);
      if (q === 1) return quarterRange(fy - 1, 4);
      return quarterRange(fy, (q - 1) as 1 | 2 | 3);
    }
  }
}

export function invoiceInPeriod(dateStr: string, period: DashboardPeriod): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  if (d.getTime() < CUTOFF_DATE.getTime()) return false;
  const { start, end } = resolvePeriodRange(period);
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}

export const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  month: "This Month",
  quarter: "This Quarter",
  "last-quarter": "Last Quarter",
  q1: "Quarter 1 (Apr–Jun)",
  q2: "Quarter 2 (Jul–Sep)",
  q3: "Quarter 3 (Oct–Dec)",
  q4: "Quarter 4 (Jan–Mar)",
  year: "This Year",
};