"use client";

import Link from "next/link";
import { Customer } from "@/lib/api";
import BackButton from "./BackButton";
import ToastContainer from "./ToastContainer";
import { Filter, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

type Props = {
  customers: Customer[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export default function CustomersList({ customers }: Props) {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter customers based on search term (name or ID)
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    
    const term = searchTerm.toLowerCase().trim();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(term) ||
      (customer.indexId && customer.indexId.toLowerCase().includes(term)) ||
      (customer.phone && customer.phone.includes(term)) ||
      (customer.email && customer.email.toLowerCase().includes(term)) ||
      (customer.address && customer.address.toLowerCase().includes(term))
    );
  }, [customers, searchTerm]);

  const hasRows = filteredCustomers && filteredCustomers.length > 0;

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete customer');
      }

      success(`Customer "${name}" deleted successfully`);
      router.refresh();
    } catch (err: any) {
      error(err.message || 'Error deleting customer');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Customers</h1>
        </div>
        <Link href="/common/customers/new" className="flex items-center gap-2 px-4 py-1.5 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors">
          <Plus className="w-4 h-4" />
          New Customer
        </Link>
      </header>

      {/* Search Bar */}
      <div className="px-6 pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, ID....."
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

      {/* Table Container */}
      <div className="px-6 py-6">
        <div className="bg-white">
          {!hasRows ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-4">
                <svg className="w-20 h-20 text-gray-300" viewBox="0 0 80 80" fill="none">
                  <rect x="22" y="14" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="18" y="18" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-5">No entries found</p>
              <Link href="/common/customers/new" className="px-5 py-2 bg-[#2c3e50] text-white text-sm font-medium rounded-md hover:bg-[#1a252f] transition-colors">
                Make Entry
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[60px_100px_repeat(4,1fr)_120px] gap-4 px-4 py-3 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500">#</div>
                <div className="text-xs font-medium text-gray-500">ID</div>
                <div className="text-xs font-medium text-gray-500">Name</div>
                <div className="text-xs font-medium text-gray-500">Email</div>
                <div className="text-xs font-medium text-gray-500">Phone</div>
                <div className="text-xs font-medium text-gray-500">Address</div>
                <div className="text-xs font-medium text-gray-500 text-center">Actions</div>
              </div>
              {/* Table Body */}
              {filteredCustomers.map((customer, i) => (
                <div key={customer.id} className="grid grid-cols-[60px_100px_repeat(4,1fr)_120px] gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                  <div className="text-sm text-gray-900">{i + 1}</div>
                  <div className="text-sm font-mono text-blue-600">{customer.indexId || '-'}</div>
                  <div className="text-sm">
                    <Link href={`/common/customers/${customer.id}`} className="text-blue-600 hover:underline">
                      {customer.name}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-900">{customer.email}</div>
                  <div className="text-sm text-gray-900">{customer.phone}</div>
                  <div className="text-sm text-gray-900">{customer.address}</div>
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/common/customers/${customer.id}/edit`}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(customer.id, customer.name)}
                      disabled={deletingId === customer.id}
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
