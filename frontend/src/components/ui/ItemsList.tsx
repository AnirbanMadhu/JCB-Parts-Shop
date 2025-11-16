"use client";

import Link from "next/link";
import { Item } from "@/lib/api";
import BackButton from "./BackButton";
import ToastContainer from "./ToastContainer";
import ConfirmDialog from "./ConfirmDialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

type Props = {
  items: Item[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export default function ItemsList({ items }: Props) {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemId: number;
    itemName: string;
  }>({ isOpen: false, itemId: 0, itemName: "" });

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;

    const term = searchTerm.toLowerCase().trim();
    return items.filter(item => 
      item.partNumber.toLowerCase().includes(term) ||
      item.itemName.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  const hasRows = filteredItems && filteredItems.length > 0;

  const handleDelete = (id: number, itemName: string) => {
    setConfirmDialog({ isOpen: true, itemId: id, itemName });
  };

  const confirmDelete = async () => {
    const { itemId, itemName } = confirmDialog;
    setDeletingId(itemId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/parts/${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete item');
      }

      success(`Item "${itemName}" deleted successfully`);
      router.refresh();
    } catch (err: any) {
      error(err.message || 'Error deleting item');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Items</h1>
        </div>
        <Link href="/common/items/new" className="p-2 bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors inline-flex">
          <Plus className="w-4 h-4" />
        </Link>
      </header>

      {/* Search Bar */}
      <div className="px-6 pt-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by part number or item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

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
              <p className="text-sm text-gray-400 mb-5">
                {searchTerm ? 'No items found matching your search' : 'No items found'}
              </p>
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
              {filteredItems.map((item, i) => (
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, itemId: 0, itemName: "" })}
        onConfirm={confirmDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${confirmDialog.itemName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
