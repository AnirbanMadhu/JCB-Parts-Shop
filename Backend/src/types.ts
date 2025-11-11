export interface PartCreateBody {
  partNumber: string;
  itemName: string;
  description?: string;
  hsnCode: string;
  gstPercent?: number;
  unit?: string;
  mrp?: number;
  rtl?: number;
  barcode?: string;
  qrCode?: string;
}

export interface InvoiceItemBody {
  partId: number;
  quantity: number;
  rate: number;
  unit?: string;
}

export interface InvoiceCreateBody {
  invoiceNumber: string;
  date: string;
  type: 'PURCHASE' | 'SALE';
  supplierId?: number | null;
  customerId?: number | null;
  items: InvoiceItemBody[];
  discountPercent?: number;
  cgstPercent?: number;
  sgstPercent?: number;
}

export interface SupplierCreateBody {
  name: string;
  address?: string;
  phone?: string;
  gstin?: string;
  state?: string;
}

export interface CustomerCreateBody {
  name: string;
  address?: string;
  phone?: string;
  gstin?: string;
  state?: string;
}
