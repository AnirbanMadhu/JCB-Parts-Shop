// components/Reports/ProfitAndLossReport.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/ui/BackButton";
import { Calendar } from "lucide-react";

type Props = {
  data: {
    totalPurchases: number;
    totalSales: number;
    profitLoss: number;
    profitMargin: string;
    startDate?: string;
    endDate?: string;
  };
};

export default function ProfitAndLossReport({ data }: Props) {
  const router = useRouter();
  
  // Set default dates if not provided
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(data.startDate || "");
  const [endDate, setEndDate] = useState(data.endDate || "");

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    router.push(`/reports/profit-and-loss?${params.toString()}`);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    router.push('/reports/profit-and-loss');
  };

  const isProfitable = data.profitLoss >= 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-[17px] font-semibold text-foreground">Profit And Loss</h1>
          </div>
        </div>
      </header>

      {/* Filter Section */}
      <div className="px-6 py-4 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              placeholder="Select start date"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              placeholder="Select end date"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
          >
            Apply Filter
          </button>
          {(startDate || endDate) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-all border border-border hover:border-primary"
            >
              Reset
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Filter by invoice date range. Purchase and sales invoices within this period will be included in the calculation.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30 hover:border-blue-500/50 transition-all hover:shadow-lg animate-slide-up">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ₹{data.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Revenue generated</p>
          </div>
          <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30 hover:border-orange-500/50 transition-all hover:shadow-lg animate-slide-up" style={{animationDelay: '0.1s'}}>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Total Purchases</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              ₹{data.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">Cost of goods</p>
          </div>
          <div className={`${isProfitable ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' : 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'} rounded-lg p-4 border transition-all hover:shadow-lg animate-slide-up`} style={{animationDelay: '0.2s'}}>
            <p className={`text-xs font-medium mb-1 ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isProfitable ? 'Net Profit' : 'Net Loss'}
            </p>
            <p className={`text-2xl font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ₹{Math.abs(data.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-xs mt-1 ${isProfitable ? 'text-green-600/80 dark:text-green-400/80' : 'text-red-600/80 dark:text-red-400/80'}`}>
              Sales - Purchases
            </p>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30 hover:border-purple-500/50 transition-all hover:shadow-lg animate-slide-up" style={{animationDelay: '0.3s'}}>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Profit Margin</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.profitMargin}
            </p>
            <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">Profit / Sales</p>
          </div>
        </div>

        {/* Date Range Display */}
        {(startDate || endDate) && (
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold">Period:</span>{' '}
              {startDate && (
                <span>
                  From {new Date(startDate).toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
              )}
              {startDate && endDate && ' '}
              {endDate && (
                <span>
                  To {new Date(endDate).toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
              )}
              {!startDate && !endDate && 'All Time'}
            </p>
          </div>
        )}

        {/* Detailed Breakdown */}
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Profit & Loss Statement</h3>
          </div>
          
          <div className="divide-y divide-border">
            {/* Revenue Section */}
            <div className="px-4 py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">Revenue</span>
                <span className="text-sm font-semibold text-foreground">
                  ₹{data.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 ml-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Sales</span>
                  <span className="text-sm text-muted-foreground">
                    ₹{data.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Section */}
            <div className="px-4 py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">Cost of Goods Sold</span>
                <span className="text-sm font-semibold text-foreground">
                  ₹{data.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 ml-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Purchases</span>
                  <span className="text-sm text-muted-foreground">
                    ₹{data.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Profit/Loss */}
            <div className={`px-4 py-4 ${isProfitable ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <div className="flex justify-between items-center">
                <span className={`text-base font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isProfitable ? 'Net Profit' : 'Net Loss'}
                </span>
                <span className={`text-base font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {isProfitable ? '+' : '-'}₹{Math.abs(data.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mt-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Graphical Representation</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Sales Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Total Sales</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    ₹{data.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-10 relative overflow-hidden">
                  <div 
                    className="bg-blue-500 dark:bg-blue-600 h-10 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ 
                      width: `${Math.max((data.totalSales / Math.max(data.totalSales, data.totalPurchases)) * 100, 5)}%` 
                    }}
                  >
                    <span className="text-xs font-medium text-white">
                      {((data.totalSales / Math.max(data.totalSales, data.totalPurchases)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchases Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">Total Purchases</span>
                  <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    ₹{data.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-10 relative overflow-hidden">
                  <div 
                    className="bg-orange-500 dark:bg-orange-600 h-10 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                    style={{ 
                      width: `${Math.max((data.totalPurchases / Math.max(data.totalSales, data.totalPurchases)) * 100, 5)}%` 
                    }}
                  >
                    <span className="text-xs font-medium text-white">
                      {((data.totalPurchases / Math.max(data.totalSales, data.totalPurchases)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Profit/Loss Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {isProfitable ? 'Net Profit' : 'Net Loss'}
                  </span>
                  <span className={`text-sm font-semibold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isProfitable ? '+' : '-'}₹{Math.abs(data.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-10 relative overflow-hidden">
                  <div 
                    className={`${isProfitable ? 'bg-green-500 dark:bg-green-600' : 'bg-red-500 dark:bg-red-600'} h-10 rounded-full flex items-center justify-end pr-3 transition-all duration-500`}
                    style={{ 
                      width: `${Math.max((Math.abs(data.profitLoss) / Math.max(data.totalSales, data.totalPurchases)) * 100, 5)}%` 
                    }}
                  >
                    <span className="text-xs font-medium text-white">
                      {((Math.abs(data.profitLoss) / Math.max(data.totalSales, data.totalPurchases)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
