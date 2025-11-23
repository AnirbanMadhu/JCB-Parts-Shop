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
  initialOnlyPurchased?: boolean;
};



export default function ItemsList(props: Props) {
  const { items } = props;
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyPurchased, setShowOnlyPurchased] = useState(props.initialOnlyPurchased ?? false);
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

  // Handle filter toggle - navigate to update URL params
  const handlePurchasedFilterChange = (checked: boolean) => {
    setShowOnlyPurchased(checked);
    const url = checked ? '/common/items?onlyPurchased=true' : '/common/items';
    router.push(url);
  };

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filter by search term (client-side for better UX)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.partNumber.toLowerCase().includes(term) ||
        item.itemName.toLowerCase().includes(term)
      );
    }

    return filtered;
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
    setStockValues({ ...stockValues, [itemId]: currentStock ?? 0 });
  };

  const cancelEditingStock = () => {
    setEditingStockId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <header className="sticky top-0 z-10 bg-card border-b border-border px-3 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <BackButton />
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="w-1 h-5 sm:h-6 bg-primary rounded-full flex-shrink-0" />
            <h1 className="text-sm sm:text-[17px] font-semibold text-foreground truncate">Items</h1>
          </div>
        </div>
      </header>

      {/* Search Bar and Filters */}
      <div className="px-3 sm:px-6 pt-3 sm:pt-6 flex flex-col gap-3 sm:gap-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by part number or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 sm:py-2 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all touch-manipulation"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
            <input
              type="checkbox"
              checked={showOnlyPurchased}
              onChange={(e) => handlePurchasedFilterChange(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring touch-manipulation"
            />
            <span className="text-xs sm:text-sm text-foreground">Show only purchased items</span>
          </label>
        </div>
      </div>

      <div className="px-3 sm:px-6 py-3 sm:py-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm animate-fade-in">
          {!hasRows ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-32 px-4">
              <div className="mb-4">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 text-muted" viewBox="0 0 80 80" fill="none">
                  <rect x="22" y="14" width="40" height="48" rx="2" fill="hsl(var(--card))" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="18" y="18" width="40" height="48" rx="2" fill="hsl(var(--card))" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-5 text-center">
                {searchTerm ? 'No items found matching your search' : 'No items found'}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Part Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Item Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">HSN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">GST %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Unit</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">RTL</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">MRP</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">Stock Qty</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, i) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm text-foreground">{i + 1}</td>
                    <td className="px-4 py-3 text-sm text-foreground font-mono whitespace-nowrap">{item.partNumber}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <Link href={`/common/items/${item.id}`} className="text-primary hover:underline transition-colors font-medium">
                        {item.itemName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate" title={item.description || 'N/A'}>
                      {item.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{item.hsnCode}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{item.gstPercent}%</td>
                    <td className="px-4 py-3 text-sm text-foreground">{item.unit}</td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">
                      {item.rtl ? Number(item.rtl).toLocaleString(undefined, {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2,
                      }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground text-right whitespace-nowrap">
                      {Number(item.mrp ?? 0).toLocaleString(undefined, {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingStockId === item.id ? (
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={stockValues[item.id] ?? item.stock ?? 0}
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
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditingStock}
                            disabled={updatingStockId === item.id}
                            className="text-xs px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 disabled:opacity-50 cursor-pointer"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditingStock(item.id, item.stock ?? 0)}
                          className={`text-sm font-semibold hover:underline whitespace-nowrap cursor-pointer ${
                            (item.stock ?? 0) > 10 ? 'text-green-600' : (item.stock ?? 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                          }`}
                          title="Click to edit stock"
                        >
                          {item.stock ?? 0}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                        <Link
                          href={`/common/items/${item.id}/edit`}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded transition-all hover:scale-110"
                          title="Edit item"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.itemName)}
                          disabled={deletingId === item.id}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-all hover:scale-110 disabled:opacity-50 cursor-pointer"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {filteredItems.map((item, i) => (
                  <div key={item.id} className="p-4 border-b border-border hover:bg-muted/20 active:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <Link href={`/common/items/${item.id}`} className="text-primary hover:underline font-medium text-sm sm:text-base block mb-1 truncate">
                          {item.itemName}
                        </Link>
                        <p className="text-xs text-muted-foreground font-mono">{item.partNumber}</p>
                      </div>
                      <div className={`text-base font-bold flex-shrink-0 ${
                        (item.stock ?? 0) > 10 ? 'text-green-600' : (item.stock ?? 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {item.stock ?? 0}
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-muted-foreground">HSN:</span>
                        <span className="ml-1 text-foreground">{item.hsnCode}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">GST:</span>
                        <span className="ml-1 text-foreground">{item.gstPercent}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unit:</span>
                        <span className="ml-1 text-foreground">{item.unit}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">MRP:</span>
                        <span className="ml-1 text-foreground font-semibold">
                          {Number(item.mrp ?? 0).toLocaleString(undefined, {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-border gap-2">
                      {editingStockId === item.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="number"
                            min="0"
                            value={stockValues[item.id] ?? item.stock ?? 0}
                            onChange={(e) => setStockValues({ ...stockValues, [item.id]: parseInt(e.target.value) || 0 })}
                            className="flex-1 px-3 py-2 text-sm border border-primary rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 active:bg-green-800 disabled:opacity-50 text-sm touch-manipulation"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditingStock}
                            disabled={updatingStockId === item.id}
                            className="px-3 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 active:bg-gray-600 disabled:opacity-50 text-sm touch-manipulation"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditingStock(item.id, item.stock ?? 0)}
                            className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm touch-manipulation"
                          >
                            Update Stock
                          </button>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/common/items/${item.id}/edit`}
                              className="p-2 text-primary hover:bg-primary/10 active:bg-primary/20 rounded transition-all touch-manipulation"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id, item.itemName)}
                              disabled={deletingId === item.id}
                              className="p-2 text-destructive hover:bg-destructive/10 active:bg-destructive/20 rounded transition-all disabled:opacity-50 touch-manipulation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
