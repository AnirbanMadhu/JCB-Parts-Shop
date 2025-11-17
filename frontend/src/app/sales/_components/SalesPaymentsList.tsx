// components/Sales/SalesPaymentsList.tsx
"use client";

import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import PaymentStatusModal from "./PaymentStatusModal";
import { Filter, Plus, Search, Calendar, DollarSign, Edit } from "lucide-react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";

type SalesInvoice = {
  id: number;
  invoiceNumber: string;
  date: string;
  total: number;
  status: string;
  customer?: {
    id: number;
    name: string;
    indexId?: string;
  };
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentStatus?: string;
  paidAmount?: number;
  dueAmount?: number;
  paymentDate?: string;
  paymentMethod?: string;
  paymentNote?: string;
};

type Props = {
  payments: SalesInvoice[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export default function SalesPaymentsList({ payments }: Props) {
  const router = useRouter();
  const { toasts, removeToast, success, error } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter payments based on search term and filters
  const filteredPayments = useMemo(() => {
    let filtered = payments;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(payment => 
        payment.invoiceNumber.toLowerCase().includes(term) ||
        payment.customer?.name.toLowerCase().includes(term) ||
        payment.customer?.indexId?.toLowerCase().includes(term) ||
        payment.note?.toLowerCase().includes(term)
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(payment => 
        payment.date.startsWith(dateFilter)
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    return filtered;
  }, [payments, searchTerm, dateFilter, statusFilter]);

  const hasRows = filteredPayments && filteredPayments.length > 0;

  // Calculate totals
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + Number(payment.total), 0);
  const paidAmount = filteredPayments.reduce((sum, payment) => {
    if (payment.paidAmount && payment.paidAmount > 0) {
      return sum + Number(payment.paidAmount);
    }
    return sum;
  }, 0);
  const pendingAmount = filteredPayments.reduce((sum, payment) => {
    const due = payment.dueAmount !== undefined && payment.dueAmount !== null 
      ? Number(payment.dueAmount) 
      : Number(payment.total) - (payment.paidAmount ? Number(payment.paidAmount) : 0);
    return sum + due;
  }, 0);

  const handleOpenPaymentModal = (invoice: SalesInvoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleSavePayment = async (paymentData: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/invoices/${selectedInvoice?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update payment');
      }

      success('Payment status updated successfully');
      router.refresh();
    } catch (err: any) {
      error('Error updating payment: ' + err.message);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Sales Payments</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
            Export
          </button>
          <Link href="/sales/invoices/new" className="px-4 py-1.5 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors">
            New Sale
          </Link>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-blue-900">
              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-blue-600 mt-1">{filteredPayments.length} transaction(s)</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">Paid Amount</p>
            <p className="text-2xl font-bold text-green-900">
              ₹{paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {filteredPayments.filter(p => p.paidAmount && p.paidAmount > 0).length} payment(s)
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-xs text-orange-600 font-medium mb-1">Pending Amount</p>
            <p className="text-2xl font-bold text-orange-900">
              ₹{pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {filteredPayments.filter(p => {
                const due = p.dueAmount !== undefined && p.dueAmount !== null 
                  ? Number(p.dueAmount) 
                  : Number(p.total) - (p.paidAmount ? Number(p.paidAmount) : 0);
                return due > 0;
              }).length} invoice(s)
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice number, customer, or remarks..."
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

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 mt-4">
          {['ALL', 'PAID', 'SUBMITTED', 'DRAFT', 'CANCELLED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                statusFilter === status
                  ? 'bg-[#2c3e50] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {!hasRows ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-32">
              <div className="mb-4">
                <svg className="w-20 h-20 text-gray-300" viewBox="0 0 80 80" fill="none">
                  <rect x="22" y="14" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="18" y="18" width="40" height="48" rx="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 mb-5">No sales transactions found</p>
              <Link href="/sales/invoices/new" className="px-5 py-2 bg-[#2c3e50] text-white text-sm font-medium rounded-md hover:bg-[#1a252f] transition-colors">
                Create First Sale
              </Link>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[60px_120px_200px_150px_120px_120px_1fr_150px_100px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500">#</div>
                <div className="text-xs font-medium text-gray-500">Invoice No</div>
                <div className="text-xs font-medium text-gray-500">Customer</div>
                <div className="text-xs font-medium text-gray-500">Date & Time</div>
                <div className="text-xs font-medium text-gray-500">Status</div>
                <div className="text-xs font-medium text-gray-500">Payment</div>
                <div className="text-xs font-medium text-gray-500">Remarks</div>
                <div className="text-xs font-medium text-gray-500 text-right">Amount</div>
                <div className="text-xs font-medium text-gray-500 text-center">Actions</div>
              </div>
              {/* Table Body */}
              <div className="max-h-[600px] overflow-y-auto">
                {filteredPayments.map((payment, i) => (
                  <div key={payment.id} className="grid grid-cols-[60px_120px_200px_150px_120px_120px_1fr_150px_100px] gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
                    <div className="text-sm text-gray-900">{i + 1}</div>
                    <div className="text-sm">
                      <Link href={`/sales/invoices/${payment.id}`} className="text-blue-600 hover:underline font-medium">
                        {payment.invoiceNumber}
                      </Link>
                    </div>
                    <div className="text-sm">
                      {payment.customer ? (
                        <Link href={`/common/customers/${payment.customer.id}`} className="text-gray-900 hover:text-blue-600">
                          <div className="font-medium">{payment.customer.name}</div>
                          {payment.customer.indexId && (
                            <div className="text-xs text-gray-500 font-mono">{payment.customer.indexId}</div>
                          )}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-900">
                      <div>{new Date(payment.date).toLocaleDateString('en-IN', { 
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.createdAt || payment.date).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.status === 'PAID' 
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : payment.status === 'DRAFT'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.paymentStatus === 'PAID' 
                          ? 'bg-green-100 text-green-800'
                          : payment.paymentStatus === 'PARTIAL'
                          ? 'bg-orange-100 text-orange-800'
                          : payment.paymentStatus === 'ON_CREDIT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.paymentStatus === 'PAID' ? 'Paid' 
                          : payment.paymentStatus === 'PARTIAL' ? 'Partial'
                          : payment.paymentStatus === 'ON_CREDIT' ? 'Credit'
                          : 'Due'}
                      </span>
                      {payment.paidAmount !== undefined && payment.paidAmount > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          ₹{Number(payment.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 truncate" title={payment.note || ''}>
                      {payment.note || '-'}
                    </div>
                    <div className="text-sm text-gray-900 text-right">
                      <div className="font-semibold">
                        ₹{Number(payment.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      {payment.dueAmount !== undefined && payment.dueAmount > 0 && (
                        <div className="text-xs text-orange-600">
                          Due: ₹{Number(payment.dueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <button
                        onClick={() => handleOpenPaymentModal(payment)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Payment Status"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment Status Modal */}
      {selectedInvoice && (
        <PaymentStatusModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onSave={handleSavePayment}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
