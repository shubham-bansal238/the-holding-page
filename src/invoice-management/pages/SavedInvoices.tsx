import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Edit, Trash2, Download, Plus, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getInvoices, deleteInvoice, InvoiceData } from '@/utils/firebase';
import { generatePDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

const SavedInvoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    // Filter invoices based on search query
    if (!searchQuery.trim()) {
      setFilteredInvoices(invoices);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = invoices.filter(invoice => 
        (invoice.consignee?.name && invoice.consignee.name.toLowerCase().includes(query)) ||
        (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(query)) ||
        (invoice.seller?.name && invoice.seller.name.toLowerCase().includes(query))
      );
      setFilteredInvoices(filtered);
    }
  }, [searchQuery, invoices]);

  const loadInvoices = async () => {
    try {
      const data = await getInvoices();
      setInvoices(data);
      setFilteredInvoices(data);
    } catch (error) {
      toast.error('Failed to load invoices');
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id);
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        toast.success('Invoice deleted successfully');
      } catch (error) {
        toast.error('Failed to delete invoice');
        console.error('Delete error:', error);
      }
    }
  };

  const handleGeneratePDF = async (invoice: InvoiceData) => {
    try {
      await generatePDF(invoice);
      toast.success('PDF generated and downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    }
  };

  const monthOptions = useMemo(() => {
    const labels = new Set<string>();

    invoices.forEach((invoice) => {
      const parsedDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
      const isValidDate = parsedDate !== null && !Number.isNaN(parsedDate.getTime());

      if (!isValidDate) {
        return;
      }

      labels.add(parsedDate.toLocaleString('default', { month: 'long' }));
    });

    const monthOrder = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return monthOrder.filter((month) => labels.has(month));
  }, [invoices]);

  const yearOptions = useMemo(() => {
    const labels = new Set<number>();

    invoices.forEach((invoice) => {
      const parsedDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
      const isValidDate = parsedDate !== null && !Number.isNaN(parsedDate.getTime());

      if (!isValidDate) {
        return;
      }

      labels.add(parsedDate.getFullYear());
    });

    return Array.from(labels).sort((a, b) => b - a);
  }, [invoices]);

  const visibleInvoices = useMemo(() => {
    if (selectedMonth === 'all' && selectedYear === 'all') {
      return filteredInvoices;
    }

    return filteredInvoices.filter((invoice) => {
      const parsedDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
      const isValidDate = parsedDate !== null && !Number.isNaN(parsedDate.getTime());

      if (!isValidDate) {
        return false;
      }

      const invoiceMonth = parsedDate.toLocaleString('default', { month: 'long' });
      const invoiceYear = parsedDate.getFullYear().toString();
      const matchesMonth = selectedMonth === 'all' || invoiceMonth === selectedMonth;
      const matchesYear = selectedYear === 'all' || invoiceYear === selectedYear;

      return matchesMonth && matchesYear;
    });
  }, [filteredInvoices, selectedMonth, selectedYear]);

  const groupedInvoices = useMemo(() => {
    const groups = new Map<string, { sortKey: number; items: InvoiceData[] }>();

    visibleInvoices.forEach((invoice) => {
      const parsedDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : null;
      const isValidDate = parsedDate !== null && !Number.isNaN(parsedDate.getTime());
      const groupLabel = isValidDate
        ? parsedDate.toLocaleString('default', { month: 'long', year: 'numeric' })
        : 'Unknown Date';
      const groupSortKey = isValidDate
        ? new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1).getTime()
        : Number.NEGATIVE_INFINITY;

      const existing = groups.get(groupLabel);
      if (existing) {
        existing.items.push(invoice);
      } else {
        groups.set(groupLabel, { sortKey: groupSortKey, items: [invoice] });
      }
    });

    return Array.from(groups.entries())
      .map(([label, group]) => ({
        label,
        sortKey: group.sortKey,
        items: group.items.sort((a, b) => {
          const aTime = a.invoiceDate ? new Date(a.invoiceDate).getTime() : Number.NEGATIVE_INFINITY;
          const bTime = b.invoiceDate ? new Date(b.invoiceDate).getTime() : Number.NEGATIVE_INFINITY;
          return bTime - aTime;
        }),
      }))
      .sort((a, b) => b.sortKey - a.sortKey);
  }, [visibleInvoices]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
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
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Saved Invoices</h1>
            </div>
            <Link to="/create-invoice">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Invoice
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by company name or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="month-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by month
            </label>
            <div className="relative">
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Months</option>
                {monthOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by year
            </label>
            <div className="relative">
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Years</option>
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {visibleInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            {searchQuery ? (
              <>
                <h2 className="text-xl font-semibold text-gray-600 mb-2">No invoices found</h2>
                <p className="text-gray-500 mb-6">No invoices match your search criteria</p>
                <Button onClick={() => setSearchQuery('')} variant="outline">
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-600 mb-2">No invoices found</h2>
                <p className="text-gray-500 mb-6">Create your first invoice to get started</p>
                <Link to="/create-invoice">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                </Link>
              </>
            )}
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
                              {invoice.consignee?.name || 'Unknown Consignee'}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              Invoice: {invoice.invoiceNumber || 'Draft'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {invoice.invoiceDate
                                ? new Date(invoice.invoiceDate).toLocaleDateString()
                                : 'Unknown Date'}
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
                            <p className="text-sm text-gray-600 truncate">
                              {invoice.seller?.name || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">To:</p>
                            <p className="text-sm text-gray-600 truncate">
                              {invoice.consignee?.name || 'N/A'}
                            </p>
                          </div>
                          {invoice.createdAt && (
                            <div>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(invoice.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/edit-invoice/${invoice.id}`)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGeneratePDF(invoice)}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(invoice.id!)}
                          >
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
};

export default SavedInvoices;
