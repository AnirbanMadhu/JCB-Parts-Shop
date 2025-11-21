// components/Common/DateRangeFilter.tsx
"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

export default function DateRangeFilter() {
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">From Date</label>
          <div className="relative">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-1.5 pr-8 text-sm border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-300">To Date</label>
          <div className="relative">
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-1.5 pr-8 text-sm border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
