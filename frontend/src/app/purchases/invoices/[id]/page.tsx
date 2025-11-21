'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter } from "next/navigation";
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/useToast';
import { motion } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function PurchaseInvoiceDetailPage({ params }: Props) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const { settings, isLoaded } = useSettings();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    params.then(({ id }) => {
      setInvoiceId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!invoiceId) return;

    async function fetchInvoice() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setInvoice(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceId]);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block"
          >
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading invoice details...</p>
          </motion.div>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex justify-between items-start"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Purchase Invoice Details
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-lg text-muted-foreground font-medium">Invoice #{invoice.invoiceNumber}</p>
              <span className={`inline-flex px-3 py-1 rounded-md text-xs font-semibold ${
                invoice.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                invoice.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                invoice.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
              }`}>
                {invoice.status}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card border border-border rounded-lg shadow-sm overflow-hidden"
        >
          {/* Invoice & Supplier Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="border border-border rounded-lg p-4 bg-muted/20"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Invoice Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Invoice Number</span>
                  <p className="text-sm font-semibold text-foreground mt-1">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Date</span>
                  <p className="text-sm text-foreground mt-1">{new Date(invoice.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}</p>
                </div>
                {invoice.buyerOrderNo && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Buyer Order No</span>
                    <p className="text-sm text-foreground mt-1">{invoice.buyerOrderNo}</p>
                  </div>
                )}
                {invoice.dispatchDocNo && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Dispatch Doc No</span>
                    <p className="text-sm text-foreground mt-1">{invoice.dispatchDocNo}</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="border border-border rounded-lg p-4 bg-muted/20"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Supplier Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Supplier</span>
                  <p className="text-sm font-semibold text-foreground mt-1">{invoice.supplier?.name || 'N/A'}</p>
                </div>
                {invoice.supplier?.email && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Email</span>
                    <p className="text-sm text-foreground mt-1">{invoice.supplier.email}</p>
                  </div>
                )}
                {invoice.supplier?.phone && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Phone</span>
                    <p className="text-sm text-foreground mt-1">{invoice.supplier.phone}</p>
                  </div>
                )}
                {invoice.supplier?.gstin && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">GSTIN</span>
                    <p className="text-sm text-foreground mt-1">{invoice.supplier.gstin}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Payment Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 border-t border-border"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-border rounded-lg p-4 bg-muted/20">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Payment Status</span>
                  <p className="mt-1">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${
                      invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      invoice.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      invoice.paymentStatus === 'ON_CREDIT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {invoice.paymentStatus === 'ON_CREDIT' ? 'On Credit' : invoice.paymentStatus}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Paid Amount</span>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">₹{Number(invoice.paidAmount || 0).toFixed(2)}</p>
                </div>
                {invoice.dueAmount !== null && invoice.dueAmount !== undefined && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Due Amount</span>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">₹{Number(invoice.dueAmount).toFixed(2)}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {invoice.paymentDate && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Payment Date</span>
                    <p className="text-sm text-foreground mt-1">{new Date(invoice.paymentDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}</p>
                  </div>
                )}
                {invoice.paymentMethod && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Payment Method</span>
                    <p className="text-sm text-foreground mt-1 font-medium">{invoice.paymentMethod}</p>
                  </div>
                )}
                {invoice.paymentNote && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Payment Note</span>
                    <p className="text-sm text-foreground mt-1 italic">{invoice.paymentNote}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Delivery Information */}
          {(invoice.deliveryNote || invoice.deliveryNoteDate || invoice.dispatchedThrough || invoice.termsOfDelivery) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="p-6 border-b border-border"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Delivery Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {invoice.deliveryNote && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Delivery Note</span>
                      <p className="text-sm text-foreground mt-1">{invoice.deliveryNote}</p>
                    </div>
                  )}
                  {invoice.deliveryNoteDate && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Delivery Note Date</span>
                      <p className="text-sm text-foreground mt-1">{new Date(invoice.deliveryNoteDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {invoice.dispatchedThrough && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Dispatched Through</span>
                      <p className="text-sm text-foreground mt-1">{invoice.dispatchedThrough}</p>
                    </div>
                  )}
                  {invoice.termsOfDelivery && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Terms of Delivery</span>
                      <p className="text-sm text-foreground mt-1">{invoice.termsOfDelivery}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {invoice.note && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="p-6 border-b border-border"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Notes
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-sm text-muted-foreground leading-relaxed italic">{invoice.note}</p>
              </div>
            </motion.div>
          )}

          {/* Items Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="p-6"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Items
            </h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Part Number</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Item Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">HSN</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Qty</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Unit</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Rate</th>
                    <th className="px-4 py-3 text-right font-semibold text-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {invoice.items?.map((item: any, i: number) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 + (i * 0.05) }}
                      className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.part?.partNumber}</td>
                      <td className="px-4 py-3 text-foreground">{item.part?.itemName}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.hsnCode}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{item.quantity}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.unit}</td>
                      <td className="px-4 py-3 text-right text-foreground">₹{Number(item.rate).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">₹{Number(item.amount).toFixed(2)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Totals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="p-6 bg-muted/30"
          >
            <div className="flex justify-end">
              <div className="w-full md:w-96 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold text-foreground">₹{Number(invoice.subtotal).toFixed(2)}</span>
                </div>
                {invoice.discountPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount ({invoice.discountPercent}%):</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">- ₹{Number(invoice.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pb-2 border-b border-border">
                  <span className="text-muted-foreground">Taxable Value:</span>
                  <span className="font-semibold text-foreground">₹{Number(invoice.taxableValue).toFixed(2)}</span>
                </div>
                {invoice.cgstPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CGST ({invoice.cgstPercent}%):</span>
                    <span className="font-semibold text-foreground">₹{Number(invoice.cgstAmount).toFixed(2)}</span>
                  </div>
                )}
                {invoice.sgstPercent > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">SGST ({invoice.sgstPercent}%):</span>
                    <span className="font-semibold text-foreground">₹{Number(invoice.sgstAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pb-3 border-b border-border">
                  <span className="text-muted-foreground">Round Off:</span>
                  <span className="font-semibold text-foreground">₹{Number(invoice.roundOff).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span className="text-foreground">Total:</span>
                  <span className="text-primary">₹{Number(invoice.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="flex gap-3 mt-6"
        >
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href="/purchases/invoices"
            className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 font-medium shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Invoices
          </motion.a>
          {isLoaded && (settings.purchases.allowEditSubmitted || invoice.status === 'DRAFT') && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              href={`/purchases/invoices/${invoice.id}/edit`}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Invoice
            </motion.a>
          )}
        </motion.div>
      </div>
    </div>
  );
}
