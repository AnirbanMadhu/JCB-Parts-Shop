// components/Purchases/PurchaseInvoicesList.tsx
'use client';

import Link from "next/link";
import { Invoice } from "@/lib/api";
import BackButton from "@/components/ui/BackButton";
import { useSettings } from "@/hooks/useSettings";

type Props = {
  invoices: Invoice[];
};

export default function PurchaseInvoicesList({ invoices }: Props) {
  const { settings, isLoaded } = useSettings();
  const hasRows = invoices && invoices.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Purchase Invoice</h1>
        </div>
        <Link href="/purchases/invoices/new" className="flex items-center gap-2 px-4 py-1.5 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Link>
      </header>

      {/* Table Container */}
      <div className="px-6 py-6">
        <div className="bg-white">
          {!hasRows ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-4">
                <svg
                  className="w-20 h-20 text-gray-300"
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="22" y="14" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="18" y="18" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="24" y="28" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <line x1="36" y1="31" x2="48" y2="31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="36" y1="34" x2="44" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <rect x="24" y="42" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <line x1="36" y1="45" x2="48" y2="45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="36" y1="48" x2="44" y2="48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-5">No entries found</p>
              <Link
                href="/purchases/invoices/new"
                className="px-5 py-2 bg-[#2c3e50] text-white text-sm font-medium rounded-md hover:bg-[#1a252f] transition-colors"
              >
                Make Entry
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[60px_repeat(6,1fr)] gap-4 px-4 py-3 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500">#</div>
                <div className="text-xs font-medium text-gray-500">Invoice No</div>
                <div className="text-xs font-medium text-gray-500">Status</div>
                <div className="text-xs font-medium text-gray-500">Supplier</div>
                <div className="text-xs font-medium text-gray-500">Date</div>
                <div className="text-xs font-medium text-gray-500">Base Grand Total</div>
                <div className="text-xs font-medium text-gray-500">Outstanding Amount</div>
              </div>

              {/* Table Body */}
              {invoices.map((inv, i) => (
                <div key={inv.id} className="grid grid-cols-[60px_repeat(6,1fr)] gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                  <div className="text-sm text-gray-900">{i + 1}</div>
                  <div className="text-sm">
                    <Link href={`/purchases/invoices/${inv.id}`} className="text-blue-600 hover:underline font-medium">
                      {inv.invoiceNumber}
                    </Link>
                  </div>
                  <div className="text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        inv.status === "DRAFT"
                          ? "bg-yellow-100 text-yellow-800"
                          : inv.status === "SUBMITTED"
                          ? "bg-blue-100 text-blue-800"
                          : inv.status === "PAID"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {inv.status}
                    </span>
                    {isLoaded && (settings.purchases.allowEditSubmitted || inv.status === "DRAFT") && (
                      <Link
                        href={`/purchases/invoices/${inv.id}/edit`}
                        className="ml-2 text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                  <div className="text-sm text-gray-900">{inv.supplier?.name || '-'}</div>
                  <div className="text-sm text-gray-900">
                    {new Date(inv.date).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </div>
                  <div className="text-sm text-gray-900 font-medium">
                    {inv.total.toLocaleString(undefined, {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-sm text-gray-900">₹0.00</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
