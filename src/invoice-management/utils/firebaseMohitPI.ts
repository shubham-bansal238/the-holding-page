// Firebase configuration and initialization
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// Firebase config - You need to replace these with your actual Firebase credentials
const firebaseConfig = {
  apiKey: "AIzaSyBdLc0bp20D8qtz6Lk4figMNCqGEQZA4Yc",
  authDomain: "mi-invoice-d3bd4.firebaseapp.com",
  projectId: "mi-invoice-d3bd4",
  storageBucket: "mi-invoice-d3bd4.firebasestorage.app",
  messagingSenderId: "607704346127",
  appId: "1:607704346127:web:4d7b8495dd88c54adebd7a"
};

// Initialize Firebase
const APP_NAME = 'im-mohit-pi';
const app = getApps().find((a) => a.name === APP_NAME) ?? initializeApp(firebaseConfig, APP_NAME);
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
      const docRef = doc(db, 'pi', invoiceData.id);
      await updateDoc(docRef, dataToSave);
      return invoiceData.id;
    } else {
      // Create new invoice
      const docRef = await addDoc(collection(db, 'pi'), dataToSave);
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
    const querySnapshot = await getDocs(collection(db, 'pi'));
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
    const docRef = doc(db, 'pi', id);
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
    await deleteDoc(doc(db, 'pi', id));
  } catch (error) {
    console.error('Error deleting invoice:', error);
    throw new Error('Failed to delete invoice');
  }
};
