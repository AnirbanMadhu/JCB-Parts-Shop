'use client';

import PurchaseInvoicesList from "@/app/purchases/_components/PurchaseInvoicesList";
import { useInvoices } from "@/hooks/useAPI";

export default function PurchaseInvoicesPage() {
  const { data: invoices, isLoading, error } = useInvoices('PURCHASE');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-destructive">
          <p>Failed to load invoices. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return <PurchaseInvoicesList invoices={invoices || []} />;
}
