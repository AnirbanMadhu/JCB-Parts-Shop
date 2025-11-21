"use client";

import { API_BASE_URL } from '@/lib/constants';
import Link from "next/link";
import { Item } from "@/lib/api";
import BackButton from "./BackButton";
import ToastContainer from "./ToastContainer";
import ConfirmDialog from "./ConfirmDialog";
import { Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

type Props = {
  items: Item[];
};



export default function ItemsList({ items }: Props) {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [stockValues, setStockValues] = useState<{ [key: number]: number }>({});
  const [updatingStockId, setUpdatingStockId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemId: number;
    itemName: string;
  }>({ isOpen: false, itemId: 0, itemName: "" });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+F to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleStockUpdate = async (itemId: number, itemName: string) => {
    const newStock = stockValues[itemId];
    if (newStock === undefined || newStock < 0) {
      error('Please enter a valid stock quantity');
      return;
    }

    setUpdatingStockId(itemId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/stock/${itemId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newStock }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update stock');
      }

      success(`Stock for "${itemName}" updated to ${newStock}`);
      setEditingStockId(null);
      router.refresh();
    } catch (err: any) {
      error(err.message || 'Error updating stock');
    } finally {
      setUpdatingStockId(null);
    }
  };

  const startEditingStock = (itemId: number, currentStock: number) => {
    setEditingStockId(itemId);
    setStockValues({ ...stockValues, [itemId]: currentStock });
  };

  const cancelEditingStock = () => {
    setEditingStockId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-[17px] font-semibold text-foreground">Items</h1>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 pt-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by part number or item name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm animate-fade-in">
          {!hasRows ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-4">
                <svg className="w-20 h-20 text-muted" viewBox="0 0 80 80" fill="none">
                  <rect x="22" y="14" width="40" height="48" rx="2" fill="hsl(var(--card))" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="18" y="18" width="40" height="48" rx="2" fill="hsl(var(--card))" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                {searchTerm ? 'No items found matching your search' : 'No items found'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[60px_repeat(5,1fr)_120px] gap-4 px-4 py-3 border-b border-border bg-muted/30">
                <div className="text-xs font-medium text-muted-foreground">#</div>
                <div className="text-xs font-medium text-muted-foreground">Part Number</div>
                <div className="text-xs font-medium text-muted-foreground">Item Name</div>
                <div className="text-xs font-medium text-muted-foreground">Unit</div>
                <div className="text-xs font-medium text-muted-foreground text-right">MRP</div>
                <div className="text-xs font-medium text-muted-foreground text-right">Stock</div>
                <div className="text-xs font-medium text-muted-foreground text-center">Actions</div>
              </div>
              {filteredItems.map((item, i) => (
                <div key={item.id} className="grid grid-cols-[60px_repeat(5,1fr)_120px] gap-4 px-4 py-3 border-b border-border hover:bg-muted/20 transition-colors">
                  <div className="text-sm text-foreground">{i + 1}</div>
                  <div className="text-sm text-foreground">{item.partNumber}</div>
                  <div className="text-sm">
                    <Link href={`/common/items/${item.id}`} className="text-primary hover:underline transition-colors">
                      {item.itemName}
                    </Link>
                  </div>
                  <div className="text-sm text-foreground">{item.unit}</div>
                  <div className="text-sm text-foreground text-right">
                    {item.mrp.toLocaleString(undefined, {
                      style: "currency",
                      currency: "INR",
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div className="text-right">
                    {editingStockId === item.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min="0"
                          value={stockValues[item.id] ?? item.stock}
                          onChange={(e) => setStockValues({ ...stockValues, [item.id]: parseInt(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 text-sm border border-primary rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-right transition-all"
                          disabled={updatingStockId === item.id}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleStockUpdate(item.id, item.itemName);
                            if (e.key === 'Escape') cancelEditingStock();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleStockUpdate(item.id, item.itemName)}
                          disabled={updatingStockId === item.id}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditingStock}
                          disabled={updatingStockId === item.id}
                          className="text-xs px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditingStock(item.id, item.stock)}
                        className={`text-sm font-semibold hover:underline ${
                          item.stock > 10 ? 'text-green-600' : item.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}
                      >
                        {item.stock}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/common/items/${item.id}/edit`}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded transition-all hover:scale-110"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id, item.itemName)}
                      disabled={deletingId === item.id}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-all hover:scale-110 disabled:opacity-50"
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
