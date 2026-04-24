// lib/api.ts - Server and Client-side API utilities
import { cookies } from "next/headers";

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
    const res = await fetch(`/api/invoices?type=PURCHASE`, {
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
    const res = await fetch(`/api/invoices?type=SALE`, {
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
    const res = await fetch(`/api/customers`, {
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

export async function fetchCustomerById(id: string): Promise<Customer | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/customers/${id}`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return null;
  }
}

export async function fetchCustomerInvoices(customerId: string): Promise<Invoice[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/invoices?type=SALE&customerId=${customerId}`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch customer invoices:", error);
    return [];
  }
}

export async function fetchSuppliers(): Promise<any[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/suppliers`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return [];
  }
}

export async function fetchSupplierById(id: string): Promise<any | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/suppliers/${id}`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch supplier:", error);
    return null;
  }
}

export async function fetchSupplierInvoices(id: string): Promise<Invoice[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/invoices?type=PURCHASE&supplierId=${id}`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch supplier invoices:", error);
    return [];
  }
}

export async function fetchItems(
  onlyPurchased: boolean = false
): Promise<Item[]> {
  try {
    const headers = await getAuthHeaders();
    const url = `/api/stock${
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

export async function fetchItemById(id: string): Promise<Item | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/parts/${id}`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch item:", error);
    return null;
  }
}

export async function fetchItemStock(id: string): Promise<{ stock: number }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/stock/${id}`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return { stock: 0 };
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch item stock:", error);
    return { stock: 0 };
  }
}

export async function fetchPurchasePayments(): Promise<Payment[]> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/payments?type=PURCHASE`, {
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
    const res = await fetch(`/api/payments?type=SALE`, {
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

export async function fetchInvoiceById(id: string): Promise<any | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/invoices/${id}`, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return null;
  }
}

export async function fetchProfitAndLoss(startDate?: string, endDate?: string): Promise<any> {
  try {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.set('startDate', startDate);
    if (endDate) queryParams.set('endDate', endDate);

    const url = `/api/reports/profit-loss${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return {
        totalPurchases: 0,
        totalSales: 0,
        profitLoss: 0,
        profitMargin: '0%',
        startDate,
        endDate,
      };
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch profit/loss data:", error);
    return {
      totalPurchases: 0,
      totalSales: 0,
      profitLoss: 0,
      profitMargin: '0%',
      startDate,
      endDate,
    };
  }
}

export async function fetchBalanceSheet(asOfDate?: string): Promise<any> {
  try {
    const headers = await getAuthHeaders();
    const queryParams = new URLSearchParams();
    if (asOfDate) queryParams.set('asOfDate', asOfDate);

    const url = `/api/reports/balance-sheet${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      return {
        asOfDate: asOfDate || new Date().toISOString().split('T')[0],
        assets: {
          currentAssets: { cash: 0, accountsReceivable: 0, inventory: 0, total: 0 },
          total: 0,
        },
        liabilities: {
          currentLiabilities: { accountsPayable: 0, total: 0 },
          total: 0,
        },
        equity: { retainedEarnings: 0, total: 0 },
        totalLiabilitiesAndEquity: 0,
      };
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch balance sheet data:", error);
    return {
      asOfDate: asOfDate || new Date().toISOString().split('T')[0],
      assets: {
        currentAssets: { cash: 0, accountsReceivable: 0, inventory: 0, total: 0 },
        total: 0,
      },
      liabilities: {
        currentLiabilities: { accountsPayable: 0, total: 0 },
        total: 0,
      },
      equity: { retainedEarnings: 0, total: 0 },
      totalLiabilitiesAndEquity: 0,
    };
  }
}
