"use client";

import { useEffect, useState } from "react";
import CustomersList from "@/components/ui/CustomersList";
import { authFetch } from "@/lib/auth";
import type { Customer } from "@/lib/api";

export const dynamic = 'force-dynamic';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await authFetch('/api/customers');
        const data = response.ok ? await response.json() : [];
        setCustomers(data);
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading customers...</div>;
  }

  return <CustomersList customers={customers} />;
}
