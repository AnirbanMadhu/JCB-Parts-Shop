// lib/api.ts - Server and Client-side API utilities
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/constants';

// Helper to get auth headers for server-side requests
async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  } catch {
    // In client-side context, cookies() is not available
    return {
      'Content-Type': 'application/json',
    };
  }
}

export type Invoice = {
  id: number;
  invoiceNumber: string;
  status: "DRAFT" | "SUBMITTED" | "PAID" | "CANCELLED";
  date: string;
  total: number;
  supplier?: {
    id: number;
    name: string;
  };
  customer?: {
    id: number;
    name: string;
    indexId?: string;
  };
  type: "PURCHASE" | "SALE";
  paymentStatus?: string;
  paidAmount?: number;
  dueAmount?: number;
};

export type Customer = {
  id: number;
  indexId?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type Item = {
  id: number;
  partNumber: string;
  itemName: string;
  mrp: number;
  rtl: number;
  stock: number;
  unit: string;
};

export type Payment = {
  id: number;
  invoiceNumber: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
};

// Server-side data fetching functions
export async function fetchPurchaseInvoices(): Promise<Invoice[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/invoices?type=PURCHASE`, {
      headers,
      cache: 'no-store', // Always fetch fresh data
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch purchase invoices:', error);
    return [];
  }
}

export async function fetchSalesInvoices(): Promise<Invoice[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/invoices?type=SALE`, {
      headers,
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch sales invoices:', error);
    return [];
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/customers`, {
      headers,
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return [];
  }
}

export async function fetchItems(): Promise<Item[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/stock`, {
      headers,
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch items:', error);
    return [];
  }
}

export async function fetchPurchasePayments(): Promise<Payment[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/payments?type=PURCHASE`, {
      headers,
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch purchase payments:', error);
    return [];
  }
}

export async function fetchSalesPayments(): Promise<Payment[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/payments?type=SALE`, {
      headers,
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch sales payments:', error);
    return [];
  }
}
