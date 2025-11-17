'use client';

import { useState, useEffect } from 'react';
import { notFound, useRouter } from "next/navigation";
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/useToast';
import InvoicePrint from "@/components/ui/InvoicePrint";

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

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentStatus: 'UNPAID',
    paidAmount: '0',
    dueAmount: '0',
    paymentDate: '',
    paymentMethod: '',
    paymentNote: ''
  });

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
        
        // Initialize payment data
        setPaymentData({
          paymentStatus: data.paymentStatus || 'UNPAID',
          paidAmount: data.paidAmount?.toString() || '0',
          dueAmount: data.dueAmount?.toString() || data.total?.toString() || '0',
          paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString().split('T')[0] : '',
          paymentMethod: data.paymentMethod || '',
          paymentNote: data.paymentNote || ''
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceId]);

  const handlePaymentUpdate = async () => {
    if (!invoice) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: paymentData.paymentStatus,
          paidAmount: parseFloat(paymentData.paidAmount) || 0,
          dueAmount: parseFloat(paymentData.dueAmount) || 0,
          paymentDate: paymentData.paymentDate || null,
          paymentMethod: paymentData.paymentMethod || null,
          paymentNote: paymentData.paymentNote || null
        })
      });

      if (!res.ok) {
        const error = await res.json();
        showToast(error.error || 'Failed to update payment', 'error');
        return;
      }

      const updated = await res.json();
      setInvoice(updated);
      setShowPaymentModal(false);
      showToast('Payment details updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update payment:', error);
      showToast('Failed to update payment details', 'error');
    }
  };

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
      <div className="min-h-screen bg-white p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
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
      <div className="no-print min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Invoice Details</h1>
              <p className="text-sm text-gray-500 mt-1">Invoice #{invoice.invoiceNumber}</p>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Print Invoice
            </button>
          </div>

          {/* Payment Modal */}
          {showPaymentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4">Update Payment Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={paymentData.paymentStatus}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="UNPAID">Unpaid</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                      <option value="ON_CREDIT">On Credit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paid Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentData.paidAmount}
                      onChange={(e) => {
                        const paid = parseFloat(e.target.value) || 0;
                        const total = parseFloat(invoice.total) || 0;
                        const due = Math.max(0, total - paid);
                        setPaymentData({ 
                          ...paymentData, 
                          paidAmount: e.target.value,
                          dueAmount: due.toString()
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentData.dueAmount}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={paymentData.paymentDate}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select method</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Cheque">Cheque</option>
                      <option value="RTGS/NEFT">RTGS/NEFT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Note
                    </label>
                    <textarea
                      value={paymentData.paymentNote}
                      onChange={(e) => setPaymentData({ ...paymentData, paymentNote: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Optional payment notes..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePaymentUpdate}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Payment
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoice Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Invoice Number:</span>
                    <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Date:</span>
                    <p className="text-sm">{new Date(invoice.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status:</span>
                    <p className="text-sm">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                        invoice.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </p>
                  </div>
                  {invoice.buyerOrderNo && (
                    <div>
                      <span className="text-xs text-gray-500">Buyer Order No:</span>
                      <p className="text-sm">{invoice.buyerOrderNo}</p>
                    </div>
                  )}
                  {invoice.dispatchDocNo && (
                    <div>
                      <span className="text-xs text-gray-500">Dispatch Doc No:</span>
                      <p className="text-sm">{invoice.dispatchDocNo}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Customer:</span>
                    <p className="text-sm font-medium">{invoice.customer?.name || 'N/A'}</p>
                  </div>
                  {invoice.customer?.indexId && (
                    <div>
                      <span className="text-xs text-gray-500">Customer ID:</span>
                      <p className="text-sm font-mono">{invoice.customer.indexId}</p>
                    </div>
                  )}
                  {invoice.customer?.email && (
                    <div>
                      <span className="text-xs text-gray-500">Email:</span>
                      <p className="text-sm">{invoice.customer.email}</p>
                    </div>
                  )}
                  {invoice.customer?.phone && (
                    <div>
                      <span className="text-xs text-gray-500">Phone:</span>
                      <p className="text-sm">{invoice.customer.phone}</p>
                    </div>
                  )}
                  {invoice.customer?.gstin && (
                    <div>
                      <span className="text-xs text-gray-500">GSTIN:</span>
                      <p className="text-sm">{invoice.customer.gstin}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="border-t pt-6 mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Payment Information</h3>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  disabled={invoice.paymentStatus === 'PAID' && (!invoice.dueAmount || Number(invoice.dueAmount) <= 0)}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                  title={invoice.paymentStatus === 'PAID' && (!invoice.dueAmount || Number(invoice.dueAmount) <= 0) ? 'Invoice is fully paid' : 'Update payment details'}
                >
                  Update Payment
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Payment Status:</span>
                    <p className="text-sm">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                        invoice.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                        invoice.paymentStatus === 'ON_CREDIT' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.paymentStatus === 'ON_CREDIT' ? 'On Credit' : invoice.paymentStatus}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Paid Amount:</span>
                    <p className="text-sm font-medium">₹{Number(invoice.paidAmount || 0).toFixed(2)}</p>
                  </div>
                  {invoice.dueAmount !== null && invoice.dueAmount !== undefined && (
                    <div>
                      <span className="text-xs text-gray-500">Due Amount:</span>
                      <p className="text-sm font-medium text-red-600">₹{Number(invoice.dueAmount).toFixed(2)}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {invoice.paymentDate && (
                    <div>
                      <span className="text-xs text-gray-500">Payment Date:</span>
                      <p className="text-sm">{new Date(invoice.paymentDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}</p>
                    </div>
                  )}
                  {invoice.paymentMethod && (
                    <div>
                      <span className="text-xs text-gray-500">Payment Method:</span>
                      <p className="text-sm">{invoice.paymentMethod}</p>
                    </div>
                  )}
                  {invoice.paymentNote && (
                    <div>
                      <span className="text-xs text-gray-500">Payment Note:</span>
                      <p className="text-sm">{invoice.paymentNote}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Information */}
            {(invoice.deliveryNote || invoice.deliveryNoteDate || invoice.dispatchedThrough || invoice.termsOfDelivery) && (
              <div className="border-t pt-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Delivery Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    {invoice.deliveryNote && (
                      <div>
                        <span className="text-xs text-gray-500">Delivery Note:</span>
                        <p className="text-sm">{invoice.deliveryNote}</p>
                      </div>
                    )}
                    {invoice.deliveryNoteDate && (
                      <div>
                        <span className="text-xs text-gray-500">Delivery Note Date:</span>
                        <p className="text-sm">{new Date(invoice.deliveryNoteDate).toLocaleDateString('en-IN', {
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
                        <span className="text-xs text-gray-500">Dispatched Through:</span>
                        <p className="text-sm">{invoice.dispatchedThrough}</p>
                      </div>
                    )}
                    {invoice.termsOfDelivery && (
                      <div>
                        <span className="text-xs text-gray-500">Terms of Delivery:</span>
                        <p className="text-sm">{invoice.termsOfDelivery}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {invoice.note && (
              <div className="border-t pt-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
                <p className="text-sm text-gray-700">{invoice.note}</p>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Part Number</th>
                      <th className="px-3 py-2 text-left">Item Name</th>
                      <th className="px-3 py-2 text-left">HSN</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-left">Unit</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item: any, i: number) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2">{item.part?.partNumber}</td>
                        <td className="px-3 py-2">{item.part?.itemName}</td>
                        <td className="px-3 py-2">{item.hsnCode}</td>
                        <td className="px-3 py-2 text-right">{item.quantity}</td>
                        <td className="px-3 py-2">{item.unit}</td>
                        <td className="px-3 py-2 text-right">₹{Number(item.rate).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-medium">₹{Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t mt-6 pt-6">
              <div className="flex justify-end">
                <div className="w-80 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{Number(invoice.subtotal).toFixed(2)}</span>
                  </div>
                  {invoice.discountPercent > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount ({invoice.discountPercent}%):</span>
                      <span className="font-medium">- ₹{Number(invoice.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxable Value:</span>
                    <span className="font-medium">₹{Number(invoice.taxableValue).toFixed(2)}</span>
                  </div>
                  {invoice.cgstPercent > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CGST ({invoice.cgstPercent}%):</span>
                      <span className="font-medium">₹{Number(invoice.cgstAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.sgstPercent > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SGST ({invoice.sgstPercent}%):</span>
                      <span className="font-medium">₹{Number(invoice.sgstAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Round Off:</span>
                    <span className="font-medium">₹{Number(invoice.roundOff).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>₹{Number(invoice.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="/sales/invoices"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Back to Invoices
            </a>
            {isLoaded && (settings.sales.allowEditSubmitted || invoice.status === 'DRAFT') && (
              <a
                href={`/sales/invoices/${invoice.id}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Edit Invoice
              </a>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
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
      `}</style>
    </>
  );
}
