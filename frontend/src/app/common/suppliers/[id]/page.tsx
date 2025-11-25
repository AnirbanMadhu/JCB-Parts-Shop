import SupplierDetails from "@/components/ui/SupplierDetails";
import { notFound } from "next/navigation";
import { INTERNAL_API_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function fetchSupplier(id: string) {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/suppliers/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch supplier:", error);
    return null;
  }
}

async function fetchSupplierInvoices(id: string) {
  try {
    const res = await fetch(
      `${INTERNAL_API_URL}/api/invoices?type=PURCHASE&supplierId=${id}`,
      {
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch supplier invoices:", error);
    return [];
  }
}

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params;
  const supplier = await fetchSupplier(id);

  if (!supplier) {
    notFound();
  }

  const invoices = await fetchSupplierInvoices(id);

  return <SupplierDetails supplier={supplier} invoices={invoices} />;
}
