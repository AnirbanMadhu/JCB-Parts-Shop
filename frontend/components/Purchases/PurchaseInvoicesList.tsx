// components/Purchases/PurchaseInvoicesList.tsx
import Link from "next/link";
import { Invoice } from "@/lib/api";
import MakeEntryButton from "./MakeEntryButton";

type Props = {
  invoices: Invoice[];
};

export default function PurchaseInvoicesList({ invoices }: Props) {
  const hasRows = invoices && invoices.length > 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Purchase Invoice</h1>
        <MakeEntryButton href="/purchases/invoices/new" />
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
                <tr key={inv.id} className="border-t hover:bg-neutral-50">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link
                      className="text-blue-600 hover:underline font-medium"
                      href={`/purchases/invoices/${inv.id}`}
                    >
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
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
                    {inv.status === "DRAFT" && (
                      <Link
                        href={`/purchases/invoices/${inv.id}/edit`}
                        className="ml-2 text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                    )}
                  </td>
                  <td className="px-3 py-2">{inv.supplierName}</td>
                  <td className="px-3 py-2">
                    {new Date(inv.date).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
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
