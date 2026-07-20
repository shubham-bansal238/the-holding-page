
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import InvoiceForm from '@/components/InvoiceForm';
import { saveInvoice, getInvoiceById, InvoiceData } from '@/utils/firebase';
import { generatePDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

const CreateInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      loadInvoice(id);
    }
  }, [id]);

  const loadInvoice = async (invoiceId: string) => {
    try {
      const invoice = await getInvoiceById(invoiceId);
      if (invoice) {
        setInitialData(invoice);
      } else {
        toast.error('Invoice not found');
        navigate('/');
      }
    } catch (error) {
      toast.error('Failed to load invoice');
      console.error('Load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: InvoiceData) => {
    try {
      const savedId = await saveInvoice(data);
      toast.success('Invoice updated successfully!');
    } catch (error) {
      toast.error('Failed to update invoice');
      throw error;
    }
  };

  const handleSaveAsNew = async (data: InvoiceData) => {
    try {
      // Remove the ID to create a new document
      const newData = { ...data };
      delete newData.id;
      
      const savedId = await saveInvoice(newData);
      toast.success('New invoice created successfully!');
      
      // Navigate to edit mode for the new invoice
      navigate(`/edit-invoice/${savedId}`, { replace: true });
    } catch (error) {
      toast.error('Failed to create new invoice');
      throw error;
    }
  };

  const handleGeneratePDF = async (data: InvoiceData) => {
    try {
      await generatePDF(data);
      toast.success('PDF generated and downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
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
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {id ? 'Edit Invoice' : 'Create New Invoice'}
            </h1>
          </div>
        </div>
      </div>

      <InvoiceForm
        initialData={initialData}
        onSave={handleSave}
        onSaveAsNew={handleSaveAsNew}
        onGeneratePDF={handleGeneratePDF}
      />
    </div>
  );
};

export default CreateInvoice;
