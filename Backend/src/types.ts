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
  status?: 'DRAFT' | 'SUBMITTED' | 'PAID' | 'CANCELLED';
  supplierId?: number | null;
  customerId?: number | null;
  items: InvoiceItemBody[];
  discountPercent?: number;
  discountAmount?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  deliveryNote?: string;
  buyerOrderNo?: string;
  dispatchDocNo?: string;
  deliveryNoteDate?: string;
  dispatchedThrough?: string;
  termsOfDelivery?: string;
  allowEditSubmitted?: boolean;
}

export interface SupplierCreateBody {
  name: string;
  email?: string;
  contactPerson?: string;
  address?: string;
  phone?: string;
  gstin?: string;
  state?: string;
}

export interface CustomerCreateBody {
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  gstin?: string;
  state?: string;
}
