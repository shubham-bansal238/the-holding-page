// Firebase configuration and initialization
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Firebase config - You need to replace these with your actual Firebase credentials
const firebaseConfig = {
  apiKey: "AIzaSyAQPQ1Fr2Bi1Q14p_788-yfhw-p_PFPu-0",
  authDomain: "invoicegen-704ee.firebaseapp.com",
  projectId: "invoicegen-704ee",
  storageBucket: "invoicegen-704ee.firebasestorage.app",
  messagingSenderId: "478006670936",
  appId: "1:478006670936:web:516f59a7822639653ebc2d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Invoice interface
export interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  invoiceDate: string;
  documentNo: string;
  paymentTerms: string;
  poNo: string;
  poDate: string;
  rrLrNo: string;
  rrLrDate: string;
  eWayBillNo: string;
  eWayBillDate: string;
  challanNumber: string;
  challanDate: string;
  lcNo: string;
  termsOfDelivery: string;
  insuranceText: string;
  paymentDueDate: string;
  documentsThru: string;
  freightText: string;
  gstRate: number;
  seller: {
    name: string;
    address: string;
    gstin: string;
    email: string;
  };
  consignee: {
    name: string;
    address: string;
    gstin: string;
    destination: string;
    modeOfTransport: string;
    vehicleNo: string;
    dateOfRemoval: string;
    timeOfRemoval: string;
  };
  buyer: {
    name: string;
    address: string;
    gstin: string;
  };
  buyerSameAsConsignee: boolean;
  products: Array<{
    sNo: number;
    packages: string;
    description: string;
    hsn: string;
    unit: string;
    rate: number;
    qty: number;
    amount: number;
  }>;
  freight: number;
  insurance: number;
  tcs: number;
  amountInWords: string;
  terms: string;
  bankDetails: string;
  approxWeight: number;
  isIgstApplicable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Save invoice to Firebase
export const saveInvoice = async (invoiceData: InvoiceData): Promise<string> => {
  try {
    const timestamp = new Date().toISOString();
    const dataToSave = {
      ...invoiceData,
      createdAt: invoiceData.createdAt || timestamp,
      updatedAt: timestamp
    };

    if (invoiceData.id) {
      // Update existing invoice
      const docRef = doc(db, 'invoices', invoiceData.id);
      await updateDoc(docRef, dataToSave);
      return invoiceData.id;
    } else {
      // Create new invoice
      const docRef = await addDoc(collection(db, 'invoices'), dataToSave);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving invoice:', error);
    throw new Error('Failed to save invoice');
  }
};

// Get all invoices from Firebase
export const getInvoices = async (): Promise<InvoiceData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'invoices'));
    const invoices: InvoiceData[] = [];

    querySnapshot.forEach((doc) => {
      invoices.push({
        id: doc.id,
        ...doc.data()
      } as InvoiceData);
    });

    return invoices.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.invoiceDate);
      const dateB = new Date(b.createdAt || b.invoiceDate);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw new Error('Failed to fetch invoices');
  }
};

// Get single invoice by ID
export const getInvoiceById = async (id: string): Promise<InvoiceData | null> => {
  try {
    const docRef = doc(db, 'invoices', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as InvoiceData;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching invoice:', error);
    throw new Error('Failed to fetch invoice');
  }
};

// Delete invoice from Firebase
export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'invoices', id));
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw new Error('Failed to delete invoice');
  }
};
