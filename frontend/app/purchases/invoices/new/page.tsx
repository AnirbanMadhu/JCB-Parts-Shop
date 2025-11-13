// app/purchases/invoices/new/page.tsx
import PurchaseInvoiceForm from "@/components/Purchases/PurchaseInvoiceForm";

export const metadata = {
  title: "New Purchase Invoice",
};

export default function NewPurchaseInvoicePage() {
  // Optional: preload suppliers/products on server if you want
  return <PurchaseInvoiceForm />;
}
