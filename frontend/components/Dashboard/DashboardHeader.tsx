"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronDown } from "lucide-react";

export default function DashboardHeader() {
  const router = useRouter();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-md">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-md">
        <span className="text-sm text-gray-700">This Year</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
    </header>
  );
}
