"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar } from "lucide-react";

export default function BalanceSheetPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900 dark:text-white">Balance Sheet</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-md transition-colors border border-gray-200 dark:border-slate-600 cursor-pointer">
            Export
          </button>
        </div>
      </header>

      {/* Filter Section */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">From Date</label>
            <input
              type="date"
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-300">To Date</label>
            <input
              type="date"
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="px-6 py-6">
        <div className="bg-white dark:bg-slate-900">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_150px_150px_150px] gap-4 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">#</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Account</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 text-right">Debit</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 text-right">Credit</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 text-right">Balance</div>
          </div>

          {/* Empty State / No Data */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Closing</span>
              <div className="flex gap-8">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-[150px] text-right">₹ 0.00</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-[150px] text-right">₹ 0.00</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-[150px] text-right">₹ 0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
