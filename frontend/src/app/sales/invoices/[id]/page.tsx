'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter } from "next/navigation";
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/useToast';
import InvoicePrint from "@/components/ui/InvoicePrint";
import { motion } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default function SalesInvoiceDetailPage({ params }: Props) {
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

  const handlePrint = () => {
    window.print();
  };

  // Set document title for PDF filename
  useEffect(() => {
    if (invoice) {
      const originalTitle = document.title;
      document.title = `${invoice.invoiceNumber}.pdf`;
      
      return () => {
        document.title = originalTitle;
      };
    }
  }, [invoice]);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
        <div className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block"
          >
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading invoice details...</p>
          </motion.div>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    notFound();
  }
  
  return (
    <>
      {/* Print View - Hidden by default, visible only when printing */}
      <div className="print-only">
        <InvoicePrint invoice={invoice} />
      </div>

      {/* Screen View */}
      <div className="no-print h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 flex justify-between items-center"
          >
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-1">
                Sales Invoice Details
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-base text-slate-600 font-medium">Invoice #{invoice.invoiceNumber}</p>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm ${
                  invoice.status === 'PAID' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                  invoice.status === 'SUBMITTED' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                  invoice.status === 'DRAFT' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' :
                  'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
                }`}>
                  {invoice.status}
                </span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg shadow-purple-500/30 transition-all duration-200 flex items-center gap-2 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Print Invoice
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl shadow-xl shadow-slate-200/50 p-4 mb-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100"
              >
                <h3 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse"></span>
                  Invoice Information
                </h3>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Invoice Number</span>
                    <p className="text-xs font-bold text-slate-800">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Date</span>
                    <p className="text-xs text-slate-700">{new Date(invoice.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}</p>
                  </div>
                  {invoice.buyerOrderNo && (
                    <div>
                      <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Buyer Order No</span>
                      <p className="text-xs text-slate-700">{invoice.buyerOrderNo}</p>
                    </div>
                  )}
                  {invoice.dispatchDocNo && (
                    <div>
                      <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide">Dispatch Doc No</span>
                      <p className="text-xs text-slate-700">{invoice.dispatchDocNo}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-100"
              >
                <h3 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                  Customer Information
                </h3>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Customer</span>
                    <p className="text-xs font-bold text-slate-800">{invoice.customer?.name || 'N/A'}</p>
                  </div>
                  {invoice.customer?.indexId && (
                    <div>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Customer ID</span>
                      <p className="text-xs font-mono text-slate-700">{invoice.customer.indexId}</p>
                    </div>
                  )}
                  {invoice.customer?.phone && (
                    <div>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Phone</span>
                      <p className="text-xs text-slate-700">{invoice.customer.phone}</p>
                    </div>
                  )}
                  {invoice.customer?.gstin && (
                    <div>
                      <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">GSTIN</span>
                      <p className="text-xs text-slate-700">{invoice.customer.gstin}</p>
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
              className="border-t border-slate-200 pt-3 mb-3"
            >
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1 mb-2">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse"></span>
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Payment Status</span>
                    <p className="text-xs mt-1">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${
                        invoice.paymentStatus === 'PAID' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' :
                        invoice.paymentStatus === 'PARTIAL' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white' :
                        invoice.paymentStatus === 'ON_CREDIT' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
                        'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                      }`}>
                        {invoice.paymentStatus === 'ON_CREDIT' ? 'On Credit' : invoice.paymentStatus}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Paid Amount</span>
                    <p className="text-sm font-bold text-green-700">₹{Number(invoice.paidAmount || 0).toFixed(2)}</p>
                  </div>
                  {invoice.dueAmount !== null && invoice.dueAmount !== undefined && (
                    <div>
                      <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Due Amount</span>
                      <p className="text-sm font-bold text-red-600">₹{Number(invoice.dueAmount).toFixed(2)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {invoice.paymentDate && (
                    <div>
                      <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Payment Date</span>
                      <p className="text-xs text-slate-700 mt-0.5">{new Date(invoice.paymentDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}</p>
                    </div>
                  )}
                  {invoice.paymentMethod && (
                    <div>
                      <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Payment Method</span>
                      <p className="text-xs text-slate-700 mt-0.5 font-medium">{invoice.paymentMethod}</p>
                    </div>
                  )}
                  {invoice.paymentNote && (
                    <div>
                      <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">Payment Note</span>
                      <p className="text-xs text-slate-700 mt-0.5 italic">{invoice.paymentNote}</p>
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
                className="border-t border-slate-200 pt-3 mb-3"
              >
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-pulse"></span>
                  Delivery Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
                  <div className="space-y-2">
                    {invoice.deliveryNote && (
                      <div>
                        <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Delivery Note</span>
                        <p className="text-xs text-slate-700 mt-0.5">{invoice.deliveryNote}</p>
                      </div>
                    )}
                    {invoice.deliveryNoteDate && (
                      <div>
                        <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Delivery Note Date</span>
                        <p className="text-xs text-slate-700 mt-0.5">{new Date(invoice.deliveryNoteDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {invoice.dispatchedThrough && (
                      <div>
                        <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Dispatched Through</span>
                        <p className="text-xs text-slate-700 mt-0.5">{invoice.dispatchedThrough}</p>
                      </div>
                    )}
                    {invoice.termsOfDelivery && (
                      <div>
                        <span className="text-[10px] font-semibold text-orange-600 uppercase tracking-wide">Terms of Delivery</span>
                        <p className="text-xs text-slate-700 mt-0.5">{invoice.termsOfDelivery}</p>
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
                className="border-t border-slate-200 pt-3 mb-3"
              >
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-pulse"></span>
                  Notes
                </h3>
                <div className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-lg p-3 border border-cyan-100">
                  <p className="text-xs text-slate-700 leading-relaxed italic">{invoice.note}</p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="border-t border-slate-200 pt-3 mb-3"
            >
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-pink-600 rounded-full animate-pulse"></span>
                Items
              </h3>
              <div className="overflow-auto rounded-lg border border-slate-200 shadow-lg max-h-[200px]">
                <table className="w-full text-xs">
                  <thead className="bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 text-white sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-bold text-[10px]">#</th>
                      <th className="px-2 py-1.5 text-left font-bold text-[10px]">Part Number</th>
                      <th className="px-2 py-1.5 text-left font-bold text-[10px]">Item Name</th>
                      <th className="px-2 py-1.5 text-left font-bold text-[10px]">HSN</th>
                      <th className="px-2 py-1.5 text-right font-bold text-[10px]">Qty</th>
                      <th className="px-2 py-1.5 text-left font-bold text-[10px]">Unit</th>
                      <th className="px-2 py-1.5 text-right font-bold text-[10px]">Rate</th>
                      <th className="px-2 py-1.5 text-right font-bold text-[10px]">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {invoice.items?.map((item: any, i: number) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 + (i * 0.05) }}
                        className="border-b border-slate-200 hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 transition-all duration-200"
                      >
                        <td className="px-2 py-1.5 font-semibold text-slate-600">{i + 1}</td>
                        <td className="px-2 py-1.5 font-medium text-slate-800">{item.part?.partNumber}</td>
                        <td className="px-2 py-1.5 text-slate-700">{item.part?.itemName}</td>
                        <td className="px-2 py-1.5 text-slate-600">{item.hsnCode}</td>
                        <td className="px-2 py-1.5 text-right font-semibold text-pink-600">{item.quantity}</td>
                        <td className="px-2 py-1.5 text-slate-600">{item.unit}</td>
                        <td className="px-2 py-1.5 text-right text-slate-700">₹{Number(item.rate).toFixed(2)}</td>
                        <td className="px-2 py-1.5 text-right font-bold text-pink-700">₹{Number(item.amount).toFixed(2)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="border-t border-slate-200 mt-3 pt-3"
            >
              <div className="flex justify-end">
                <div className="w-full md:w-80 space-y-1.5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200 shadow-lg">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Subtotal:</span>
                    <span className="font-bold text-slate-800">₹{Number(invoice.subtotal).toFixed(2)}</span>
                  </div>
                  {invoice.discountPercent > 0 && (
                    <div className="flex justify-between text-base">
                      <span className="text-slate-600 font-medium">Discount ({invoice.discountPercent}%):</span>
                      <span className="font-bold text-red-600">- ₹{Number(invoice.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base">
                    <span className="text-slate-600 font-medium">Taxable Value:</span>
                    <span className="font-bold text-slate-800">₹{Number(invoice.taxableValue).toFixed(2)}</span>
                  </div>
                  {invoice.cgstPercent > 0 && (
                    <div className="flex justify-between text-base">
                      <span className="text-slate-600 font-medium">CGST ({invoice.cgstPercent}%):</span>
                      <span className="font-bold text-purple-600">₹{Number(invoice.cgstAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.sgstPercent > 0 && (
                    <div className="flex justify-between text-base">
                      <span className="text-slate-600 font-medium">SGST ({invoice.sgstPercent}%):</span>
                      <span className="font-bold text-purple-600">₹{Number(invoice.sgstAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base">
                    <span className="text-slate-600 font-medium">Round Off:</span>
                    <span className="font-bold text-slate-800">₹{Number(invoice.roundOff).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-slate-300 pt-2 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                    <span>Total:</span>
                    <span>₹{Number(invoice.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="flex gap-2 mt-3"
          >
            <motion.a
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              href="/sales/invoices"
              className="px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 font-semibold shadow-lg transition-all duration-200 border border-slate-300 text-sm"
            >
              ← Back to Invoices
            </motion.a>
            {isLoaded && (settings.sales.allowEditSubmitted || invoice.status === 'DRAFT') && (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={`/sales/invoices/${invoice.id}/edit`}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold shadow-lg shadow-purple-500/30 transition-all duration-200 text-sm"
              >
                Edit Invoice ✏️
              </motion.a>
            )}
          </motion.div>
        </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
          }
          
          .print-only {
            display: none;
          }
        `
      }} />
    </>
  );
}
