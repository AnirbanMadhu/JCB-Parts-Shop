"use client";

import { useEffect, useState } from "react";
import SalesPaymentsList from "@/app/sales/_components/SalesPaymentsList";
import { authFetch } from "@/lib/auth";
import type { Invoice } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function SalesPaymentsPage() {
  const [payments, setPayments] = useState<Invoice[]>([]);

  useEffect(() => {
    const loadPayments = async () => {
      const response = await authFetch('/api/invoices?type=SALE');
      const data = response.ok ? await response.json() : [];
      setPayments(data);
    };

    loadPayments();
  }, []);

  return <SalesPaymentsList payments={payments} />;
}
