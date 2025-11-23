// Application-wide constants

export const APP_NAME = "S.P.TRADERS AND BUILDERS";
export const APP_DESCRIPTION = "JCB Parts Shop Management System";

// API Configuration
// Empty string means use same origin (Next.js will proxy to backend via rewrites)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Invoice Status
export const INVOICE_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  OVERDUE: 'OVERDUE',
} as const;

export const INVOICE_STATUS_LABELS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  PARTIAL: 'Partially Paid',
  OVERDUE: 'Overdue',
} as const;

export const INVOICE_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
  OVERDUE: 'bg-red-100 text-red-800',
} as const;

// Invoice Types
export const INVOICE_TYPE = {
  SALES: 'SALES',
  PURCHASE: 'PURCHASE',
} as const;

// Date Formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const DISPLAY_DATE_FORMAT = 'MMM DD, YYYY';
export const DISPLAY_DATETIME_FORMAT = 'MMM DD, YYYY HH:mm';

// Currency
export const CURRENCY_CODE = 'INR';
export const CURRENCY_SYMBOL = '₹';

// Validation
export const MIN_QUANTITY = 0;
export const MAX_QUANTITY = 999999;
export const MIN_PRICE = 0;
export const MAX_PRICE = 999999999;

// Toast Duration
export const TOAST_DURATION = 3000; // 3 seconds

// Navigation Items
export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/common', label: 'Common', icon: 'Database' },
  { href: '/sales', label: 'Sales', icon: 'TrendingUp' },
  { href: '/purchases', label: 'Purchases', icon: 'ShoppingCart' },
  { href: '/reports', label: 'Reports', icon: 'FileText' },
  { href: '/setup', label: 'Setup', icon: 'Settings' },
] as const;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
