import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  allowedCompaniesFor,
  clearSession,
  readSession,
  writeSession,
  type AppModule,
} from "@/lib/firebase";
import { FileText, ReceiptText } from "lucide-react";

export const Route = createFileRoute("/select-module")({
  head: () => ({
    meta: [
      { title: "Select module" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SelectModulePage,
});

function SelectModulePage() {
  const navigate = useNavigate();
  const session = readSession();

  useEffect(() => {
    if (!session) navigate({ to: "/login" });
  }, [session, navigate]);

  if (!session) return null;

  function pick(mod: AppModule) {
    if (!session) return;
    if (mod === "outstanding") {
      const allowed = allowedCompaniesFor(session.code);
      const autoCompany = allowed.length === 1 ? allowed[0] : null;
      writeSession({ code: session.code, company: autoCompany, module: "outstanding" });
      if (autoCompany) window.location.replace("/");
      else navigate({ to: "/select-company" });
    } else {
      // Invoice module manages company via URL; don't persist it here.
      writeSession({ code: session.code, company: null, module: "invoice" });
      window.location.replace("/invoice");
    }
  }

  function logout() {
    clearSession();
    navigate({ to: "/login" });
  }

  const cards: { id: AppModule; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: "outstanding",
      title: "Outstanding Management System",
      desc: "Track receivables, payments and customer outstandings.",
      icon: <ReceiptText className="h-5 w-5" />,
    },
    {
      id: "invoice",
      title: "Invoice Management System",
      desc: "Create Invoices, Proforma Invoices and Purchase Orders.",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Welcome
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">Choose a module</h1>
            <p className="mt-1 text-sm text-slate-500">
              Select which system you want to work with.
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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