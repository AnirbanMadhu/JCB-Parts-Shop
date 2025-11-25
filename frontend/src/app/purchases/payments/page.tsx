import PurchasePaymentsList from "@/app/purchases/_components/PurchasePaymentsList";
import { INTERNAL_API_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Purchase Payments",
  description: "Manage purchase payments",
};

async function fetchPurchaseInvoices() {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/invoices?type=PURCHASE`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch purchase invoices:", error);
    return [];
  }
}

export default async function PurchasePaymentsPage() {
  const payments = await fetchPurchaseInvoices();

  return <PurchasePaymentsList payments={payments} />;
}
