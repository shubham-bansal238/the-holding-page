import { collection, getDocs } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type { RawInvoice } from "@/lib/types";

export async function fetchAllInvoices(): Promise<RawInvoice[]> {
  const snap = await getDocs(collection(getDb(), "invoices"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RawInvoice, "id">) }));
}