// components/Common/SuppliersList.tsx
"use client";

import Link from "next/link";
import BackButton from "./BackButton";
import ToastContainer from "./ToastContainer";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

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

  const handleDelete = async (e: React.MouseEvent, id: number, name: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Are you sure you want to delete supplier "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/suppliers/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete supplier');
      }

      success(`Supplier "${name}" deleted successfully`);
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
    <div className="min-h-screen bg-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Suppliers</h1>
        </div>
        <Link href="/common/suppliers/new" className="flex items-center gap-2 px-4 py-1.5 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors">
          <Plus className="w-4 h-4" />
          Add Supplier
        </Link>
      </header>

      <div className="px-6 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, phone, email, GSTIN, or address..."
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

        {/* Suppliers Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {!hasRows ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-4">
                <svg className="w-20 h-20 text-gray-300" viewBox="0 0 80 80" fill="none">
                  <rect x="22" y="14" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="18" y="18" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                {searchTerm ? 'No suppliers found matching your search' : 'No suppliers found'}
              </p>
              <Link href="/common/suppliers/new" className="px-5 py-2 bg-[#2c3e50] text-white text-sm font-medium rounded-md hover:bg-[#1a252f] transition-colors">
                Add First Supplier
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[60px_1fr_200px_180px_200px_1fr_100px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500">#</div>
                <div className="text-xs font-medium text-gray-500">Supplier Name</div>
                <div className="text-xs font-medium text-gray-500">Contact Person</div>
                <div className="text-xs font-medium text-gray-500">Phone</div>
                <div className="text-xs font-medium text-gray-500">Email</div>
                <div className="text-xs font-medium text-gray-500">GSTIN</div>
                <div className="text-xs font-medium text-gray-500 text-center">Actions</div>
              </div>
              {/* Table Body */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredSuppliers.map((supplier, i) => (
                  <div
                    key={supplier.id}
                    className="grid grid-cols-[60px_1fr_200px_180px_200px_1fr_100px] gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm text-gray-900">{i + 1}</div>
                    <Link href={`/common/suppliers/${supplier.id}`} className="text-sm">
                      <div className="font-medium text-gray-900 hover:text-blue-600">{supplier.name}</div>
                      {supplier.address && (
                        <div className="text-xs text-gray-500 truncate">{supplier.address}</div>
                      )}
                    </Link>
                    <div className="text-sm text-gray-900">{supplier.contactPerson || '-'}</div>
                    <div className="text-sm text-gray-900">{supplier.phone}</div>
                    <div className="text-sm text-gray-600">{supplier.email || '-'}</div>
                    <div className="text-sm text-gray-600 font-mono">{supplier.gstin || '-'}</div>
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/common/suppliers/${supplier.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit supplier"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={(e) => handleDelete(e, supplier.id, supplier.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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
