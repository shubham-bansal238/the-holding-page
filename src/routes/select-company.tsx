import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  COMPANIES,
  allowedCompaniesFor,
  clearSession,
  readSession,
  writeSession,
  type CompanyId,
} from "@/lib/firebase";
import { Building2 } from "lucide-react";

export const Route = createFileRoute("/select-company")({
  head: () => ({
    meta: [
      { title: "Select company · Outstanding Manager" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SelectCompanyPage,
});

function SelectCompanyPage() {
  const navigate = useNavigate();
  const session = readSession();

  useEffect(() => {
    if (!session) navigate({ to: "/login" });
  }, [session, navigate]);

  const options = useMemo(() => {
    if (!session) return [];
    const allowed = new Set(allowedCompaniesFor(session.code));
    return COMPANIES.filter((c) => allowed.has(c.id));
  }, [session]);

  function pick(id: CompanyId) {
    if (!session) return;
    writeSession({ code: session.code, company: id, module: "outstanding" });
    window.location.replace("/");
  }

  function logout() {
    clearSession();
    navigate({ to: "/login" });
  }

  function switchModule() {
    if (!session) return;
    writeSession({ code: session.code, company: null, module: null });
    navigate({ to: "/select-module" });
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Accounts Receivable
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">Select a company</h1>
            <p className="mt-1 text-sm text-slate-500">
              Choose which company&apos;s data to work with.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={switchModule}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Switch Module
            </button>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {options.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              className="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-900">{c.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Open dashboard for {c.name}
              </p>
              <span className="mt-4 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                Continue →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}