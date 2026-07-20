import { createFileRoute, useParams, Link, notFound, useNavigate } from "@tanstack/react-router";
import { Suspense, useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import {
  allowedCompaniesFor,
  getCompany,
  readSession,
  type CompanyId,
} from "@/lib/firebase";
import {
  INVOICE_TYPE_LABELS,
  getInvoiceFormComponent,
  isCompany,
  isInvoiceType,
  type InvoiceType,
} from "@/invoice-management/loaders";

export const Route = createFileRoute("/invoice/$type/$company")({
  head: ({ params }) => ({
    meta: [
      {
        title:
          isInvoiceType(params.type) && isCompany(params.company)
            ? `${INVOICE_TYPE_LABELS[params.type]} · ${getCompany(params.company)?.name ?? ""}`
            : "Invoice",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InvoiceMountPage,
});

function InvoiceMountPage() {
  const { type, company } = useParams({ from: "/invoice/$type/$company" });
  const navigate = useNavigate();
  const session = readSession();

  useEffect(() => {
    if (!session) navigate({ to: "/login" });
  }, [session, navigate]);

  if (!session) return null;
  if (!isInvoiceType(type) || !isCompany(company)) throw notFound();

  const allowed = allowedCompaniesFor(session.code);
  if (!allowed.includes(company as CompanyId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Not authorised</h1>
          <p className="mt-2 text-sm text-slate-600">
            You don&apos;t have access to this company.
          </p>
          <Link
            to="/invoice"
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>
      </div>
    );
  }

  const LazyForm = useMemo(
    () => getInvoiceFormComponent(type as InvoiceType, company as CompanyId),
    [type, company],
  );

  const companyName = getCompany(company as CompanyId)?.name ?? company;
  const typeLabel = INVOICE_TYPE_LABELS[type as InvoiceType];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/invoice/$type"
              params={{ type: type as InvoiceType }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                {typeLabel}
              </p>
              <p className="text-sm font-semibold text-slate-900">{companyName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {LazyForm ? (
          <Suspense fallback={<LoadingBlock label={`Loading ${typeLabel} form…`} />}>
            <LazyForm />
          </Suspense>
        ) : (
          <MissingModuleNotice type={type as InvoiceType} company={company as CompanyId} />
        )}
      </div>
    </div>
  );
}

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
      {label}
    </div>
  );
}

function MissingModuleNotice({ type, company }: { type: InvoiceType; company: CompanyId }) {
  const map: Record<CompanyId, string> = {
    mohit: "Mohit",
    decousttech: "Decoust",
    asg: "Asg",
  };
  const suffix = type === "invoices" ? "" : type.toUpperCase();
  const formName = `InvoiceForm${map[company]}${suffix}.tsx`;
  const fbName = `firebase${map[company]}${suffix}.ts`;
  const pdfName = `pdfGenerator${map[company]}${suffix}.ts`;
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
      <p className="font-semibold">This module has not been added yet.</p>
      <p className="mt-2">
        Drop the following files into <code>src/invoice-management/</code> and this page will pick
        them up automatically:
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 font-mono text-xs">
        <li>components/{formName}</li>
        <li>utils/{fbName}</li>
        <li>utils/{pdfName}</li>
      </ul>
    </div>
  );
}