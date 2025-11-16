import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function PurchasesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Purchases</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/purchases/invoices"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Purchase Invoices</h2>
            <p className="text-gray-600 text-sm">Manage purchase invoices and orders</p>
          </Link>
          <Link
            href="/purchases/payments"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Purchase Payments</h2>
            <p className="text-gray-600 text-sm">Track supplier payments</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
