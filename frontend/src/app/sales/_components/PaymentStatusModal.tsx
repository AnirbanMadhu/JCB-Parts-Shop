"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Calendar, CreditCard } from "lucide-react";

type PaymentStatusModalProps = {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: number;
    invoiceNumber: string;
    total: number;
    paidAmount?: number;
    paymentStatus?: string;
    paymentDate?: string;
    paymentMethod?: string;
    paymentNote?: string;
    note?: string;
  };
  onSave: (paymentData: any) => Promise<void>;
};

export default function PaymentStatusModal({
  isOpen,
  onClose,
  invoice,
  onSave,
}: PaymentStatusModalProps) {
  const [paymentStatus, setPaymentStatus] = useState(invoice.paymentStatus || "UNPAID");
  const [paidAmount, setPaidAmount] = useState(invoice.paidAmount?.toString() || "0");
  const [paymentDate, setPaymentDate] = useState(
    invoice.paymentDate 
      ? new Date(invoice.paymentDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState(invoice.paymentMethod || "");
  const [paymentNote, setPaymentNote] = useState(invoice.paymentNote || "");
  const [invoiceRemarks, setInvoiceRemarks] = useState(invoice.note || "");
  const [saving, setSaving] = useState(false);

  // Calculate existing due amount when modal opens
  const initialDueAmount = invoice.total - (invoice.paidAmount || 0);

  useEffect(() => {
    if (isOpen) {
      setPaymentStatus(invoice.paymentStatus || "UNPAID");
      // If there's already some payment, show the remaining due amount as the default to pay
      const currentPaid = invoice.paidAmount || 0;
      const remainingDue = invoice.total - currentPaid;
      setPaidAmount(currentPaid.toString());
      setPaymentDate(
        invoice.paymentDate 
          ? new Date(invoice.paymentDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setPaymentMethod(invoice.paymentMethod || "");
      setPaymentNote(invoice.paymentNote || "");
      setInvoiceRemarks(invoice.note || "");
    }
  }, [isOpen, invoice]);

  const handlePaymentStatusChange = (status: string) => {
    setPaymentStatus(status);
    if (status === "PAID") {
      // Set paid amount to the actual total invoice amount
      setPaidAmount(Number(invoice.total).toFixed(2));
    } else if (status === "UNPAID") {
      setPaidAmount("0");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const paymentData = {
        paymentStatus,
        paidAmount: parseFloat(paidAmount),
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : null,
        paymentMethod: paymentMethod || null,
        paymentNote: paymentNote || null,
        dueAmount: invoice.total - parseFloat(paidAmount),
        note: invoiceRemarks || null,
      };
      await onSave(paymentData);
      onClose();
    } catch (error) {
      console.error("Error saving payment:", error);
    } finally {
      setSaving(false);
    }
  };

  const dueAmount = invoice.total - parseFloat(paidAmount || "0");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Payment Status</h2>
            <p className="text-sm text-gray-500">Invoice: {invoice.invoiceNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Invoice Amount Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-blue-700">Total Amount:</span>
              <span className="text-xl font-bold text-blue-900">
                ₹{invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-green-700">Paid Amount:</span>
              <span className="text-lg font-semibold text-green-900">
                ₹{parseFloat(paidAmount || "0").toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-blue-300">
              <span className="text-sm text-orange-700">Due Amount:</span>
              <span className="text-lg font-semibold text-orange-900">
                ₹{Math.max(0, dueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "UNPAID", label: "Payment Due", color: "red" },
                { value: "ON_CREDIT", label: "On Credit", color: "yellow" },
                { value: "PARTIAL", label: "Partial Payment", color: "orange" },
                { value: "PAID", label: "Full Payment", color: "green" },
              ].map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => handlePaymentStatusChange(status.value)}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    paymentStatus === status.value
                      ? `border-${status.color}-500 bg-${status.color}-50 text-${status.color}-700`
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Paid Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Paid Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={invoice.total}
              value={paidAmount}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setPaidAmount(e.target.value);
                // Auto-update status based on amount
                if (value === 0) {
                  setPaymentStatus("UNPAID");
                } else if (value >= invoice.total) {
                  setPaymentStatus("PAID");
                } else {
                  setPaymentStatus("PARTIAL");
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              required
            />
            <div className="mt-2 flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setPaidAmount("0");
                  setPaymentStatus("UNPAID");
                }}
                className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                No Payment
              </button>
              <button
                type="button"
                onClick={() => {
                  const half = (invoice.total / 2).toFixed(2);
                  setPaidAmount(half);
                  setPaymentStatus("PARTIAL");
                }}
                className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
              >
                Half Payment
              </button>
              {initialDueAmount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPaidAmount(invoice.total.toString());
                    setPaymentStatus("PAID");
                  }}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Pay Due (₹{initialDueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setPaidAmount(invoice.total.toString());
                  setPaymentStatus("PAID");
                }}
                className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                Full Payment
              </button>
            </div>
          </div>

          {/* Payment Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Payment Date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select payment method</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Debit/Credit Card</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Payment Note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Notes
            </label>
            <textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes about this payment..."
            />
          </div>

          {/* Invoice Remarks */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Remarks
            </label>
            <textarea
              value={invoiceRemarks}
              onChange={(e) => setInvoiceRemarks(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add or edit invoice remarks..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
