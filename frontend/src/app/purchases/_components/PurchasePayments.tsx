"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Filter, Plus } from "lucide-react";

export default function PurchasePaymentsPage() {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-3 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-md cursor-pointer touch-manipulation">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h1 className="text-sm sm:text-[17px] font-semibold text-foreground truncate">Purchase Payment</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors border border-border cursor-pointer touch-manipulation">
            Export
          </button>
          <button className="flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors border border-border cursor-pointer touch-manipulation">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer touch-manipulation">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Table Container */}
      <div className="flex-1 overflow-auto px-3 sm:px-6 py-3 sm:py-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_repeat(4,1fr)] gap-4 px-4 py-3 border-b border-border bg-muted/30">
            <div className="text-xs font-medium text-muted-foreground">#</div>
            <div className="text-xs font-medium text-muted-foreground">Payment No</div>
            <div className="text-xs font-medium text-muted-foreground">Status</div>
            <div className="text-xs font-medium text-muted-foreground">Party</div>
            <div className="text-xs font-medium text-muted-foreground">Posting Date</div>
            <div className="text-xs font-medium text-muted-foreground text-right">Amount</div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-20 sm:py-32 px-4">
            <div className="mb-4">
              <svg
                className="w-16 h-16 sm:w-20 sm:h-20 text-muted"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Back document */}
                <rect
                  x="22"
                  y="14"
                  width="40"
                  height="48"
                  rx="2"
                  fill="white"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                {/* Front document */}
                <rect
                  x="18"
                  y="18"
                  width="40"
                  height="48"
                  rx="2"
                  fill="white"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                {/* Checkboxes */}
                <rect
                  x="24"
                  y="28"
                  width="8"
                  height="8"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <line
                  x1="36"
                  y1="31"
                  x2="48"
                  y2="31"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="36"
                  y1="34"
                  x2="44"
                  y2="34"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <rect
                  x="24"
                  y="42"
                  width="8"
                  height="8"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <line
                  x1="36"
                  y1="45"
                  x2="48"
                  y2="45"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="36"
                  y1="48"
                  x2="44"
                  y2="48"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground mb-5">No entries found</p>
            <button className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors cursor-pointer touch-manipulation">
              Make Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
