import CustomerEditForm from "@/components/ui/CustomerEditForm";
import { INTERNAL_API_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getCustomer(id: string) {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/customers/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return null;
  }
}

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);

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

  return <CustomerEditForm customer={customer} />;
}
