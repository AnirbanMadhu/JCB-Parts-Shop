import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function SalesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Sales</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/sales/invoices"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sales Invoices</h2>
            <p className="text-gray-600 text-sm">Manage sales invoices and orders</p>
          </Link>
          <Link
            href="/sales/payments"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Sales Payments</h2>
            <p className="text-gray-600 text-sm">Track customer payments</p>
          </Link>
          <Link
            href="/common/customers"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Customers</h2>
            <p className="text-gray-600 text-sm">Manage customer information</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
