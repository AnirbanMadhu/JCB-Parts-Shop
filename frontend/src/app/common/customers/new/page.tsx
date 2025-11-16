import CustomerForm from "@/components/ui/CustomerForm";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Add Customer",
  description: "Add a new customer",
};

export default function NewCustomerPage() {
  return <CustomerForm />;
}
