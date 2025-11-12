"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Filter, Plus } from "lucide-react";

export default function PurchaseItemsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-md">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <h1 className="text-[17px] font-semibold text-gray-900">Purchase Items</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="p-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Table Container */}
      <div className="px-6 py-6">
        <div className="bg-white">
          {/* Table Header */}
          <div className="grid grid-cols-[60px_repeat(4,1fr)] gap-4 px-4 py-3 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500">#</div>
            <div className="text-xs font-medium text-gray-500">Item Name</div>
            <div className="text-xs font-medium text-gray-500">Category</div>
            <div className="text-xs font-medium text-gray-500">Unit</div>
            <div className="text-xs font-medium text-gray-500">Stock</div>
            <div className="text-xs font-medium text-gray-500 text-right">Price</div>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-32">
            <div className="mb-4">
              <svg
                className="w-20 h-20 text-gray-300"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Back document */}
                <rect
                  x="22"
                  y="14"
                  width="40"
                  height="48"
                  rx="2"
                  fill="white"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                {/* Front document */}
                <rect
                  x="18"
                  y="18"
                  width="40"
                  height="48"
                  rx="2"
                  fill="white"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                {/* Checkboxes */}
                <rect
                  x="24"
                  y="28"
                  width="8"
                  height="8"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <line
                  x1="36"
                  y1="31"
                  x2="48"
                  y2="31"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="36"
                  y1="34"
                  x2="44"
                  y2="34"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <rect
                  x="24"
                  y="42"
                  width="8"
                  height="8"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <line
                  x1="36"
                  y1="45"
                  x2="48"
                  y2="45"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <line
                  x1="36"
                  y1="48"
                  x2="44"
                  y2="48"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-400 mb-5">No entries found</p>
            <button className="px-5 py-2 bg-[#2c3e50] text-white text-sm font-medium rounded-md hover:bg-[#1a252f] transition-colors">
              Make Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
