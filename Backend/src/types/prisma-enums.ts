// Manual type definitions for Prisma enums
// These match the enums defined in prisma/schema.prisma

export enum InvoiceType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE'
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

export enum InventoryDirection {
  IN = 'IN',
  OUT = 'OUT'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  ON_CREDIT = 'ON_CREDIT'
}
