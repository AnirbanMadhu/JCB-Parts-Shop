import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function CommonPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Common</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/common/items"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Items</h2>
            <p className="text-gray-600 text-sm">Manage inventory items and parts</p>
          </Link>
          <Link
            href="/common/customers"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Customers</h2>
            <p className="text-gray-600 text-sm">Manage customer information</p>
          </Link>
          <Link
            href="/common/suppliers"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Suppliers</h2>
            <p className="text-gray-600 text-sm">Manage supplier information</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
