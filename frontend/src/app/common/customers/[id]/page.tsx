import CustomerDetails from "@/components/ui/CustomerDetails";
import { fetchCustomerById, fetchCustomerInvoices } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, invoices] = await Promise.all([
    fetchCustomerById(id),
    fetchCustomerInvoices(id),
  ]);

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-red-600">
            Customer not found
          </h1>
          <p className="mt-2 text-gray-600">
            The customer you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return <CustomerDetails customer={customer} invoices={invoices} />;
}
