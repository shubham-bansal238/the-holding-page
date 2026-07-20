import { createFileRoute, useParams, Link, notFound, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import {
  allowedCompaniesFor,
  getCompany,
  readSession,
  type CompanyId,
} from "@/lib/firebase";
import {
  INVOICE_TYPE_LABELS,
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
  component: InvoiceCompanyLayout,
});

function InvoiceCompanyLayout() {
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

  return <Outlet />;
}
