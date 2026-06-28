'use client';

import PurchaseInvoicesList from "@/app/purchases/_components/PurchaseInvoicesList";
import { useInvoices } from "@/hooks/useAPI";

export default function PurchaseInvoicesPage() {
  const { data: invoices, isLoading, error } = useInvoices('PURCHASE');

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8 sm:py-12">
        <div className="text-center max-w-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8 sm:py-12">
        <div className="text-center text-destructive max-w-sm">
          <p className="text-sm sm:text-base">Failed to load invoices. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return <PurchaseInvoicesList invoices={invoices || []} />;
}
