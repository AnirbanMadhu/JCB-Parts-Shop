import SalesPaymentsList from "@/app/sales/_components/SalesPaymentsList";
import { INTERNAL_API_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function fetchSalesInvoices() {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/invoices?type=SALE`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch sales invoices:", error);
    return [];
  }
}

export const metadata = {
  title: "Sales Payments",
  description: "View all sales transactions and payments",
};

export default async function SalesPaymentsPage() {
  const payments = await fetchSalesInvoices();

  return <SalesPaymentsList payments={payments} />;
}
