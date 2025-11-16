import SalesInvoicesList from "@/app/sales/_components/SalesInvoicesList";
import { fetchSalesInvoices } from "@/lib/api";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Sales Invoices",
  description: "Manage sales invoices",
};

export default async function SalesInvoicesPage() {
  const invoices = await fetchSalesInvoices();
  
  return <SalesInvoicesList invoices={invoices} />;
}
