// components/Purchases/PurchaseInvoices.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Invoice = {
  id: string;
  number: string;
  status: "Draft" | "Submitted" | "Paid";
  supplierName: string;
  date: string;
  total: number;
};

export default function PurchaseInvoices({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const hasRows = invoices && invoices.length > 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Purchase Invoice</h1>
        <button
          onClick={() => router.push("/purchases/invoices/new")}
          className="rounded-md px-4 py-2 text-white bg-neutral-800 hover:bg-neutral-900"
        >
          Make Entry
        </button>
      </div>

      {!hasRows ? (
        <div className="mt-20 flex flex-col items-center justify-center gap-4">
          <div className="text-neutral-500">No entries found</div>
          <Link
            className="rounded-md px-4 py-2 text-white bg-neutral-800 hover:bg-neutral-900"
            href="/purchases/invoices/new"
          >
            Make Entry
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Invoice No</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Supplier</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-right">Base Grand Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id} className="border-t">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link
                      className="text-neutral-800 underline"
                      href={`/purchases/invoices/${inv.id}`}
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{inv.status}</td>
                  <td className="px-3 py-2">{inv.supplierName}</td>
                  <td className="px-3 py-2">{inv.date}</td>
                  <td className="px-3 py-2 text-right">
                    {inv.total.toLocaleString(undefined, {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
