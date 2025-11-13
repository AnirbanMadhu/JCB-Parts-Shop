import PurchasePaymentsList from "@/components/Purchases/PurchasePaymentsList";
import { fetchPurchasePayments } from "@/lib/api";

export const metadata = {
  title: "Purchase Payments",
  description: "Manage purchase payments",
};

export default async function PurchasePaymentsPage() {
  const payments = await fetchPurchasePayments();
  
  return <PurchasePaymentsList payments={payments} />;
}
