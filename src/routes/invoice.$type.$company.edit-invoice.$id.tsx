import { createFileRoute, useParams } from "@tanstack/react-router";
import type { CompanyId } from "@/lib/firebase";
import type { InvoiceType } from "@/invoice-management/loaders";
import { CreateOrEditInvoice } from "./invoice.$type.$company.create-invoice";

export const Route = createFileRoute("/invoice/$type/$company/edit-invoice/$id")({
  component: EditInvoicePage,
});

function EditInvoicePage() {
  const { type, company, id } = useParams({
    from: "/invoice/$type/$company/edit-invoice/$id",
  });
  return (
    <CreateOrEditInvoice
      type={type as InvoiceType}
      company={company as CompanyId}
      invoiceId={id}
    />
  );
}
