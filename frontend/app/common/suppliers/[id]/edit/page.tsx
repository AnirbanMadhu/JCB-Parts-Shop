import SupplierEditForm from "@/components/Common/SupplierEditForm";
import { notFound } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function fetchSupplier(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch supplier:', error);
    return null;
  }
}

export const metadata = {
  title: "Edit Supplier",
  description: "Edit supplier details",
};

export default async function EditSupplierPage({ params }: Props) {
  const { id } = await params;
  const supplier = await fetchSupplier(id);
  
  if (!supplier) {
    notFound();
  }
  
  return <SupplierEditForm supplier={supplier} />;
}
