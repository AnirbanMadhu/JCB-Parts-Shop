"use client";

import { API_BASE_URL } from '@/lib/constants';

import Link from "next/link";
import { useRouter } from "next/navigation";
import BackButton from "./BackButton";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "./ToastContainer";
import { 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  FileText, 
  Calendar,
  DollarSign,
  Edit,
  Trash2
} from "lucide-react";

type Customer = {
  id: string;
  indexId?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  state?: string;
  createdAt?: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  date: string;
  total: number;
  status: string;
  items?: any[];
};

type Props = {
  customer: Customer;
  invoices: Invoice[];
};



export default function CustomerDetails({ customer, invoices }: Props) {
  const router = useRouter();
  const { success, error, toasts, removeToast } = useToast();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${customer.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/customers/${customer.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete customer');
      }

      success('Customer deleted successfully');
      router.push('/common/customers');
    } catch (err: any) {
      error('Error deleting customer: ' + err.message);
    }
  };

  const totalInvoices = invoices.length;
  const totalPurchased = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
  const pendingInvoices = invoices.filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-[17px] font-semibold text-gray-900">{customer.name}</h1>
            {customer.indexId && (
              <p className="text-xs text-gray-500 font-mono">{customer.indexId}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/common/customers/${customer.id}/edit`}
            className="flex items-center gap-2 px-4 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-200"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Information Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              
              <div className="space-y-4">
                {customer.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <p className="text-sm text-gray-900">{customer.email}</p>
                    </div>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                      <p className="text-sm text-gray-900">{customer.phone}</p>
                    </div>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Address</p>
                      <p className="text-sm text-gray-900">{customer.address}</p>
                      {customer.state && (
                        <p className="text-sm text-gray-600 mt-1">{customer.state}</p>
                      )}
                    </div>
                  </div>
                )}

                {customer.gstin && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">GSTIN</p>
                      <p className="text-sm text-gray-900 font-mono">{customer.gstin}</p>
                    </div>
                  </div>
                )}

                {customer.createdAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Customer Since</p>
                      <p className="text-sm text-gray-900">
                        {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Invoices</span>
                  <span className="text-sm font-semibold text-gray-900">{totalInvoices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paid Invoices</span>
                  <span className="text-sm font-semibold text-green-600">{paidInvoices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Invoices</span>
                  <span className="text-sm font-semibold text-orange-600">{pendingInvoices}</span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Purchased</span>
                    <span className="text-lg font-bold text-gray-900">
                      ₹{totalPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Purchase History</h2>
                <Link
                  href={`/sales/invoices/new?customerId=${customer.id}`}
                  className="px-4 py-1.5 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors"
                >
                  New Invoice
                </Link>
              </div>

              {invoices.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No invoices found for this customer</p>
                  <Link
                    href={`/sales/invoices/new?customerId=${customer.id}`}
                    className="inline-block mt-4 px-4 py-2 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors"
                  >
                    Create First Invoice
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/sales/invoices/${invoice.id}`}
                              className="text-sm font-medium text-blue-600 hover:underline"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(invoice.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              invoice.status === 'PAID' 
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : invoice.status === 'DRAFT'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                            ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Link
                              href={`/sales/invoices/${invoice.id}`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
