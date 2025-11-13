// components/Common/DateRangeFilter.tsx
"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";

export default function DateRangeFilter() {
  const [fromDate, setFromDate] = useState("Nov 12, 2024");
  const [toDate, setToDate] = useState("Nov 13, 2025");

  return (
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From Date</label>
          <div className="relative">
            <input
              type="text"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              placeholder="Nov 12, 2024"
              className="px-3 py-1.5 pr-8 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To Date</label>
          <div className="relative">
            <input
              type="text"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="Nov 13, 2025"
              className="px-3 py-1.5 pr-8 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
