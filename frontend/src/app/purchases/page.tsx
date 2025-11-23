import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function PurchasesPage() {
  return (
    <div className="h-full bg-background p-4 sm:p-6 md:p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6">Purchases</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
