"use client";

import { useEffect, useState } from "react";
import SuppliersList from "@/components/ui/SuppliersList";
import { authFetch } from "@/lib/auth";

type Supplier = {
  id: number;
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  address: string;
  gstNumber?: string;
};

export const dynamic = "force-dynamic";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await authFetch('/api/suppliers');
        const data = response.ok ? await response.json() : [];
        setSuppliers(data);
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading suppliers...</div>;
  }

  return <SuppliersList suppliers={suppliers} />;
}
