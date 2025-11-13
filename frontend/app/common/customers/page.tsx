import CustomersList from "@/components/Common/CustomersList";
import { fetchCustomers } from "@/lib/api";

export const metadata = {
  title: "Customers",
  description: "Manage customers",
};

export default async function CustomersPage() {
  const customers = await fetchCustomers();
  
  return <CustomersList customers={customers} />;
}
