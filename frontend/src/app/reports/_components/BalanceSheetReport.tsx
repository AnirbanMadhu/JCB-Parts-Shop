// components/Reports/BalanceSheetReport.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/ui/BackButton";

type Props = {
  data: {
    asOfDate: string;
    assets: {
      currentAssets: {
        cash: number;
        accountsReceivable: number;
        inventory: number;
        total: number;
      };
      total: number;
    };
    liabilities: {
      currentLiabilities: {
        accountsPayable: number;
        total: number;
      };
      total: number;
    };
    equity: {
      retainedEarnings: number;
      total: number;
    };
    totalLiabilitiesAndEquity: number;
  };
};

export default function BalanceSheetReport({ data }: Props) {
  const router = useRouter();
  const [asOfDate, setAsOfDate] = useState(data.asOfDate || new Date().toISOString().split('T')[0]);

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (asOfDate) params.set('asOfDate', asOfDate);
    router.push(`/reports/balance-sheet?${params.toString()}`);
  };

  const handleReset = () => {
    setAsOfDate("");
    router.push('/reports/balance-sheet');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-[17px] font-semibold text-foreground">Balance Sheet</h1>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <div className="px-6 py-4 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">As of Date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
          >
            Apply Filter
          </button>
          {asOfDate && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-all border border-border hover:border-primary"
            >
              Reset
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          View your business financial position as of the selected date.
        </p>
      </div>

      {/* Balance Sheet Content */}
      <div className="px-6 py-6 animate-fade-in">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">As of {new Date(data.asOfDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets Section */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-4 py-3 bg-primary/10 border-b border-border">
              <h3 className="text-sm font-semibold text-primary">ASSETS</h3>
            </div>
            
            <div className="divide-y divide-border">
              {/* Current Assets */}
              <div className="px-4 py-3">
                <div className="font-semibold text-sm text-foreground mb-3">Current Assets</div>
                
                <div className="ml-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cash in Hand</span>
                    <span className="text-sm text-foreground">
                      ₹{data.assets.currentAssets.cash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Accounts Receivable</span>
                    <span className="text-sm text-foreground">
                      ₹{data.assets.currentAssets.accountsReceivable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Inventory</span>
                    <span className="text-sm text-foreground">
                      ₹{data.assets.currentAssets.inventory.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm font-medium text-foreground">Total Current Assets</span>
                    <span className="text-sm font-semibold text-foreground">
                      ₹{data.assets.currentAssets.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Assets */}
              <div className="px-4 py-3 bg-primary/10">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-primary">TOTAL ASSETS</span>
                  <span className="text-base font-bold text-primary">
                    ₹{data.assets.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Liabilities and Equity Section */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-4 py-3 bg-destructive/10 border-b border-border">
              <h3 className="text-sm font-semibold text-destructive">LIABILITIES & EQUITY</h3>
            </div>
            
            <div className="divide-y divide-border">
              {/* Current Liabilities */}
              <div className="px-4 py-3">
                <div className="font-semibold text-sm text-foreground mb-3">Current Liabilities</div>
                
                <div className="ml-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Accounts Payable</span>
                    <span className="text-sm text-foreground">
                      ₹{data.liabilities.currentLiabilities.accountsPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm font-medium text-foreground">Total Current Liabilities</span>
                    <span className="text-sm font-semibold text-foreground">
                      ₹{data.liabilities.currentLiabilities.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="px-4 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-foreground">TOTAL LIABILITIES</span>
                  <span className="text-sm font-bold text-foreground">
                    ₹{data.liabilities.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Equity */}
              <div className="px-4 py-3">
                <div className="font-semibold text-sm text-foreground mb-3">Equity</div>
                
                <div className="ml-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Retained Earnings</span>
                    <span className="text-sm text-foreground">
                      ₹{data.equity.retainedEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-sm font-medium text-foreground">Total Equity</span>
                    <span className="text-sm font-semibold text-foreground">
                      ₹{data.equity.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities and Equity */}
              <div className="px-4 py-3 bg-destructive/10">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-destructive">TOTAL LIABILITIES & EQUITY</span>
                  <span className="text-base font-bold text-destructive">
                    ₹{data.totalLiabilitiesAndEquity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Check */}
        <div className={`mt-6 p-4 rounded-lg border animate-slide-up ${
          Math.abs(data.assets.total - data.totalLiabilitiesAndEquity) < 0.01
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              Math.abs(data.assets.total - data.totalLiabilitiesAndEquity) < 0.01
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              Balance Check: Assets = Liabilities + Equity
            </span>
            <span className={`text-sm font-semibold ${
              Math.abs(data.assets.total - data.totalLiabilitiesAndEquity) < 0.01
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {Math.abs(data.assets.total - data.totalLiabilitiesAndEquity) < 0.01 ? '✓ Balanced' : '✗ Not Balanced'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
