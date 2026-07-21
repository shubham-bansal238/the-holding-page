import * as React from "react";
import type { CompanyId } from "@/lib/firebase";

// The three "document types" the Invoice Management System supports.
export type InvoiceType = "invoices" | "pi" | "po";

export const INVOICE_TYPES: InvoiceType[] = ["invoices", "pi", "po"];

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  invoices: "Invoices",
  pi: "PI",
  po: "PO",
};

const SUFFIX_BY_TYPE: Record<InvoiceType, string> = {
  invoices: "",
  pi: "PI",
  po: "PO",
};

const NAME_BY_COMPANY: Record<CompanyId, string> = {
  mohit: "Mohit",
  decousttech: "Decoust",
  asg: "Asg",
};

export function isInvoiceType(v: string | undefined): v is InvoiceType {
  return v === "invoices" || v === "pi" || v === "po";
}

export function isCompany(v: string | undefined): v is CompanyId {
  return v === "mohit" || v === "decousttech" || v === "asg";
}

// Generic invoice data — real shape lives in each firebase{Company}.ts file.
// We keep it loose here because it differs slightly per company.
export type AnyInvoiceData = Record<string, any> & { id?: string };

export interface InvoiceFormProps {
  initialData: AnyInvoiceData | null;
  onSave: (data: AnyInvoiceData) => Promise<void>;
  onSaveAsNew: (data: AnyInvoiceData) => Promise<void>;
  onGeneratePDF: (data: AnyInvoiceData) => Promise<void>;
}

export interface FirebaseModule {
  saveInvoice: (data: AnyInvoiceData) => Promise<string>;
  getInvoices: () => Promise<AnyInvoiceData[]>;
  getInvoiceById: (id: string) => Promise<AnyInvoiceData | null>;
  deleteInvoice: (id: string) => Promise<void>;
}

export interface PdfModule {
  generatePDF: (data: AnyInvoiceData) => Promise<void>;
}

type Loader<T = unknown> = () => Promise<T>;

const invoiceFormModules = import.meta.glob(
  "./components/InvoiceForm*.tsx",
) as Record<string, Loader<{ default: React.ComponentType<InvoiceFormProps> }>>;

const firebaseModules = import.meta.glob(
  "./utils/firebase*.ts",
) as Record<string, Loader<Record<string, unknown>>>;

const pdfModules = import.meta.glob(
  "./utils/pdfGenerator*.ts",
) as Record<string, Loader<Record<string, unknown>>>;

function invoiceFormKey(type: InvoiceType, company: CompanyId) {
  return `./components/InvoiceForm${NAME_BY_COMPANY[company]}${SUFFIX_BY_TYPE[type]}.tsx`;
}
function firebaseKey(type: InvoiceType, company: CompanyId) {
  return `./utils/firebase${NAME_BY_COMPANY[company]}${SUFFIX_BY_TYPE[type]}.ts`;
}
function pdfKey(type: InvoiceType, company: CompanyId) {
  return `./utils/pdfGenerator${NAME_BY_COMPANY[company]}${SUFFIX_BY_TYPE[type]}.ts`;
}

const lazyFormCache = new Map<
  string,
  React.LazyExoticComponent<React.ComponentType<InvoiceFormProps>>
>();

export function getInvoiceFormComponent(
  type: InvoiceType,
  company: CompanyId,
): React.LazyExoticComponent<React.ComponentType<InvoiceFormProps>> | null {
  const key = invoiceFormKey(type, company);
  const loader = invoiceFormModules[key];
  if (!loader) return null;
  const cached = lazyFormCache.get(key);
  if (cached) return cached;
  const lazy = React.lazy(loader);
  lazyFormCache.set(key, lazy);
  return lazy;
}

export function hasInvoiceFormFor(type: InvoiceType, company: CompanyId) {
  return Boolean(invoiceFormModules[invoiceFormKey(type, company)]);
}

export async function loadFirebase(
  type: InvoiceType,
  company: CompanyId,
): Promise<FirebaseModule> {
  const loader = firebaseModules[firebaseKey(type, company)];
  if (!loader) {
    throw new Error(`Missing firebase module: ${firebaseKey(type, company)}`);
  }
  return (await loader()) as unknown as FirebaseModule;
}

export async function loadPdfGenerator(
  type: InvoiceType,
  company: CompanyId,
): Promise<PdfModule> {
  const loader = pdfModules[pdfKey(type, company)];
  if (!loader) {
    throw new Error(`Missing pdfGenerator module: ${pdfKey(type, company)}`);
  }
  return (await loader()) as unknown as PdfModule;
}

export function listAvailableInvoiceForms(): string[] {
  return Object.keys(invoiceFormModules);
}
export function listAvailableFirebaseModules(): string[] {
  return Object.keys(firebaseModules);
}
export function listAvailablePdfModules(): string[] {
  return Object.keys(pdfModules);
}
