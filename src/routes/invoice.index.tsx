import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { clearSession, readSession, writeSession } from "@/lib/firebase";
import { FileText, FileSignature, ClipboardList, ArrowLeftRight, LogOut } from "lucide-react";
import type { InvoiceType } from "@/invoice-management/loaders";

export const Route = createFileRoute("/invoice/")({
  head: () => ({
    meta: [{ title: "Invoice Management" }, { name: "robots", content: "noindex" }],
  }),
  component: InvoiceHomePage,
});

function InvoiceHomePage() {
  const navigate = useNavigate();

  function pick(type: InvoiceType) {
    navigate({ to: "/invoice/$type", params: { type } });
  }

  function switchModule() {
    const s = readSession();
    if (!s) return;
    writeSession({ code: s.code, company: null, module: null });
    navigate({ to: "/select-module" });
  }

  function logout() {
    clearSession();
    navigate({ to: "/login" });
  }

  const cards: { id: InvoiceType; title: string; desc: string; icon: React.ReactNode }[] = [
    { id: "invoices", title: "Invoices", desc: "Tax invoices", icon: <FileText className="h-5 w-5" /> },
    { id: "pi", title: "PI", desc: "Proforma invoices", icon: <FileSignature className="h-5 w-5" /> },
    { id: "po", title: "PO", desc: "Purchase orders", icon: <ClipboardList className="h-5 w-5" /> },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Invoice Management
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">What do you want to create?</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={switchModule}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <ArrowLeftRight className="h-4 w-4" /> Switch module
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              className="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                {c.icon}
              </div>
              <p className="mt-4 text-base font-semibold text-slate-900">{c.title}</p>
              <p className="mt-1 text-xs text-slate-500">{c.desc}</p>
              <span className="mt-4 text-sm font-medium text-slate-700 group-hover:text-slate-900">
                Open →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}