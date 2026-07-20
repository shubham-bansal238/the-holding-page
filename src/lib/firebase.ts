import { initializeApp, getApp, getApps, type FirebaseOptions } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

export type CompanyId = "decousttech" | "mohit" | "asg";

export interface CompanyEntry {
  id: CompanyId;
  name: string;
  config: FirebaseOptions;
}

// Add more companies by appending an entry — no other code changes needed.
export const COMPANIES: CompanyEntry[] = [
  {
    id: "mohit",
    name: "Mohit International",
    config: {
      apiKey: "AIzaSyBdLc0bp20D8qtz6Lk4figMNCqGEQZA4Yc",
      authDomain: "mi-invoice-d3bd4.firebaseapp.com",
      projectId: "mi-invoice-d3bd4",
      storageBucket: "mi-invoice-d3bd4.firebasestorage.app",
      messagingSenderId: "607704346127",
      appId: "1:607704346127:web:4d7b8495dd88c54adebd7a",
    },
  },
  {
    id: "decousttech",
    name: "DecoustTech Pvt Ltd",
    config: {
      apiKey: "AIzaSyAQPQ1Fr2Bi1Q14p_788-yfhw-p_PFPu-0",
      authDomain: "invoicegen-704ee.firebaseapp.com",
      projectId: "invoicegen-704ee",
      storageBucket: "invoicegen-704ee.firebasestorage.app",
      messagingSenderId: "478006670936",
      appId: "1:478006670936:web:516f59a7822639653ebc2d",
    },
  },
  {
    id: "asg",
    name: "ASG Thermotech",
    config: {
      apiKey: "AIzaSyCzRohcQRK1wagAXNsmjYEEaka_8g4P1Xo",
      authDomain: "asg-invoice.firebaseapp.com",
      projectId: "asg-invoice",
      storageBucket: "asg-invoice.firebasestorage.app",
      messagingSenderId: "139182209656",
      appId: "1:139182209656:web:ca0205806d8062a91f0b8d",
    },
  },
];

export function getCompany(id: CompanyId): CompanyEntry | undefined {
  return COMPANIES.find((c) => c.id === id);
}

const dbCache = new Map<CompanyId, Firestore>();

function getFirebaseApp(company: CompanyEntry) {
  const appName = `ar-${company.id}`;
  const existing = getApps().find((a) => a.name === appName);
  return existing ?? initializeApp(company.config, appName);
}

export function getDbFor(id: CompanyId): Firestore {
  const cached = dbCache.get(id);
  if (cached) return cached;
  const company = getCompany(id);
  if (!company) throw new Error(`Unknown company: ${id}`);
  const db = getFirestore(getFirebaseApp(company));
  dbCache.set(id, db);
  return db;
}

// Reads the currently-selected company from session storage and returns its
// Firestore instance. Throws if no company is selected — every data call
// happens after the auth gate, which guarantees selection.
export function getDb(): Firestore {
  const id = getSelectedCompanyId();
  if (!id) throw new Error("No company selected");
  return getDbFor(id);
}

const SESSION_KEY = "ar.session";

export type SecretCode = "rasp90" | "torp80";

export type AppModule = "outstanding" | "invoice";

export interface Session {
  code: SecretCode;
  company: CompanyId | null;
  module?: AppModule | null;
}

export function allowedCompaniesFor(code: SecretCode): CompanyId[] {
  if (code === "torp80") return ["asg"];
  return ["mohit", "decousttech", "asg"];
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (parsed.code !== "rasp90" && parsed.code !== "torp80") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function getSelectedCompanyId(): CompanyId | null {
  return readSession()?.company ?? null;
}