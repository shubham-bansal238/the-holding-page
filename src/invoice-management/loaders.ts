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

// File-name suffix used for each type. "invoices" is the default (no suffix).
const SUFFIX_BY_TYPE: Record<InvoiceType, string> = {
  invoices: "",
  pi: "PI",
  po: "PO",
};

// File-name segment used for each company (matches the naming the user provides).
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

// ---------- Dynamic module resolution via import.meta.glob ----------
//
// Vite scans these globs at build time and produces a lazy loader for every
// matching file. Missing files simply won't appear in the map (no build
// failure), which lets us ship the integration layer BEFORE the user drops
// in the company-specific implementations.
//
// Naming convention (in `src/invoice-management/`):
//
//   components/InvoiceForm{Company}{Suffix}.tsx
//   utils/firebase{Company}{Suffix}.ts
//   utils/pdfGenerator{Company}{Suffix}.ts
//
// where {Company} is Mohit | Decoust | Asg
// and   {Suffix}  is ""     | PI      | PO
//
// Examples:
//   components/InvoiceFormMohit.tsx        (Invoices + Mohit)
//   components/InvoiceFormAsgPO.tsx        (PO       + ASG)
//   utils/firebaseDecoustPI.ts             (PI       + Decoust)
//   utils/pdfGeneratorMohitPO.ts           (PO       + Mohit)
//
// To add a new company later, extend NAME_BY_COMPANY and the CompanyId type
// — nothing else in this file changes.

type Loader<T = unknown> = () => Promise<T>;

const invoiceFormModules = import.meta.glob(
  "./components/InvoiceForm*.tsx",
) as Record<string, Loader<{ default: React.ComponentType }>>;

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

/**
 * Returns a React.lazy component for the requested (type, company) pair, or
 * null if the file has not been added yet.
 */
export function getInvoiceFormComponent(
  type: InvoiceType,
  company: CompanyId,
): React.LazyExoticComponent<React.ComponentType> | null {
  const loader = invoiceFormModules[invoiceFormKey(type, company)];
  if (!loader) return null;
  return React.lazy(loader);
}

/**
 * Dynamically imports the company-specific firebase implementation. Call this
 * inside your InvoiceForm (or a hook) if you prefer to route through the
 * resolver instead of importing `./firebaseMohit` etc. directly.
 */
export async function loadFirebase(type: InvoiceType, company: CompanyId) {
  const loader = firebaseModules[firebaseKey(type, company)];
  if (!loader) {
    throw new Error(`Missing firebase module: ${firebaseKey(type, company)}`);
  }
  return await loader();
}

/**
 * Dynamically imports the company-specific PDF generator.
 */
export async function loadPdfGenerator(type: InvoiceType, company: CompanyId) {
  const loader = pdfModules[pdfKey(type, company)];
  if (!loader) {
    throw new Error(`Missing pdfGenerator module: ${pdfKey(type, company)}`);
  }
  return await loader();
}

/** Introspection helpers — useful for debugging or building admin UIs. */
export function listAvailableInvoiceForms(): string[] {
  return Object.keys(invoiceFormModules);
}
export function listAvailableFirebaseModules(): string[] {
  return Object.keys(firebaseModules);
}
export function listAvailablePdfModules(): string[] {
  return Object.keys(pdfModules);
}