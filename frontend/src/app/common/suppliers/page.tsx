import SuppliersList from "@/components/ui/SuppliersList";
import { INTERNAL_API_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Suppliers",
  description: "Manage suppliers",
};

async function fetchSuppliers() {
  try {
    const res = await fetch(`${INTERNAL_API_URL}/api/suppliers`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return [];
  }
}

export default async function SuppliersPage() {
  const suppliers = await fetchSuppliers();

  return <SuppliersList suppliers={suppliers} />;
}
