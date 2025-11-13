// components/Purchases/PurchasePaymentsList.tsx
import Link from "next/link";
import { Payment } from "@/lib/api";
import BackButton from "../Common/BackButton";
import { Filter, Plus } from "lucide-react";

type Props = {
  payments: Payment[];
};

export default function PurchasePaymentsList({ payments }: Props) {
  const hasRows = payments && payments.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Purchase Payment</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <Link href="/purchases/payments/new" className="p-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors inline-flex">
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="px-6 py-6">
        <div className="bg-white">
          {!hasRows ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-4">
                <svg className="w-20 h-20 text-gray-300" viewBox="0 0 80 80" fill="none">
                  <rect x="22" y="14" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="18" y="18" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-5">No entries found</p>
              <Link href="/purchases/payments/new" className="px-5 py-2 bg-[#2c3e50] text-white text-sm font-medium rounded-md hover:bg-[#1a252f] transition-colors">
                Make Entry
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[60px_repeat(5,1fr)] gap-4 px-4 py-3 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500">#</div>
                <div className="text-xs font-medium text-gray-500">Invoice No</div>
                <div className="text-xs font-medium text-gray-500">Date</div>
                <div className="text-xs font-medium text-gray-500">Method</div>
                <div className="text-xs font-medium text-gray-500">Reference</div>
                <div className="text-xs font-medium text-gray-500 text-right">Amount</div>
              </div>
              {payments.map((payment, i) => (
                <div key={payment.id} className="grid grid-cols-[60px_repeat(5,1fr)] gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                  <div className="text-sm text-gray-900">{i + 1}</div>
                  <div className="text-sm">
                    <Link href={`/purchases/invoices/${payment.invoiceNumber}`} className="text-blue-600 hover:underline">
                      {payment.invoiceNumber}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-900">{payment.date}</div>
                  <div className="text-sm text-gray-900">{payment.method}</div>
                  <div className="text-sm text-gray-900">{payment.reference}</div>
                  <div className="text-sm text-gray-900 text-right">
                    {payment.amount.toLocaleString(undefined, {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
