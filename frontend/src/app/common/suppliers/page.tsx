import SuppliersList from "@/components/ui/SuppliersList";
import { fetchSuppliers } from "@/lib/api";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Suppliers",
  description: "Manage suppliers",
};

export default async function SuppliersPage() {
  const suppliers = await fetchSuppliers();

  return <SuppliersList suppliers={suppliers} />;
}
