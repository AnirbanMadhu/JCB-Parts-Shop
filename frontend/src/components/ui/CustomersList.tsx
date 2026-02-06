"use client";

import Link from "next/link";
import { Customer } from "@/lib/api";
import BackButton from "./BackButton";
import ToastContainer from "./ToastContainer";
import ConfirmDialog from "./ConfirmDialog";
import { Filter, Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

type Props = {
  customers: Customer[];
};

export default function CustomersList({ customers }: Props) {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    customerId: string;
    customerName: string;
  }>({ isOpen: false, customerId: "", customerName: "" });

  // Keyboard shortcut: Ctrl+F to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter customers based on search term (name or ID)
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;

    const term = searchTerm.toLowerCase().trim();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        (customer.indexId && customer.indexId.toLowerCase().includes(term)) ||
        (customer.phone && customer.phone.includes(term)) ||
        (customer.email && customer.email.toLowerCase().includes(term)) ||
        (customer.address && customer.address.toLowerCase().includes(term))
    );
  }, [customers, searchTerm]);

  const hasRows = filteredCustomers && filteredCustomers.length > 0;

  const handleDeleteClick = (id: string, name: string) => {
    setConfirmDialog({ isOpen: true, customerId: id, customerName: name });
  };

  const handleDeleteConfirm = async () => {
    const { customerId, customerName } = confirmDialog;
    setDeletingId(customerId);

    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete customer");
      }

      success(`Customer "${customerName}" deleted successfully`);
      router.refresh();
    } catch (err: any) {
      error(err.message || "Error deleting customer");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, customerId: "", customerName: "" })
        }
        onConfirm={handleDeleteConfirm}
        title="Delete Customer"
        message={`Are you sure you want to delete "${confirmDialog.customerName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-[17px] font-semibold text-foreground">
              Customers
            </h1>
          </div>
        </div>
        <Link
          href="/common/customers/new"
          className="flex items-center gap-2 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Customer
        </Link>
      </header>

      {/* Search Bar */}
      <div className="px-6 pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name, ID....."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="px-6 py-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm animate-fade-in">
          {!hasRows ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-4">
                <svg
                  className="w-20 h-20 text-muted"
                  viewBox="0 0 80 80"
                  fill="none"
                >
                  <rect
                    x="22"
                    y="14"
                    width="40"
                    height="48"
                    rx="2"
                    fill="hsl(var(--card))"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="18"
                    y="18"
                    width="40"
                    height="48"
                    rx="2"
                    fill="hsl(var(--card))"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                No entries found
              </p>
              <Link
                href="/common/customers/new"
                className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
              >
                Make Entry
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[60px_100px_repeat(4,1fr)_120px] gap-4 px-4 py-3 border-b border-border bg-muted/30">
                <div className="text-xs font-medium text-muted-foreground">
                  #
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  ID
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Name
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Email
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Phone
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Address
                </div>
                <div className="text-xs font-medium text-muted-foreground text-center">
                  Actions
                </div>
              </div>
              {/* Table Body */}
              {filteredCustomers.map((customer, i) => (
                <div
                  key={customer.id}
                  className="grid grid-cols-[60px_100px_repeat(4,1fr)_120px] gap-4 px-4 py-3 border-b border-border hover:bg-muted/20 transition-colors"
                >
                  <div className="text-sm text-foreground">{i + 1}</div>
                  <div className="text-sm font-mono text-primary">
                    {customer.indexId || "-"}
                  </div>
                  <div className="text-sm">
                    <Link
                      href={`/common/customers/${customer.id}`}
                      className="text-primary hover:underline transition-colors"
                    >
                      {customer.name}
                    </Link>
                  </div>
                  <div className="text-sm text-foreground">
                    {customer.email}
                  </div>
                  <div className="text-sm text-foreground">
                    {customer.phone}
                  </div>
                  <div className="text-sm text-foreground">
                    {customer.address}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={`/common/customers/${customer.id}/edit`}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded transition-all hover:scale-110"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() =>
                        handleDeleteClick(customer.id.toString(), customer.name)
                      }
                      disabled={deletingId === customer.id.toString()}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-all hover:scale-110 disabled:opacity-50 cursor-pointer"
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
