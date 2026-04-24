"use client";

import { useEffect, useState } from "react";
import PurchasePaymentsList from "@/app/purchases/_components/PurchasePaymentsList";
import { authFetch } from "@/lib/auth";
import type { Invoice } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function PurchasePaymentsPage() {
  const [payments, setPayments] = useState<Invoice[]>([]);

  useEffect(() => {
    const loadPayments = async () => {
      const response = await authFetch('/api/invoices?type=PURCHASE');
      const data = response.ok ? await response.json() : [];
      setPayments(data);
    };

    loadPayments();
  }, []);

  return <PurchasePaymentsList payments={payments} />;
}
