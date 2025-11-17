/**
 * Custom hooks for API calls using SWR
 * Optimized data fetching with caching and revalidation
 */

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { fetcher, mutationFetcher, realtimeConfig, staticConfig } from '@/lib/swr-config';

// Types
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

export type Supplier = {
  id: number;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  address: string;
  gstNumber?: string;
};

export type Part = {
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
  stock?: number;
};

export type StockItem = Part & {
  stock: number;
};

// Invoices hooks
export function useInvoices(type?: 'PURCHASE' | 'SALE') {
  const url = type ? `/api/invoices?type=${type}` : '/api/invoices';
  return useSWR<Invoice[]>(url, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 10000, // Refresh every 10 seconds
  });
}

export function useInvoice(id: number | null) {
  const url = id ? `/api/invoices/${id}` : null;
  return useSWR<Invoice>(url, fetcher);
}

export function useCreateInvoice() {
  return useSWRMutation('/api/invoices', async (url, { arg }: { arg: any }) => {
    return mutationFetcher(url, { arg: { method: 'POST', body: arg } });
  });
}

export function useUpdateInvoice(id: number) {
  return useSWRMutation(`/api/invoices/${id}`, async (url, { arg }: { arg: any }) => {
    return mutationFetcher(url, { arg: { method: 'PUT', body: arg } });
  });
}

export function useUpdateInvoicePayment(id: number) {
  return useSWRMutation(`/api/invoices/${id}`, async (url, { arg }: { arg: any }) => {
    return mutationFetcher(url, { arg: { method: 'PATCH', body: arg } });
  });
}

// Customers hooks
export function useCustomers() {
  return useSWR<Customer[]>('/api/customers', fetcher, staticConfig);
}

export function useCustomer(id: number | null) {
  const url = id ? `/api/customers/${id}` : null;
  return useSWR<Customer>(url, fetcher);
}

export function useCreateCustomer() {
  return useSWRMutation('/api/customers', async (url, { arg }: { arg: any }) => {
    return mutationFetcher(url, { arg: { method: 'POST', body: arg } });
  });
}

export function useUpdateCustomer(id: number) {
  return useSWRMutation(`/api/customers/${id}`, async (url, { arg }: { arg: any }) => {
    return mutationFetcher(url, { arg: { method: 'PUT', body: arg } });
  });
}

export function useDeleteCustomer(id: number) {
  return useSWRMutation(`/api/customers/${id}`, async (url) => {
    return mutationFetcher(url, { arg: { method: 'DELETE' } });
  });
}

// Suppliers hooks
export function useSuppliers() {
  return useSWR<Supplier[]>('/api/suppliers', fetcher, staticConfig);
}

export function useSupplier(id: number | null) {
  const url = id ? `/api/suppliers/${id}` : null;
  return useSWR<Supplier>(url, fetcher);
}

export function useCreateSupplier() {
  return useSWRMutation('/api/suppliers', async (url, { arg }: { arg: any }) => {
    return mutationFetcher(url, { arg: { method: 'POST', body: arg } });
  });
}

export function useUpdateSupplier(id: number) {
  return useSWRMutation(`/api/suppliers/${id}`, async (url, { arg }: { arg: any }) => {
    return mutationFetcher(url, { arg: { method: 'PUT', body: arg } });
  });
}

export function useDeleteSupplier(id: number) {
  return useSWRMutation(`/api/suppliers/${id}`, async (url) => {
    return mutationFetcher(url, { arg: { method: 'DELETE' } });
  });
}

// Parts hooks
export function useParts(searchQuery?: string) {
  const url = searchQuery ? `/api/parts/search?q=${encodeURIComponent(searchQuery)}` : '/api/parts/search';
  return useSWR<Part[]>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
}

export function usePart(id: number | null) {
  const url = id ? `/api/parts/${id}` : null;
  return useSWR<Part>(url, fetcher);
}

export function useSearchPartByBarcode(barcode: string | null) {
  const url = barcode ? `/api/parts/search?barcode=${encodeURIComponent(barcode)}` : null;
  return useSWR<Part>(url, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
}

export function useCreatePart() {
  return useSWRMutation('/api/parts', async (url, { arg }: { arg: any }) => {
    return mutationFetcher(url, { arg: { method: 'POST', body: arg } });
  });
}

export function useUpdatePart(id: number) {
  return useSWRMutation(`/api/parts/${id}`, async (url, { arg }: { arg: any }) => {
    return mutationFetcher(url, { arg: { method: 'PUT', body: arg } });
  });
}

export function useDeletePart(id: number) {
  return useSWRMutation(`/api/parts/${id}`, async (url) => {
    return mutationFetcher(url, { arg: { method: 'DELETE' } });
  });
}

// Stock hooks
export function useStock() {
  return useSWR<StockItem[]>('/api/stock', fetcher, realtimeConfig);
}

export function usePartStock(partId: number | null) {
  const url = partId ? `/api/stock/${partId}` : null;
  return useSWR<{ partId: number; stock: number }>(url, fetcher, realtimeConfig);
}

export function useAdjustStock(partId: number) {
  return useSWRMutation(`/api/stock/${partId}/adjust`, async (url, { arg }: { arg: { quantity: number } }) => {
    return mutationFetcher(url, { arg: { method: 'POST', body: arg } });
  });
}
