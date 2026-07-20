import { createFileRoute, useNavigate, useParams, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  COMPANIES,
  allowedCompaniesFor,
  readSession,
  type CompanyId,
} from "@/lib/firebase";
import { Building2, ArrowLeft } from "lucide-react";
import { INVOICE_TYPE_LABELS, isInvoiceType, type InvoiceType } from "@/invoice-management/loaders";

export const Route = createFileRoute("/invoice/$type/")({
  head: ({ params }) => ({
    meta: [
      {
        title: isInvoiceType(params.type)
          ? `${INVOICE_TYPE_LABELS[params.type]} · Select company`
          : "Invoice",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvoiceTypeCompanyPicker,
});

function InvoiceTypeCompanyPicker() {
  const { type } = useParams({ from: "/invoice/$type/" });
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

  // If only one company is allowed, skip this step entirely.
  useEffect(() => {
    if (!session || !isInvoiceType(type)) return;
    if (options.length === 1) {
      navigate({
        to: "/invoice/$type/$company",
        params: { type, company: options[0].id },
        replace: true,
      });
    }
  }, [session, options, type, navigate]);

  if (!session) return null;
  if (!isInvoiceType(type)) {
    throw notFound();
  }

  function pick(id: CompanyId) {
    navigate({ to: "/invoice/$type/$company", params: { type: type as InvoiceType, company: id } });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-3xl">
        <Link
          to="/invoice"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            {INVOICE_TYPE_LABELS[type as InvoiceType]}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Select a company</h1>
          <p className="mt-1 text-sm text-slate-500">
            The correct company-specific form will be loaded.
          </p>
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