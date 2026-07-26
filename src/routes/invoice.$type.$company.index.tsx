import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, PlusCircle, List, FileText } from "lucide-react";
import { allowedCompaniesFor, getCompany, readSession, type CompanyId } from "@/lib/firebase";
import { INVOICE_TYPE_LABELS, type InvoiceType } from "@/invoice-management/loaders";

export const Route = createFileRoute("/invoice/$type/$company/")({
  component: InvoiceCompanyHome,
});

function InvoiceCompanyHome() {
  const { type, company } = useParams({ from: "/invoice/$type/$company/" });
  const companyName = getCompany(company as CompanyId)?.name ?? company;
  const typeLabel = INVOICE_TYPE_LABELS[type as InvoiceType];
  // With a single allowed company the company picker auto-forwards here, so
  // Back must skip it and return to the invoice module home.
  const session = readSession();
  const singleCompany = !!session && allowedCompaniesFor(session.code).length === 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          {singleCompany ? (
            <Link
              to="/invoice"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          ) : (
            <Link
              to="/invoice/$type"
              params={{ type: type as InvoiceType }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          )}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              {typeLabel}
            </p>
            <p className="text-sm font-semibold text-slate-900">{companyName}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            {typeLabel} · {companyName}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">GST</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link
            to="/invoice/$type/$company/create-invoice"
            params={{ type: type as InvoiceType, company: company as CompanyId }}
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-blue-200"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 mx-auto group-hover:bg-blue-200 transition-colors">
              <PlusCircle className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
              Create New {typeLabel === "Invoices" ? "Invoice" : typeLabel}
            </h2>
          </Link>

          <Link
            to="/invoice/$type/$company/saved-invoices"
            params={{ type: type as InvoiceType, company: company as CompanyId }}
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 hover:border-green-200"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6 mx-auto group-hover:bg-green-200 transition-colors">
              <List className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
              Saved {typeLabel}
            </h2>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-md">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-gray-700 font-medium">
              PDF generation • Client-side processing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
