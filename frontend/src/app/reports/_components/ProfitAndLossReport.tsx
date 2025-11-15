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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Profit And Loss</h1>
        </div>
      </header>

      {/* Filter Section */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Select start date"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Select end date"
            />
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-2 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors"
          >
            Apply Filter
          </button>
          {(startDate || endDate) && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors border border-gray-300"
            >
              Reset
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Filter by invoice date range. Purchase and sales invoices within this period will be included in the calculation.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-blue-900">
              ₹{data.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-blue-600 mt-1">Revenue generated</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-xs text-orange-600 font-medium mb-1">Total Purchases</p>
            <p className="text-2xl font-bold text-orange-900">
              ₹{data.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-orange-600 mt-1">Cost of goods</p>
          </div>
          <div className={`${isProfitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} rounded-lg p-4 border`}>
            <p className={`text-xs font-medium mb-1 ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
              {isProfitable ? 'Net Profit' : 'Net Loss'}
            </p>
            <p className={`text-2xl font-bold ${isProfitable ? 'text-green-900' : 'text-red-900'}`}>
              ₹{Math.abs(data.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-xs mt-1 ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
              Sales - Purchases
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-xs text-purple-600 font-medium mb-1">Profit Margin</p>
            <p className="text-2xl font-bold text-purple-900">
              {data.profitMargin}
            </p>
            <p className="text-xs text-purple-600 mt-1">Profit / Sales</p>
          </div>
        </div>

        {/* Date Range Display */}
        {(startDate || endDate) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
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
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Profit & Loss Statement</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {/* Revenue Section */}
            <div className="px-4 py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">Revenue</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{data.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 ml-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Sales</span>
                  <span className="text-sm text-gray-600">
                    ₹{data.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost of Goods Section */}
            <div className="px-4 py-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">Cost of Goods Sold</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{data.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 ml-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Purchases</span>
                  <span className="text-sm text-gray-600">
                    ₹{data.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Profit/Loss */}
            <div className={`px-4 py-4 ${isProfitable ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-center">
                <span className={`text-base font-bold ${isProfitable ? 'text-green-900' : 'text-red-900'}`}>
                  {isProfitable ? 'Net Profit' : 'Net Loss'}
                </span>
                <span className={`text-base font-bold ${isProfitable ? 'text-green-900' : 'text-red-900'}`}>
                  {isProfitable ? '+' : '-'}₹{Math.abs(data.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-6">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Graphical Representation</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Sales Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Sales</span>
                  <span className="text-sm font-semibold text-blue-600">
                    ₹{data.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-10 relative overflow-hidden">
                  <div 
                    className="bg-blue-500 h-10 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
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
                  <span className="text-sm font-medium text-gray-700">Total Purchases</span>
                  <span className="text-sm font-semibold text-orange-600">
                    ₹{data.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-10 relative overflow-hidden">
                  <div 
                    className="bg-orange-500 h-10 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
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
                  <span className="text-sm font-medium text-gray-700">
                    {isProfitable ? 'Net Profit' : 'Net Loss'}
                  </span>
                  <span className={`text-sm font-semibold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfitable ? '+' : '-'}₹{Math.abs(data.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-10 relative overflow-hidden">
                  <div 
                    className={`${isProfitable ? 'bg-green-500' : 'bg-red-500'} h-10 rounded-full flex items-center justify-end pr-3 transition-all duration-500`}
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
