// Global type definitions for the JCB Parts Shop application

export interface Customer {
  id: string;
  indexId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
}

export interface Part {
  id: string;
  name: string;
  partNumber: string;
  description?: string;
  category?: string;
  unitPrice: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'SALES' | 'PURCHASE';
  customerId?: string;
  supplierId?: string;
  date: Date;
  dueDate?: Date;
  totalAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';
  items: InvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  partId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  part?: Part;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalSales: number;
  totalPurchases: number;
  cashflow: number;
  pendingInvoices: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface SupplierFormData {
  name: string;
  email?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
}

export interface PartFormData {
  name: string;
  partNumber: string;
  description?: string;
  category?: string;
  unitPrice: number;
  quantity: number;
}
