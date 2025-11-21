import SupplierEditForm from "@/components/ui/SupplierEditForm";
import { notFound } from "next/navigation";
import { API_BASE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

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
