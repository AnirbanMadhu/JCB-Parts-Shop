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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-[17px] font-semibold text-foreground">{customer.name}</h1>
            {customer.indexId && (
              <p className="text-xs text-muted-foreground font-mono">{customer.indexId}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/common/customers/${customer.id}/edit`}
            className="flex items-center gap-2 px-4 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors border border-blue-200 dark:border-blue-900"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors border border-red-200 dark:border-red-900"
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
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Customer Information</h2>
              
              <div className="space-y-4">
                {customer.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                      <p className="text-sm text-foreground">{customer.email}</p>
                    </div>
                  </div>
                )}

                {customer.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                      <p className="text-sm text-foreground">{customer.phone}</p>
                    </div>
                  </div>
                )}

                {customer.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Address</p>
                      <p className="text-sm text-foreground">{customer.address}</p>
                      {customer.state && (
                        <p className="text-sm text-muted-foreground mt-1">{customer.state}</p>
                      )}
                    </div>
                  </div>
                )}

                {customer.gstin && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">GSTIN</p>
                      <p className="text-sm text-foreground font-mono">{customer.gstin}</p>
                    </div>
                  </div>
                )}

                {customer.createdAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Customer Since</p>
                      <p className="text-sm text-foreground">
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
            <div className="bg-card rounded-lg shadow-sm border border-border p-6 mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Purchase Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Invoices</span>
                  <span className="text-sm font-semibold text-foreground">{totalInvoices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Paid Invoices</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">{paidInvoices}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Invoices</span>
                  <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{pendingInvoices}</span>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Purchased</span>
                    <span className="text-lg font-bold text-foreground">
                      ₹{totalPurchased.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Purchase History</h2>
                <Link
                  href={`/sales/invoices/new?customerId=${customer.id}`}
                  className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  New Invoice
                </Link>
              </div>

              {invoices.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No invoices found for this customer</p>
                  <Link
                    href={`/sales/invoices/new?customerId=${customer.id}`}
                    className="inline-block mt-4 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Create First Invoice
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              href={`/sales/invoices/${invoice.id}`}
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {new Date(invoice.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              invoice.status === 'PAID' 
                                ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400'
                                : invoice.status === 'CANCELLED'
                                ? 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400'
                                : invoice.status === 'DRAFT'
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                                : 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground text-right font-semibold">
                            ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <Link
                              href={`/sales/invoices/${invoice.id}`}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
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
