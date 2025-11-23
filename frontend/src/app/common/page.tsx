import Link from "next/link";

export const dynamic = 'force-dynamic';

export default function CommonPage() {
  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-background p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-foreground mb-4 sm:mb-6">Common</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <Link
            href="/common/items"
            className="bg-white dark:bg-card rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow touch-manipulation"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-card-foreground mb-2">Items</h2>
            <p className="text-gray-600 dark:text-muted-foreground text-sm">Manage inventory items and parts</p>
          </Link>
          <Link
            href="/common/customers"
            className="bg-white dark:bg-card rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow touch-manipulation"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-card-foreground mb-2">Customers</h2>
            <p className="text-gray-600 dark:text-muted-foreground text-sm">Manage customer information</p>
          </Link>
          <Link
            href="/common/suppliers"
            className="bg-white dark:bg-card rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow touch-manipulation"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-card-foreground mb-2">Suppliers</h2>
            <p className="text-gray-600 dark:text-muted-foreground text-sm">Manage supplier information</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
