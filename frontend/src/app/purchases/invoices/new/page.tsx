// app/purchases/invoices/new/page.tsx
import PurchaseInvoiceForm from "@/app/purchases/_components/PurchaseInvoiceForm";

export const dynamic = 'force-dynamic';

export default function NewPurchaseInvoicePage() {
  // Optional: preload suppliers/products on server if you want
  return <PurchaseInvoiceForm />;
}
