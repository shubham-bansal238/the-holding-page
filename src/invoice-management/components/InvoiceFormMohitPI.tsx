import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, Save, FileDown } from "lucide-react";
import { toast } from "sonner";
import { InvoiceData } from "@/utils/firebase";

interface InvoiceFormProps {
  initialData: InvoiceData | null;
  onSave: (data: InvoiceData) => Promise<void>;
  onSaveAsNew: (data: InvoiceData) => Promise<void>;
  onGeneratePDF: (data: InvoiceData) => Promise<void>;
}

const InvoiceForm = ({
  initialData,
  onSave,
  onSaveAsNew,
  onGeneratePDF,
}: InvoiceFormProps) => {
  const [formData, setFormData] = useState<InvoiceData>({
      invoiceNumber: "MI/2026-27/",
      invoiceDate: new Date().toISOString().split("T")[0],
      documentNo: "",
      paymentTerms: "",
      poNo: "",
      poDate: "",
      rrLrNo: "",
      rrLrDate: "",
      eWayBillNo: "",
      eWayBillDate: "",
      challanNumber: "",
      challanDate: "",
      lcNo: "",
      termsOfDelivery: "Mohit International factory gate",
      insuranceText: "",
      paymentDueDate: "",
      documentsThru: "",
      freightText: "",
      gstRate: 18,
      seller: {
        name: "MOHIT INTERNATIONAL",
        address:
          "KHASRA No- 447, Gulistanpur, Surajpur Site-C, Greater Noida, G.B Nagar - 201310, State: Uttar Pradesh, Code:09",
        gstin: "09AQZPB9845R1ZG",
        email: "sales@mohitinternational.net",
      },
      consignee: {
        name: "",
        address: "",
        gstin: "",
        destination: "",
        modeOfTransport: "",
        vehicleNo: "",
        dateOfRemoval: "",
        timeOfRemoval: "",
      },
      buyer: {
        name: "",
        address: "",
        gstin: "",
      },
      buyerSameAsConsignee: true,
      products: [
        {
          sNo: 1,
          packages: "",
          description: "",
          hsn: "",
          unit: "",
          rate: 0,
          qty: 0,
          amount: 0,
        },
      ],
      freight: 0,
      insurance: 0,
      tcs: 0,
      amountInWords: "",
      terms: `1. Interest on all overdue payments will be charged @24% per annum
  2. All disputes subject to U.P. Jurisdiction.
  3. No quality complaints will be entertained after 30 days of receipt of material.
  4. Payments should be made through NEFT/RTGS/IMPS in favour of company in Punjab National Bank, Current Account No 1236102100000042, IFS Code PUNB0123610.
  5. No additional discount/rebate or compromise whatsoever against this sale is admissible except under signature of authorized partner.
  6. This transportation charges indicated in this invoice do not include cost of transportation for the return journey of the empty truck/vehicle.`,
      bankDetails: `Panjab National Bank,
  Current Account No 1236102100000042,
  IFS Code PUNB0123610`,
      approxWeight: 0,
      isIgstApplicable: false,
    });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const addProduct = () => {
    setFormData((prev) => {
      const newSNo =
        prev.products.length > 0
          ? prev.products[prev.products.length - 1].sNo + 1
          : 1;
      return {
        ...prev,
        products: [
          ...prev.products,
          {
            sNo: newSNo,
            packages: "",
            description: "",
            hsn: "",
            unit: "",
            rate: 0,
            qty: 0,
            amount: 0,
          },
        ],
      };
    });
  };

  const removeProduct = (index: number) => {
    setFormData((prev) => {
      const updatedProducts = [...prev.products];
      updatedProducts.splice(index, 1);
      return { ...prev, products: updatedProducts };
    });
  };

  const updateProduct = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const updatedProducts = [...prev.products];

      if (field === "rate" || field === "qty") {
        updatedProducts[index][field] = value;
        updatedProducts[index].amount =
          Number(updatedProducts[index].rate) *
          Number(updatedProducts[index].qty);
      } else {
        updatedProducts[index][field] = value;
      }

      return { ...prev, products: updatedProducts };
    });
  };

  const handleSubmit = async (e: React.FormEvent, action: 'save' | 'saveAsNew' | 'generatePdf' = 'save') => {
    e.preventDefault();

    try {
      const invoiceData: InvoiceData = {
        ...formData,
        // Ensure invoice number format
        invoiceNumber: formData.invoiceNumber.startsWith("MI/2026-27/")
          ? formData.invoiceNumber
          : `MI/2026-27/${formData.invoiceNumber}`,
        // Use consignee data for buyer if checkbox is checked
        buyer: formData.buyerSameAsConsignee
          ? {
              name: formData.consignee.name,
              address: formData.consignee.address,
              gstin: formData.consignee.gstin,
            }
          : formData.buyer,
      };

      switch (action) {
        case 'save':
          await onSave(invoiceData);
          break;
        case 'saveAsNew':
          await onSaveAsNew(invoiceData);
          break;
        case 'generatePdf':
          await onGeneratePDF(invoiceData);
          break;
      }
    } catch (error) {
      toast.error("An error occurred while processing the invoice");
      console.error("Submit error:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        {/* Seller Details - Pre-filled */}
        <Card>
          <CardHeader>
            <CardTitle>Seller Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <Input
                value={formData.seller.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    seller: { ...prev.seller, name: e.target.value },
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.seller.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    seller: { ...prev.seller, email: e.target.value },
                  }))
                }
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <Textarea
                value={formData.seller.address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    seller: { ...prev.seller, address: e.target.value },
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GSTIN</label>
              <Input
                value={formData.seller.gstin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    seller: { ...prev.seller, gstin: e.target.value },
                  }))
                }
                required
              />
            </div>
          </CardContent>
        </Card>
        {/* Consignee Details */}
        <Card>
          <CardHeader>
            <CardTitle>Consignee Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={formData.consignee.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    consignee: { ...prev.consignee, name: e.target.value },
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GSTIN</label>
              <Input
                value={formData.consignee.gstin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    consignee: { ...prev.consignee, gstin: e.target.value },
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <Textarea
                value={formData.consignee.address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    consignee: { ...prev.consignee, address: e.target.value },
                  }))
                }
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Buyer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              Buyer Details
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="buyer-same"
                  checked={formData.buyerSameAsConsignee}
                  onCheckedChange={(checked) => {
                    setFormData((prev) => ({
                      ...prev,
                      buyerSameAsConsignee: checked as boolean,
                      buyer: checked
                        ? {
                            name: prev.consignee.name,
                            address: prev.consignee.address,
                            gstin: prev.consignee.gstin,
                          }
                        : prev.buyer,
                    }));
                  }}
                />
                <label htmlFor="buyer-same" className="text-sm font-normal">
                  Buyer same as Consignee
                </label>
              </div>
            </CardTitle>
          </CardHeader>
          {!formData.buyerSameAsConsignee && (
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={formData.buyer.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      buyer: { ...prev.buyer, name: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GSTIN</label>
                <Input
                  value={formData.buyer.gstin}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      buyer: { ...prev.buyer, gstin: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <Textarea
                  value={formData.buyer.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      buyer: { ...prev.buyer, address: e.target.value },
                    }))
                  }
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Invoice Number
              </label>
              <Input
                value={formData.invoiceNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    invoiceNumber: e.target.value,
                  }))
                }
                placeholder="MI/2026-27/024"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Invoice Date
              </label>
              <Input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    invoiceDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment</label>
              <Input
                value={formData.paymentTerms}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    paymentTerms: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">P.O. No.</label>
              <Input
                value={formData.poNo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, poNo: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Cust P.O. Date
              </label>
              <Input
                type="date"
                value={formData.poDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, poDate: e.target.value }))
                }
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Freight</label>
              <Input
                value={formData.freightText}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    freightText: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                GST Rate %
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.gstRate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gstRate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Products
              <Button
                type="button"
                onClick={addProduct}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.products.map((product, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-9 gap-2 p-4 border rounded-lg"
                >
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      S.No
                    </label>
                    <Input
                      value={product.sNo}
                      disabled
                      className="bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Packages
                    </label>
                    <Input
                      value={product.packages}
                      onChange={(e) =>
                        updateProduct(index, "packages", e.target.value)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium mb-1">
                      Description
                    </label>
                    <Textarea
                      value={product.description}
                      onChange={(e) =>
                        updateProduct(index, "description", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      HSN
                    </label>
                    <Input
                      value={product.hsn}
                      onChange={(e) =>
                        updateProduct(index, "hsn", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Unit
                    </label>
                    <Input
                      value={product.unit}
                      onChange={(e) =>
                        updateProduct(index, "unit", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Rate
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={product.rate}
                      onChange={(e) =>
                        updateProduct(
                          index,
                          "rate",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">
                      Qty
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={product.qty}
                      onChange={(e) =>
                        updateProduct(
                          index,
                          "qty",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1">
                        Amount
                      </label>
                      <Input
                        value={product.amount.toFixed(2)}
                        disabled
                        className="bg-gray-100"
                      />
                    </div>
                    {formData.products.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeProduct(index)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Charges and Tax Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Charges & Tax Configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Freight taxable value
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.freight}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    freight: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Insurance
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.insurance}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    insurance: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">TCS</label>
              <Input
                type="number"
                step="0.01"
                value={formData.tcs}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tcs: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Approx Weight (KG)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.approxWeight}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    approxWeight: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="igst-applicable"
                  checked={formData.isIgstApplicable}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      isIgstApplicable: checked as boolean,
                    }))
                  }
                />
                <label
                  htmlFor="igst-applicable"
                  className="text-sm font-medium"
                >
                  IGST applicable - Check if inter-state transaction
                </label>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {formData.isIgstApplicable
                  ? `IGST ${formData.gstRate.toFixed(2)}% will be applied`
                  : `CGST ${(formData.gstRate / 2).toFixed(2)}% + SGST ${(
                      formData.gstRate / 2
                    ).toFixed(2)}% will be applied`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.terms}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, terms: e.target.value }))
              }
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.bankDetails}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  bankDetails: e.target.value,
                }))
              }
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6">
          {initialData ? (
            // Editing existing invoice - show both buttons
            <>
              <Button 
                type="button" 
                onClick={(e) => handleSubmit(e, 'save')}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes to Existing Invoice
              </Button>
              <Button
                type="button"
                onClick={(e) => handleSubmit(e, 'saveAsNew')}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save as New Invoice
              </Button>
            </>
          ) : (
            // Creating new invoice - show only one button
            <Button 
              type="button"
              onClick={(e) => handleSubmit(e, 'saveAsNew')}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save as New Invoice
            </Button>
          )}
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, 'generatePdf')}
            className="flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Generate PDF
          </Button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
