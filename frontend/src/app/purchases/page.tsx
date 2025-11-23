import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function PurchasesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-foreground mb-4 sm:mb-6">Purchases</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <Link
            href="/purchases/invoices"
            className="bg-white dark:bg-card rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow touch-manipulation"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-card-foreground mb-2">Purchase Invoices</h2>
            <p className="text-gray-600 dark:text-muted-foreground text-sm">Manage purchase invoices and orders</p>
          </Link>
          <Link
            href="/purchases/payments"
            className="bg-white dark:bg-card rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow touch-manipulation"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-card-foreground mb-2">Purchase Payments</h2>
            <p className="text-gray-600 dark:text-muted-foreground text-sm">Track supplier payments</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
