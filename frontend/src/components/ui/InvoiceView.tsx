'use client';

import { useEffect } from "react";
import InvoicePrint from "@/components/ui/InvoicePrint";
import { useSettings } from "@/hooks/useSettings";

interface Invoice {
  id: number;
  invoiceNumber: string;
  date: string;
  customer?: any;
  customerId?: number;
  items?: any[];
  subtotal: string | number;
  discountPercent?: number;
  discountAmount: string | number;
  taxableValue: string | number;
  cgstPercent?: number;
  cgstAmount: string | number;
  sgstPercent?: number;
  sgstAmount: string | number;
  roundOff: string | number;
  total: string | number;
  note?: string;
  deliveryNote?: string;
  buyerOrderNo?: string;
  dispatchDocNo?: string;
  deliveryNoteDate?: string;
  dispatchedThrough?: string;
  termsOfDelivery?: string;
  status?: string;
  paymentStatus?: string;
  paidAmount?: string | number;
  dueAmount?: string | number;
  paymentDate?: string;
  paymentMethod?: string;
  paymentNote?: string;
}

interface InvoiceViewProps {
  invoice: Invoice;
}

export default function InvoiceView({ invoice }: InvoiceViewProps) {
  const { settings, isLoaded } = useSettings();
  
  // Set document title for PDF filename
  useEffect(() => {
    const originalTitle = document.title;
    document.title = `${invoice.invoiceNumber}.pdf`;
    
    return () => {
      document.title = originalTitle;
    };
  }, [invoice.invoiceNumber]);
  
  const handlePrint = () => {
    window.print();
  };

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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Print Invoice
            </button>
          </div>

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
                  {invoice.dispatchedThrough && (
                    <div>
                      <span className="text-xs text-gray-500">Dispatched Through:</span>
                      <p className="text-sm">{invoice.dispatchedThrough}</p>
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
                </div>
              </div>
            </div>

            {/* Payment Information Section */}
            {invoice.paymentStatus && (
              <div className="border-t pt-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">Payment Status:</span>
                      <p className="text-sm">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                          invoice.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                          invoice.paymentStatus === 'PARTIAL' ? 'bg-orange-100 text-orange-800' :
                          invoice.paymentStatus === 'ON_CREDIT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.paymentStatus === 'PAID' ? 'Paid' :
                           invoice.paymentStatus === 'PARTIAL' ? 'Partially Paid' :
                           invoice.paymentStatus === 'ON_CREDIT' ? 'On Credit' :
                           'Unpaid'}
                        </span>
                      </p>
                    </div>
                    {invoice.paidAmount !== undefined && invoice.paidAmount !== null && Number(invoice.paidAmount) > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Paid Amount:</span>
                        <p className="text-sm font-semibold text-green-600">₹{Number(invoice.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    )}
                    {invoice.dueAmount !== undefined && invoice.dueAmount !== null && Number(invoice.dueAmount) > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Due Amount:</span>
                        <p className="text-sm font-semibold text-orange-600">₹{Number(invoice.dueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
            )}

            {/* Additional Details Section */}
            {(invoice.deliveryNote || invoice.termsOfDelivery || invoice.note) && (
              <div className="border-t pt-6 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Details</h3>
                <div className="space-y-2">
                  {invoice.deliveryNote && (
                    <div>
                      <span className="text-xs text-gray-500">Delivery Note:</span>
                      <p className="text-sm">{invoice.deliveryNote}</p>
                    </div>
                  )}
                  {invoice.termsOfDelivery && (
                    <div>
                      <span className="text-xs text-gray-500">Terms of Delivery:</span>
                      <p className="text-sm">{invoice.termsOfDelivery}</p>
                    </div>
                  )}
                  {invoice.note && (
                    <div>
                      <span className="text-xs text-gray-500">Note:</span>
                      <p className="text-sm">{invoice.note}</p>
                    </div>
                  )}
                </div>
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
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-medium">₹{Number(invoice.subtotal).toFixed(2)}</span>
                  </div>
                  {invoice.discountPercent && Number(invoice.discountPercent) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount @{invoice.discountPercent}%:</span>
                      <span className="font-medium">₹{Number(invoice.discountAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxable Value:</span>
                    <span className="font-medium">₹{Number(invoice.taxableValue).toFixed(2)}</span>
                  </div>
                  {invoice.cgstPercent && Number(invoice.cgstPercent) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">CGST @{invoice.cgstPercent}%:</span>
                      <span className="font-medium">₹{Number(invoice.cgstAmount).toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.sgstPercent && Number(invoice.sgstPercent) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">SGST @{invoice.sgstPercent}%:</span>
                      <span className="font-medium">₹{Number(invoice.sgstAmount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Round off:</span>
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
