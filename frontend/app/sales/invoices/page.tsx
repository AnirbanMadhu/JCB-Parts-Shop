import SalesInvoicesList from "@/components/Sales/SalesInvoicesList";
import { fetchSalesInvoices } from "@/lib/api";

export const metadata = {
  title: "Sales Invoices",
  description: "Manage sales invoices",
};

export default async function SalesInvoicesPage() {
  const invoices = await fetchSalesInvoices();
  
  return <SalesInvoicesList invoices={invoices} />;
}
