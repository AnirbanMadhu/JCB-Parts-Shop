// app/purchases/invoices/new/page.tsx
"use client";
import PurchaseInvoiceForm from "@/app/purchases/_components/PurchaseInvoiceForm";

export default function NewPurchaseInvoicePage() {
  // Optional: preload suppliers/products on server if you want
  return <PurchaseInvoiceForm />;
}
