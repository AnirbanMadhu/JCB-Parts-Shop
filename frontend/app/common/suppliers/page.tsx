import SuppliersList from "@/components/Common/SuppliersList";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export const metadata = {
  title: "Suppliers",
  description: "Manage suppliers",
};

async function fetchSuppliers() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/suppliers`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    return [];
  }
}

export default async function SuppliersPage() {
  const suppliers = await fetchSuppliers();
  
  return <SuppliersList suppliers={suppliers} />;
}
