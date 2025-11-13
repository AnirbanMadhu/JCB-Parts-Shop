"use client";

import Link from "next/link";
import { Item } from "@/lib/api";
import BackButton from "./BackButton";
import { Filter, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  items: Item[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export default function ItemsList({ items }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const hasRows = items && items.length > 0;

  const handleDelete = async (id: number, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/parts/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete item');
      }

      alert('Item deleted successfully');
      router.refresh();
    } catch (error: any) {
      alert('Error deleting item: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Items</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <Link href="/common/items/new" className="p-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors inline-flex">
            <Plus className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <div className="px-6 py-6">
        <div className="bg-white">
          {!hasRows ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-4">
                <svg className="w-20 h-20 text-gray-300" viewBox="0 0 80 80" fill="none">
                  <rect x="22" y="14" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="18" y="18" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-5">No items found</p>
              <Link href="/common/items/new" className="px-5 py-2 bg-[#2c3e50] text-white text-sm font-medium rounded-md hover:bg-[#1a252f] transition-colors">
                Add Item
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[60px_repeat(5,1fr)_120px] gap-4 px-4 py-3 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500">#</div>
                <div className="text-xs font-medium text-gray-500">Part Number</div>
                <div className="text-xs font-medium text-gray-500">Item Name</div>
                <div className="text-xs font-medium text-gray-500">Unit</div>
                <div className="text-xs font-medium text-gray-500 text-right">MRP</div>
                <div className="text-xs font-medium text-gray-500 text-right">Stock</div>
                <div className="text-xs font-medium text-gray-500 text-center">Actions</div>
              </div>
              {items.map((item, i) => (
                <div key={item.id} className="grid grid-cols-[60px_repeat(5,1fr)_120px] gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                  <div className="text-sm text-gray-900">{i + 1}</div>
                  <div className="text-sm text-gray-900">{item.partNumber}</div>
                  <div className="text-sm">
                    <Link href={`/common/items/${item.id}`} className="text-blue-600 hover:underline">
                      {item.itemName}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-900">{item.unit}</div>
                  <div className="text-sm text-gray-900 text-right">
                    {item.mrp.toLocaleString(undefined, {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className={`text-sm font-semibold text-right ${
                    item.stock > 10 ? 'text-green-600' : item.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {item.stock}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/common/items/${item.id}/edit`}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id, item.itemName)}
                      disabled={deletingId === item.id}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
