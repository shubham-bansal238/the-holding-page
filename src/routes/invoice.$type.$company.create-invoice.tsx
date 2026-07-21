import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { type CompanyId } from "@/lib/firebase";
import {
  getInvoiceFormComponent,
  loadFirebase,
  loadPdfGenerator,
  type AnyInvoiceData,
  type FirebaseModule,
  type PdfModule,
  type InvoiceType,
} from "@/invoice-management/loaders";
import { neutraliseOklchColors } from "@/invoice-management/lib/oklch-shim";

export const Route = createFileRoute("/invoice/$type/$company/create-invoice")({
  component: CreateInvoicePage,
});

function CreateInvoicePage() {
  const { type, company } = useParams({ from: "/invoice/$type/$company/create-invoice" });
  return (
    <CreateOrEditInvoice
      type={type as InvoiceType}
      company={company as CompanyId}
      invoiceId={undefined}
    />
  );
}

export function CreateOrEditInvoice({
  type,
  company,
  invoiceId,
}: {
  type: InvoiceType;
  company: CompanyId;
  invoiceId: string | undefined;
}) {
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<AnyInvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(!!invoiceId);
  const [fb, setFb] = useState<FirebaseModule | null>(null);
  const [pdf, setPdf] = useState<PdfModule | null>(null);
  const [moduleError, setModuleError] = useState<string | null>(null);

  const LazyForm = getInvoiceFormComponent(type, company);

  useEffect(() => {
    let cancelled = false;
    setModuleError(null);
    Promise.all([loadFirebase(type, company), loadPdfGenerator(type, company)])
      .then(([f, p]) => {
        if (cancelled) return;
        setFb(f);
        setPdf(p);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setModuleError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [type, company]);

  useEffect(() => {
    if (!invoiceId || !fb) return;
    let cancelled = false;
    setIsLoading(true);
    fb.getInvoiceById(invoiceId)
      .then((invoice) => {
        if (cancelled) return;
        if (invoice) {
          setInitialData(invoice);
        } else {
          toast.error("Invoice not found");
          navigate({ to: "/invoice/$type/$company", params: { type, company } });
        }
      })
      .catch((error) => {
        toast.error("Failed to load invoice");
        console.error("Load error:", error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [invoiceId, fb, navigate, type, company]);

  const handleSave = async (data: AnyInvoiceData) => {
    if (!fb) throw new Error("Module not ready");
    try {
      await fb.saveInvoice(data);
      toast.success(invoiceId ? "Invoice updated successfully!" : "Invoice saved successfully!");
    } catch (error) {
      toast.error("Failed to save invoice");
      throw error;
    }
  };

  const handleSaveAsNew = async (data: AnyInvoiceData) => {
    if (!fb) throw new Error("Module not ready");
    try {
      const newData = { ...data };
      delete newData.id;
      const savedId = await fb.saveInvoice(newData);
      toast.success("New invoice created successfully!");
      navigate({
        to: "/invoice/$type/$company/edit-invoice/$id",
        params: { type, company, id: savedId },
        replace: true,
      });
    } catch (error) {
      toast.error("Failed to create new invoice");
      throw error;
    }
  };

  const handleGeneratePDF = async (data: AnyInvoiceData) => {
    if (!pdf) throw new Error("Module not ready");
    // html2canvas (used by html2pdf.js) cannot parse Tailwind v4's oklch()
    // colors and throws, which is why the same invoice HTML that works in
    // the standalone app hangs here. Neutralise oklch() globally for the
    // duration of the export by overriding every CSS custom property that
    // resolves to an oklch() value with a safe sRGB fallback, then restore.
    // Neutralise Tailwind v4 oklch() colors before html2canvas cloning.
    const restore = await neutraliseOklchColors();
    try {
      await pdf.generatePDF(data);
      toast.success("PDF generated and downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate PDF");
      console.error("PDF generation error:", error);
    } finally {
      await restore();
    }
  };


  if (moduleError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-sm text-rose-800">
          <p className="font-semibold">Module not found</p>
          <p className="mt-2 text-rose-700">{moduleError}</p>
        </div>
      </div>
    );
  }

  if (isLoading || !fb || !pdf) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invoice…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() =>
                navigate({ to: "/invoice/$type/$company", params: { type, company } })
              }
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {invoiceId ? "Edit Invoice" : "Create New Invoice"}
            </h1>
          </div>
        </div>
      </div>

      {LazyForm ? (
        <Suspense
          fallback={
            <div className="p-10 text-center text-sm text-slate-500">Loading form…</div>
          }
        >
          <LazyForm
            initialData={initialData}
            onSave={handleSave}
            onSaveAsNew={handleSaveAsNew}
            onGeneratePDF={handleGeneratePDF}
          />
        </Suspense>
      ) : (
        <div className="mx-auto max-w-3xl p-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            <p className="font-semibold">This module has not been added yet.</p>
            <p className="mt-2">
              Add the form file for this combination in{" "}
              <code>src/invoice-management/components/</code>.
            </p>
            <Link
              to="/invoice/$type/$company"
              params={{ type, company }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
