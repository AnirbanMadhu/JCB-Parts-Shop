// components/Common/SupplierDetails.tsx
"use client";

import Link from "next/link";
import BackButton from "./BackButton";
import { Mail, Phone, MapPin, FileText, User, Building } from "lucide-react";

type Supplier = {
  id: number;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  gstin?: string;
  contactPerson?: string;
};

type Invoice = {
  id: number;
  invoiceNumber: string;
  date: string;
  total: number;
  status: string;
};

type Props = {
  supplier: Supplier;
  invoices: Invoice[];
};

export default function SupplierDetails({ supplier, invoices }: Props) {
  const totalPurchases = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'SUBMITTED').length;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Supplier Details</h1>
        </div>
        <Link 
          href={`/common/suppliers/${supplier.id}/edit`}
          className="px-4 py-1.5 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors"
        >
          Edit Supplier
        </Link>
      </header>

      <div className="px-6 py-6">
        {/* Supplier Info Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{supplier.name}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplier.contactPerson && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Contact Person</p>
                  <p className="text-sm text-gray-900">{supplier.contactPerson}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm text-gray-900">{supplier.phone}</p>
              </div>
            </div>

            {supplier.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{supplier.email}</p>
                </div>
              </div>
            )}

            {supplier.gstin && (
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">GSTIN</p>
                  <p className="text-sm text-gray-900 font-mono">{supplier.gstin}</p>
                </div>
              </div>
            )}

            {supplier.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm text-gray-900">{supplier.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-xs text-purple-600 font-medium mb-1">Total Purchases</p>
            <p className="text-2xl font-bold text-purple-900">
              ₹{totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-purple-600 mt-1">{invoices.length} invoice(s)</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">Paid Invoices</p>
            <p className="text-2xl font-bold text-green-900">{paidInvoices}</p>
            <p className="text-xs text-green-600 mt-1">Completed payments</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <p className="text-xs text-orange-600 font-medium mb-1">Pending Invoices</p>
            <p className="text-2xl font-bold text-orange-900">{pendingInvoices}</p>
            <p className="text-xs text-orange-600 mt-1">Awaiting payment</p>
          </div>
        </div>

        {/* Purchase Invoices */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Purchase History</h3>
          </div>
          
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">No purchase invoices found</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[60px_150px_180px_1fr_120px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="text-xs font-medium text-gray-500">#</div>
                <div className="text-xs font-medium text-gray-500">Invoice No</div>
                <div className="text-xs font-medium text-gray-500">Date</div>
                <div className="text-xs font-medium text-gray-500">Status</div>
                <div className="text-xs font-medium text-gray-500 text-right">Amount</div>
              </div>
              {/* Table Body */}
              <div className="max-h-[400px] overflow-y-auto">
                {invoices.map((invoice, i) => (
                  <Link
                    key={invoice.id}
                    href={`/purchases/invoices/${invoice.id}`}
                    className="grid grid-cols-[60px_150px_180px_1fr_120px] gap-4 px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm text-gray-900">{i + 1}</div>
                    <div className="text-sm text-blue-600 hover:underline font-medium">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="text-sm text-gray-900">
                      {new Date(invoice.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-sm">
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
                    </div>
                    <div className="text-sm text-gray-900 text-right font-semibold">
                      ₹{Number(invoice.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
