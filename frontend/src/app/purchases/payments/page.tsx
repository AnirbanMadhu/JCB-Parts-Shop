import PurchasePaymentsList from "@/app/purchases/_components/PurchasePaymentsList";
import { fetchPurchaseInvoices } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Purchase Payments",
  description: "Manage purchase payments",
};

export default async function PurchasePaymentsPage() {
  const payments = await fetchPurchaseInvoices();

  return <PurchasePaymentsList payments={payments} />;
}
