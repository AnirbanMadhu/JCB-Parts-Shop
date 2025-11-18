// components/Sales/SalesInvoicesList.tsx
'use client';

import Link from "next/link";
import { Invoice } from "@/lib/api";
import BackButton from "@/components/ui/BackButton";
import { useSettings } from "@/hooks/useSettings";

type Props = {
  invoices: Invoice[];
};

export default function SalesInvoicesList({ invoices }: Props) {
  const { settings, isLoaded } = useSettings();
  const hasRows = invoices && invoices.length > 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Fixed */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-[17px] font-semibold text-foreground">Sales Invoice</h1>
          </div>
        </div>
        <Link href="/sales/invoices/new" className="flex items-center gap-2 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm hover:shadow-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </header>

      {/* Table Container - Scrollable */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm animate-fade-in">{!hasRows ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-4">
                <svg
                  className="w-20 h-20 text-muted"
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="22" y="14" width="40" height="48" rx="2" fill="hsl(var(--card))" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="18" y="18" width="40" height="48" rx="2" fill="hsl(var(--card))" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="24" y="28" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <line x1="36" y1="31" x2="48" y2="31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="36" y1="34" x2="44" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="24" y="42" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <line x1="36" y1="45" x2="48" y2="45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="36" y1="48" x2="44" y2="48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-5">No entries found</p>
              <Link
                href="/sales/invoices/new"
                className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
              >
                Make Entry
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[60px_repeat(6,1fr)] gap-4 px-4 py-3 border-b border-border bg-muted/30">
                <div className="text-xs font-medium text-muted-foreground">#</div>
                <div className="text-xs font-medium text-muted-foreground">Invoice No</div>
                <div className="text-xs font-medium text-muted-foreground">Status</div>
                <div className="text-xs font-medium text-muted-foreground">Customer</div>
                <div className="text-xs font-medium text-muted-foreground">Date</div>
                <div className="text-xs font-medium text-muted-foreground">Base Grand Total</div>
                <div className="text-xs font-medium text-muted-foreground">Outstanding Amount</div>
              </div>

              {/* Table Body */}
              {invoices.map((inv, i) => (
                <div key={inv.id} className="grid grid-cols-[60px_repeat(6,1fr)] gap-4 px-4 py-3 border-b border-border hover:bg-muted/20 transition-colors">
                  <div className="text-sm text-foreground">{i + 1}</div>
                  <div className="text-sm">
                    <Link href={`/sales/invoices/${inv.id}`} className="text-primary hover:underline font-medium transition-colors">
                      {inv.invoiceNumber}
                    </Link>
                  </div>
                  <div className="text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        inv.status === "DRAFT"
                          ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30"
                          : inv.status === "SUBMITTED"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                          : inv.status === "PAID"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {inv.status}
                    </span>
                    {isLoaded && (settings.sales.allowEditSubmitted || inv.status === "DRAFT") && (
                      <Link
                        href={`/sales/invoices/${inv.id}/edit`}
                        className="ml-2 text-xs text-primary hover:underline transition-colors"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                  <div className="text-sm text-foreground">{inv.customer?.name || '-'}</div>
                  <div className="text-sm text-foreground">
                    {new Date(inv.date).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                  <div className="text-sm text-foreground font-medium">
                    {inv.total.toLocaleString(undefined, {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-sm text-foreground">₹0.00</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
