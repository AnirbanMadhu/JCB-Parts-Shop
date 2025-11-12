"use client";

import { ChevronDown } from "lucide-react";

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  showFilter?: boolean;
}

export default function DashboardCard({
  title,
  children,
  showFilter = true,
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-700">{title}</h2>
        {showFilter && (
          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800">
            <span>This Year</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
