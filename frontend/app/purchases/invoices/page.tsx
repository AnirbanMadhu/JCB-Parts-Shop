import PurchaseInvoicesList from "@/components/Purchases/PurchaseInvoicesList";
import { fetchPurchaseInvoices } from "@/lib/api";

export const metadata = {
  title: "Purchase Invoices",
  description: "Manage purchase invoices",
};

export default async function PurchaseInvoicesPage() {
  const invoices = await fetchPurchaseInvoices();
  
  return <PurchaseInvoicesList invoices={invoices} />;
}
