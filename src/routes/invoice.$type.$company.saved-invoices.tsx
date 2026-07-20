import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, FileText, Edit, Trash2, Download, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { type CompanyId } from "@/lib/firebase";
import {
  loadFirebase,
  loadPdfGenerator,
  type AnyInvoiceData,
  type FirebaseModule,
  type PdfModule,
  type InvoiceType,
} from "@/invoice-management/loaders";

export const Route = createFileRoute("/invoice/$type/$company/saved-invoices")({
  component: SavedInvoicesPage,
});

function SavedInvoicesPage() {
  const { type, company } = useParams({ from: "/invoice/$type/$company/saved-invoices" });
  const navigate = useNavigate();
  const t = type as InvoiceType;
  const c = company as CompanyId;

  const [fb, setFb] = useState<FirebaseModule | null>(null);
  const [pdf, setPdf] = useState<PdfModule | null>(null);
  const [invoices, setInvoices] = useState<AnyInvoiceData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [moduleError, setModuleError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadFirebase(t, c), loadPdfGenerator(t, c)])
      .then(([f, p]) => {
        if (cancelled) return;
        setFb(f);
        setPdf(p);
      })
      .catch((err: Error) => !cancelled && setModuleError(err.message));
    return () => {
      cancelled = true;
    };
  }, [t, c]);

  useEffect(() => {
    if (!fb) return;
    let cancelled = false;
    setIsLoading(true);
    fb.getInvoices()
      .then((data) => !cancelled && setInvoices(data))
      .catch((error) => {
        toast.error("Failed to load invoices");
        console.error(error);
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fb]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const query = searchQuery.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.consignee?.name?.toLowerCase().includes(query) ||
        inv.invoiceNumber?.toLowerCase().includes(query) ||
        inv.seller?.name?.toLowerCase().includes(query),
    );
  }, [searchQuery, invoices]);

  const handleDelete = async (id: string) => {
    if (!fb) return;
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await fb.deleteInvoice(id);
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      toast.success("Invoice deleted successfully");
    } catch (error) {
      toast.error("Failed to delete invoice");
      console.error(error);
    }
  };

  const handleGeneratePDF = async (invoice: AnyInvoiceData) => {
    if (!pdf) return;
    try {
      await pdf.generatePDF(invoice);
      toast.success("PDF generated and downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate PDF");
      console.error(error);
    }
  };

  const monthOptions = useMemo(() => {
    const labels = new Set<string>();
    invoices.forEach((inv) => {
      const d = inv.invoiceDate ? new Date(inv.invoiceDate) : null;
      if (d && !Number.isNaN(d.getTime())) {
        labels.add(d.toLocaleString("default", { month: "long" }));
      }
    });
    const order = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return order.filter((m) => labels.has(m));
  }, [invoices]);

  const yearOptions = useMemo(() => {
    const labels = new Set<number>();
    invoices.forEach((inv) => {
      const d = inv.invoiceDate ? new Date(inv.invoiceDate) : null;
      if (d && !Number.isNaN(d.getTime())) labels.add(d.getFullYear());
    });
    return Array.from(labels).sort((a, b) => b - a);
  }, [invoices]);

  const visibleInvoices = useMemo(() => {
    if (selectedMonth === "all" && selectedYear === "all") return filteredInvoices;
    return filteredInvoices.filter((inv) => {
      const d = inv.invoiceDate ? new Date(inv.invoiceDate) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      const mMatch = selectedMonth === "all" || d.toLocaleString("default", { month: "long" }) === selectedMonth;
      const yMatch = selectedYear === "all" || d.getFullYear().toString() === selectedYear;
      return mMatch && yMatch;
    });
  }, [filteredInvoices, selectedMonth, selectedYear]);

  const groupedInvoices = useMemo(() => {
    const groups = new Map<string, { sortKey: number; items: AnyInvoiceData[] }>();
    visibleInvoices.forEach((inv) => {
      const d = inv.invoiceDate ? new Date(inv.invoiceDate) : null;
      const valid = d && !Number.isNaN(d.getTime());
      const label = valid ? d!.toLocaleString("default", { month: "long", year: "numeric" }) : "Unknown Date";
      const key = valid ? new Date(d!.getFullYear(), d!.getMonth(), 1).getTime() : Number.NEGATIVE_INFINITY;
      const existing = groups.get(label);
      if (existing) existing.items.push(inv);
      else groups.set(label, { sortKey: key, items: [inv] });
    });
    return Array.from(groups.entries())
      .map(([label, g]) => ({
        label,
        sortKey: g.sortKey,
        items: g.items.sort((a, b) => {
          const at = a.invoiceDate ? new Date(a.invoiceDate).getTime() : Number.NEGATIVE_INFINITY;
          const bt = b.invoiceDate ? new Date(b.invoiceDate).getTime() : Number.NEGATIVE_INFINITY;
          return bt - at;
        }),
      }))
      .sort((a, b) => b.sortKey - a.sortKey);
  }, [visibleInvoices]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invoices…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate({ to: "/invoice/$type/$company", params: { type: t, company: c } })}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Saved Invoices</h1>
            </div>
            <Link to="/invoice/$type/$company/create-invoice" params={{ type: t, company: c }}>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Invoice
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by company name or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All Months</option>
              {monthOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All Years</option>
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {visibleInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No invoices found</h2>
            <Link to="/invoice/$type/$company/create-invoice" params={{ type: t, company: c }}>
              <Button><Plus className="w-4 h-4 mr-2" />Create Invoice</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedInvoices.map((group) => (
              <div key={group.label}>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">{group.label}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map((invoice) => (
                    <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg font-semibold mb-1">
                              {invoice.consignee?.name || "Unknown Consignee"}
                            </CardTitle>
                            <p className="text-sm text-gray-600">Invoice: {invoice.invoiceNumber || "Draft"}</p>
                            <p className="text-sm text-gray-600">
                              {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "Unknown Date"}
                            </p>
                          </div>
                          <Badge variant="secondary" className="ml-2">
                            {invoice.products?.length || 0} items
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">From:</p>
                            <p className="text-sm text-gray-600 truncate">{invoice.seller?.name || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">To:</p>
                            <p className="text-sm text-gray-600 truncate">{invoice.consignee?.name || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate({
                                to: "/invoice/$type/$company/edit-invoice/$id",
                                params: { type: t, company: c, id: invoice.id! },
                              })
                            }
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleGeneratePDF(invoice)} className="flex-1">
                            <Download className="w-4 h-4 mr-1" />PDF
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(invoice.id!)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
