// app/sales/invoices/new/page.tsx
import SalesInvoiceForm from "@/components/Sales/SalesInvoiceForm";

export const metadata = {
  title: "New Sales Invoice",
};

export default function NewSalesInvoicePage() {
  return <SalesInvoiceForm />;
}
