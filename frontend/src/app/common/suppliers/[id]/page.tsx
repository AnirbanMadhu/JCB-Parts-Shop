import SupplierDetails from "@/components/ui/SupplierDetails";
import { notFound } from "next/navigation";
import { fetchSupplierById, fetchSupplierInvoices } from "@/lib/api";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params;
  const supplier = await fetchSupplierById(id);

  if (!supplier) {
    notFound();
  }

  const invoices = await fetchSupplierInvoices(id);

  return <SupplierDetails supplier={supplier} invoices={invoices} />;
}
