// app/sales/invoices/new/page.tsx
import SalesInvoiceForm from "@/app/sales/_components/SalesInvoiceForm";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "New Sales Invoice",
};

export default function NewSalesInvoicePage() {
  return <SalesInvoiceForm />;
}
