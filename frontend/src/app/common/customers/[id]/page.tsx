"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CustomerDetails from "@/components/ui/CustomerDetails";
import { authFetch } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [customer, setCustomer] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        const [customerRes, invoicesRes] = await Promise.all([
          authFetch(`/api/customers/${id}`),
          authFetch(`/api/invoices?type=SALE&customerId=${id}`),
        ]);

        setCustomer(customerRes.ok ? await customerRes.json() : null);
        setInvoices(invoicesRes.ok ? await invoicesRes.json() : []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading customer...</div>;
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-red-600">
            Customer not found
          </h1>
          <p className="mt-2 text-gray-600">
            The customer you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return <CustomerDetails customer={customer} invoices={invoices} />;
}
