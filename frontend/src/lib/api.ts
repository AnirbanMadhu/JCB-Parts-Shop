// lib/api.ts - Server and Client-side API utilities
import { cookies } from "next/headers";
import { INTERNAL_API_URL } from "@/lib/constants";

// Helper to get auth headers for server-side requests
async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  } catch {
    // In client-side context, cookies() is not available
    return {
      "Content-Type": "application/json",
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
  indexId?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  gstin?: string | null;
  state?: string | null;
};

export type Item = {
  id: number;
  partNumber: string;
  itemName: string;
  description?: string;
  hsnCode: string;
  gstPercent: number;
  unit: string;
  mrp?: number;
  rtl?: number;
  barcode?: string;
  qrCode?: string;
  stock: number;
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
    const res = await fetch(`${INTERNAL_API_URL}/api/invoices?type=PURCHASE`, {
      headers,
      cache: "no-store", // Always fetch fresh data
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch purchase invoices:", error);
    return [];
  }
}

export async function fetchSalesInvoices(): Promise<Invoice[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${INTERNAL_API_URL}/api/invoices?type=SALE`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch sales invoices:", error);
    return [];
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${INTERNAL_API_URL}/api/customers`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return [];
  }
}

export async function fetchItems(
  onlyPurchased: boolean = false
): Promise<Item[]> {
  try {
    const headers = await getAuthHeaders();
    const url = `${INTERNAL_API_URL}/api/stock${
      onlyPurchased ? "?onlyPurchased=true" : ""
    }`;
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return [];
  }
}

export async function fetchPurchasePayments(): Promise<Payment[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${INTERNAL_API_URL}/api/payments?type=PURCHASE`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch purchase payments:", error);
    return [];
  }
}

export async function fetchSalesPayments(): Promise<Payment[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${INTERNAL_API_URL}/api/payments?type=SALE`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch sales payments:", error);
    return [];
  }
}
