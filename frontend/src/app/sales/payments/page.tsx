import SalesPaymentsList from "@/app/sales/_components/SalesPaymentsList";
import { fetchSalesInvoices } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sales Payments",
  description: "View all sales transactions and payments",
};

export default async function SalesPaymentsPage() {
  const payments = await fetchSalesInvoices();

  return <SalesPaymentsList payments={payments} />;
}
