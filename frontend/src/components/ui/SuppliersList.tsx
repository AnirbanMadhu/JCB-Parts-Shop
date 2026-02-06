"use client";

// components/Common/SuppliersList.tsx

import Link from "next/link";
import BackButton from "./BackButton";
import ToastContainer from "./ToastContainer";
import ConfirmDialog from "./ConfirmDialog";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";



type Supplier = {
  id: number;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  gstin?: string;
  contactPerson?: string;
};

type Props = {
  suppliers: Supplier[];
};

export default function SuppliersList({ suppliers }: Props) {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    supplierId: number;
    supplierName: string;
  }>({ isOpen: false, supplierId: 0, supplierName: '' });

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

  const handleDeleteClick = (e: React.MouseEvent, id: number, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDialog({ isOpen: true, supplierId: id, supplierName: name });
  };

  const handleDeleteConfirm = async () => {
    const { supplierId, supplierName } = confirmDialog;

    try {
      const res = await fetch(`/api/suppliers/${supplierId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete supplier');
      }

      success(`Supplier "${supplierName}" deleted successfully`);
      router.refresh();
    } catch (err: any) {
      error(err.message || 'Error deleting supplier');
    }
  };

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;

    const term = searchTerm.toLowerCase().trim();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(term) ||
      supplier.phone.toLowerCase().includes(term) ||
      supplier.email?.toLowerCase().includes(term) ||
      supplier.address?.toLowerCase().includes(term) ||
      supplier.gstin?.toLowerCase().includes(term) ||
      supplier.contactPerson?.toLowerCase().includes(term)
    );
  }, [suppliers, searchTerm]);

  const hasRows = filteredSuppliers && filteredSuppliers.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, supplierId: 0, supplierName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Supplier"
        message={`Are you sure you want to delete supplier "${confirmDialog.supplierName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      <header className="bg-card border-b border-border px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-[17px] font-semibold text-foreground">Suppliers</h1>
          </div>
        </div>
        <Link href="/common/suppliers/new" className="flex items-center gap-2 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm hover:shadow-md">
          <Plus className="w-4 h-4" />
          Add Supplier
        </Link>
      </header>

      <div className="px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, phone, email, GSTIN, or address..."
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

        {/* Suppliers Table */}
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
                {searchTerm ? 'No suppliers found matching your search' : 'No suppliers found'}
              </p>
              <Link href="/common/suppliers/new" className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-all shadow-sm hover:shadow-md">
                Add First Supplier
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[60px_1fr_200px_180px_200px_1fr_100px] gap-4 px-4 py-3 bg-muted/30 border-b border-border">
                <div className="text-xs font-medium text-muted-foreground">#</div>
                <div className="text-xs font-medium text-muted-foreground">Supplier Name</div>
                <div className="text-xs font-medium text-muted-foreground">Contact Person</div>
                <div className="text-xs font-medium text-muted-foreground">Phone</div>
                <div className="text-xs font-medium text-muted-foreground">Email</div>
                <div className="text-xs font-medium text-muted-foreground">GSTIN</div>
                <div className="text-xs font-medium text-muted-foreground text-center">Actions</div>
              </div>
              {/* Table Body */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredSuppliers.map((supplier, i) => (
                  <div
                    key={supplier.id}
                    className="grid grid-cols-[60px_1fr_200px_180px_200px_1fr_100px] gap-4 px-4 py-3 border-b border-border hover:bg-muted/20 transition-colors"
                  >
                    <div className="text-sm text-foreground">{i + 1}</div>
                    <Link href={`/common/suppliers/${supplier.id}`} className="text-sm">
                      <div className="font-medium text-foreground hover:text-primary transition-colors">{supplier.name}</div>
                      {supplier.address && (
                        <div className="text-xs text-muted-foreground truncate">{supplier.address}</div>
                      )}
                    </Link>
                    <div className="text-sm text-foreground">{supplier.contactPerson || '-'}</div>
                    <div className="text-sm text-foreground">{supplier.phone}</div>
                    <div className="text-sm text-muted-foreground">{supplier.email || '-'}</div>
                    <div className="text-sm text-muted-foreground font-mono">{supplier.gstin || '-'}</div>
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/common/suppliers/${supplier.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded transition-all hover:scale-110"
                        title="Edit supplier"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={(e) => handleDeleteClick(e, supplier.id, supplier.name)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-all hover:scale-110 cursor-pointer"
                        title="Delete supplier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
