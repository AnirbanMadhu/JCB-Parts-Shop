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
  const [asOfDate, setAsOfDate] = useState(data.asOfDate || "");

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Balance Sheet</h1>
        </div>
      </header>

      {/* Filter Section */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">As of Date</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-2 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors"
          >
            Apply Filter
          </button>
          {asOfDate && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors border border-gray-300"
            >
              Reset
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          View your business financial position as of the selected date.
        </p>
      </div>

      {/* Balance Sheet Content */}
      <div className="px-6 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">As of {new Date(data.asOfDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assets Section */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900">ASSETS</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {/* Current Assets */}
              <div className="px-4 py-3">
                <div className="font-semibold text-sm text-gray-900 mb-3">Current Assets</div>
                
                <div className="ml-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Cash in Hand</span>
                    <span className="text-sm text-gray-900">
                      ₹{data.assets.currentAssets.cash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Accounts Receivable</span>
                    <span className="text-sm text-gray-900">
                      ₹{data.assets.currentAssets.accountsReceivable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Inventory</span>
                    <span className="text-sm text-gray-900">
                      ₹{data.assets.currentAssets.inventory.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Total Current Assets</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{data.assets.currentAssets.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Assets */}
              <div className="px-4 py-3 bg-blue-50">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-blue-900">TOTAL ASSETS</span>
                  <span className="text-base font-bold text-blue-900">
                    ₹{data.assets.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Liabilities and Equity Section */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-orange-50 border-b border-orange-200">
              <h3 className="text-sm font-semibold text-orange-900">LIABILITIES & EQUITY</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {/* Current Liabilities */}
              <div className="px-4 py-3">
                <div className="font-semibold text-sm text-gray-900 mb-3">Current Liabilities</div>
                
                <div className="ml-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Accounts Payable</span>
                    <span className="text-sm text-gray-900">
                      ₹{data.liabilities.currentLiabilities.accountsPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Total Current Liabilities</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{data.liabilities.currentLiabilities.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="px-4 py-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">TOTAL LIABILITIES</span>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{data.liabilities.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Equity */}
              <div className="px-4 py-3">
                <div className="font-semibold text-sm text-gray-900 mb-3">Equity</div>
                
                <div className="ml-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Retained Earnings</span>
                    <span className="text-sm text-gray-900">
                      ₹{data.equity.retainedEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-sm font-medium text-gray-700">Total Equity</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₹{data.equity.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities and Equity */}
              <div className="px-4 py-3 bg-orange-50">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-orange-900">TOTAL LIABILITIES & EQUITY</span>
                  <span className="text-base font-bold text-orange-900">
                    ₹{data.totalLiabilitiesAndEquity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Check */}
        <div className="mt-6 p-4 rounded-lg ${
          Math.abs(data.assets.total - data.totalLiabilitiesAndEquity) < 0.01
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium ${
              Math.abs(data.assets.total - data.totalLiabilitiesAndEquity) < 0.01
                ? 'text-green-900'
                : 'text-red-900'
            }">
              Balance Check: Assets = Liabilities + Equity
            </span>
            <span className="text-sm font-semibold ${
              Math.abs(data.assets.total - data.totalLiabilitiesAndEquity) < 0.01
                ? 'text-green-900'
                : 'text-red-900'
            }">
              {Math.abs(data.assets.total - data.totalLiabilitiesAndEquity) < 0.01 ? '✓ Balanced' : '✗ Not Balanced'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
