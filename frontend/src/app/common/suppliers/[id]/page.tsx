"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SupplierDetails from "@/components/ui/SupplierDetails";
import { authFetch } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function SupplierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [supplier, setSupplier] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        const [supplierRes, invoicesRes] = await Promise.all([
          authFetch(`/api/suppliers/${id}`),
          authFetch(`/api/invoices?type=PURCHASE&supplierId=${id}`),
        ]);

        setSupplier(supplierRes.ok ? await supplierRes.json() : null);
        setInvoices(invoicesRes.ok ? await invoicesRes.json() : []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading supplier...</div>;
  }

  if (!supplier) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-red-600">Supplier not found</h1>
          <p className="mt-2 text-gray-600">The supplier you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <SupplierDetails supplier={supplier} invoices={invoices} />;
}
