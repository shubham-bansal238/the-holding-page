import {
  collection,
  doc,
  FieldPath,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { CustomerDoc, CustomerPaymentRef, RawInvoice } from "@/lib/types";
import { toCustomerInvoiceRef } from "@/lib/invoice-utils";
import { isAfterCutoff } from "@/lib/period";

export async function fetchAllCustomers(): Promise<Record<string, CustomerDoc>> {
  const snap = await getDocs(collection(getDb(), "customers"));
  const out: Record<string, CustomerDoc> = {};
  snap.docs.forEach((d) => {
    out[d.id] = d.data() as CustomerDoc;
  });
  return out;
}

export async function fetchCustomer(gstin: string): Promise<CustomerDoc | null> {
  const snap = await getDoc(doc(getDb(), "customers", gstin));
  return snap.exists() ? (snap.data() as CustomerDoc) : null;
}

export async function updateInvoicePayment(
  gstin: string,
  invoiceNumber: string,
  payment: CustomerPaymentRef,
): Promise<void> {
  // Use FieldPath so invoice numbers containing "." or "/" don't get parsed
  // as nested field segments.
  await updateDoc(
    doc(getDb(), "customers", gstin),
    new FieldPath("payments", invoiceNumber),
    sanitizePayment(payment),
  );
}

export async function deleteInvoicePayment(
  gstin: string,
  invoiceNumber: string,
): Promise<void> {
  await updateDoc(
    doc(getDb(), "customers", gstin),
    new FieldPath("payments", invoiceNumber),
    {
      invoiceNumber,
      rmCost: null,
      status: "unpaid",
      profit: null,
      chequeNos: [],
      paymentDates: [],
      bank: "",
      tds: null,
      entries: [],
    } satisfies CustomerPaymentRef,
  );
}

// Firestore rejects `undefined`. Ensure all fields are defined values.
function sanitizePayment(p: CustomerPaymentRef): CustomerPaymentRef {
  const entries = (p.entries ?? []).map((e) => ({
    amountReceived: e.amountReceived ?? 0,
    paymentDate: e.paymentDate ?? "",
    paymentMethod: e.paymentMethod ?? "bank-transfer",
    chequeOrRef: e.chequeOrRef ?? "",
    bankName: e.bankName ?? "",
    tds: e.tds ?? null,
  }));
  const paymentDates = entries
    .map((e) => e.paymentDate)
    .filter((d): d is string => Boolean(d));
  const chequeNos = entries
    .map((e) => e.chequeOrRef)
    .filter((c): c is string => Boolean(c));
  return {
    invoiceNumber: p.invoiceNumber,
    rmCost: p.rmCost ?? null,
    status: p.status ?? "unpaid",
    profit: p.profit ?? null,
    chequeNos,
    paymentDates,
    bank: p.bank ?? "",
    tds: p.tds ?? null,
    entries,
  };
}

export async function updateCustomerCreditDays(
  gstin: string,
  creditDays: number | null,
): Promise<void> {
  await updateDoc(doc(getDb(), "customers", gstin), {
    "details.creditDays": creditDays,
  });
}

export async function syncCustomersFromInvoices(
  invoices: RawInvoice[],
): Promise<{ created: number; updated: number; skipped: number }> {
  const existing = await fetchAllCustomers();

  const grouped = new Map<string, RawInvoice[]>();
  let skipped = 0;
  for (const inv of invoices) {
    const gstin = inv.consignee?.gstin?.trim();
    if (!gstin) {
      skipped++;
      continue;
    }
    // Only sync invoices dated on or after the cutoff (1 April 2026).
    if (!isAfterCutoff(inv.invoiceDate)) {
      skipped++;
      continue;
    }
    if (!grouped.has(gstin)) grouped.set(gstin, []);
    grouped.get(gstin)!.push(inv);
  }

  let created = 0;
  let updated = 0;

  for (const [gstin, invs] of grouped.entries()) {
    const sorted = [...invs].sort((a, b) => {
      const ad = new Date(a.invoiceDate ?? 0).getTime();
      const bd = new Date(b.invoiceDate ?? 0).getTime();
      return bd - ad;
    });
    const latest = sorted[0];
    const consignee = latest.consignee ?? {};

    const prev = existing[gstin];
    const prevInvoices = prev?.invoices ?? {};
    const prevPayments = prev?.payments ?? {};

    const nextInvoices = { ...prevInvoices };
    const nextPayments = { ...prevPayments };
    for (const inv of invs) {
      const ref = toCustomerInvoiceRef(inv);
      if (!ref.invoiceNumber) continue;
      nextInvoices[ref.invoiceNumber] = ref;
      if (!nextPayments[ref.invoiceNumber]) {
        nextPayments[ref.invoiceNumber] = {
          invoiceNumber: ref.invoiceNumber,
          rmCost: null,
          status: "unpaid",
          profit: null,
          chequeNos: [],
          paymentDates: [],
          bank: "",
          tds: null,
        };
      }
    }

    const customerDoc: CustomerDoc = {
      details: {
        name: consignee.name ?? prev?.details.name ?? "",
        gstin,
        address: consignee.address ?? prev?.details.address ?? "",
        paymentTerms: latest.paymentTerms ?? prev?.details.paymentTerms ?? "",
        creditDays: prev?.details.creditDays ?? null,
        lastInvoiceDate: latest.invoiceDate ?? prev?.details.lastInvoiceDate ?? "",
        totalBusinessDone: prev?.details.totalBusinessDone ?? null,
        totalOutstanding: prev?.details.totalOutstanding ?? null,
      },
      invoices: nextInvoices,
      payments: nextPayments,
    };

    await setDoc(doc(getDb(), "customers", gstin), customerDoc, { merge: true });
    if (prev) updated++;
    else created++;
  }

  return { created, updated, skipped };
}