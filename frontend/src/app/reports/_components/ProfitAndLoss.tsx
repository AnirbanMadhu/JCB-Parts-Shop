"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar } from "lucide-react";

export default function ProfitAndLossPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-md cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">Profit And Loss</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200 cursor-pointer">
            Export
          </button>
        </div>
      </header>

      {/* Filter Section */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From Date</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nov 12, 2024"
                className="px-3 py-1.5 pr-8 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To Date</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nov 13, 2025"
                className="px-3 py-1.5 pr-8 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Calendar className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="px-6 py-6">
        <div className="bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_1fr_150px_150px_150px] gap-4 px-4 py-3 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500">#</div>
            <div className="text-xs font-medium text-gray-500">Account</div>
            <div className="text-xs font-medium text-gray-500 text-right">Debit</div>
            <div className="text-xs font-medium text-gray-500 text-right">Credit</div>
            <div className="text-xs font-medium text-gray-500 text-right">Balance</div>
          </div>

          {/* Empty State / No Data */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Closing</span>
              <div className="flex gap-8">
                <span className="text-sm text-gray-600 w-[150px] text-right">₹ 0.00</span>
                <span className="text-sm text-gray-600 w-[150px] text-right">₹ 0.00</span>
                <span className="text-sm text-gray-600 w-[150px] text-right">₹ 0.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
