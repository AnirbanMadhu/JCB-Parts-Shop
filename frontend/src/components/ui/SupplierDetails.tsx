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
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-foreground">Supplier Details</h1>
        </div>
        <Link 
          href={`/common/suppliers/${supplier.id}/edit`}
          className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Edit Supplier
        </Link>
      </header>

      <div className="px-6 py-6">
        {/* Supplier Info Card */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{supplier.name}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplier.contactPerson && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                  <p className="text-sm text-foreground">{supplier.contactPerson}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm text-foreground">{supplier.phone}</p>
              </div>
            </div>

            {supplier.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground">{supplier.email}</p>
                </div>
              </div>
            )}

            {supplier.gstin && (
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">GSTIN</p>
                  <p className="text-sm text-foreground font-mono">{supplier.gstin}</p>
                </div>
              </div>
            )}

            {supplier.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm text-foreground">{supplier.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-4 border border-purple-200 dark:border-purple-900">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Total Purchases</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ₹{totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{invoices.length} invoice(s)</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Paid Invoices</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{paidInvoices}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Completed payments</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 border border-orange-200 dark:border-orange-900">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Pending Invoices</p>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{pendingInvoices}</p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Awaiting payment</p>
          </div>
        </div>

        {/* Purchase Invoices */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Purchase History</h3>
          </div>
          
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No purchase invoices found</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-[60px_150px_180px_1fr_120px] gap-4 px-4 py-3 bg-muted border-b border-border">
                <div className="text-xs font-medium text-muted-foreground">#</div>
                <div className="text-xs font-medium text-muted-foreground">Invoice No</div>
                <div className="text-xs font-medium text-muted-foreground">Date</div>
                <div className="text-xs font-medium text-muted-foreground">Status</div>
                <div className="text-xs font-medium text-muted-foreground text-right">Amount</div>
              </div>
              {/* Table Body */}
              <div className="max-h-[400px] overflow-y-auto">
                {invoices.map((invoice, i) => (
                  <Link
                    key={invoice.id}
                    href={`/purchases/invoices/${invoice.id}`}
                    className="grid grid-cols-[60px_150px_180px_1fr_120px] gap-4 px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="text-sm text-foreground">{i + 1}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      {invoice.invoiceNumber}
                    </div>
                    <div className="text-sm text-foreground">
                      {new Date(invoice.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-sm">
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
                    </div>
                    <div className="text-sm text-foreground text-right font-semibold">
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
