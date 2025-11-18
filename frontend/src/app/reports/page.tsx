import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Reports</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/reports/profit-and-loss"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Profit and Loss</h2>
            <p className="text-gray-600 text-sm">View profit and loss statements</p>
          </Link>
          <Link
            href="/reports/balance-sheet"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Balance Sheet</h2>
            <p className="text-gray-600 text-sm">View balance sheet reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
