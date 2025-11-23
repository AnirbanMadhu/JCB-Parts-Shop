import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  return (
    <div className="h-full bg-background p-4 sm:p-6 md:p-8 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6">Reports</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/reports/profit-and-loss"
            className="bg-white dark:bg-card rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow touch-manipulation"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-card-foreground mb-2">Profit and Loss</h2>
            <p className="text-gray-600 dark:text-muted-foreground text-sm">View profit and loss statements</p>
          </Link>
          <Link
            href="/reports/balance-sheet"
            className="bg-white dark:bg-card rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow touch-manipulation"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-card-foreground mb-2">Balance Sheet</h2>
            <p className="text-gray-600 dark:text-muted-foreground text-sm">View balance sheet reports</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
