'use client';

import React from 'react';

interface InvoiceItem {
  id: number;
  partId: number;
  part: {
    partNumber: string;
    itemName: string;
    hsnCode: string;
    unit: string;
  };
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: string | number;
  amount: string | number;
}

interface Customer {
  id: number;
  name: string;
  indexId?: string;
  address?: string;
  gstin?: string;
  phone?: string;
  state?: string;
  stateCode?: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  date: string;
  customer?: Customer;
  customerId?: number;
  items?: InvoiceItem[];
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
}

interface InvoicePrintProps {
  invoice: Invoice;
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  companyPhone?: string;
  companyState?: string;
  companyStateCode?: string;
}

export default function InvoicePrint({
  invoice,
  companyName = "S.P. TRADERS & BUILDERS",
  companyAddress = "ROY GATE PALASHI, MAJHI PARA\nGSTIN/UIN: 19AFYPP9120R1Z5\nState Name : West Bengal, Code : 19",
  companyGstin = "19AFYPP9120R1Z5",
  companyPhone = "",
  companyState = "West Bengal",
  companyStateCode = "19",
}: InvoicePrintProps) {
  
  const formatAmount = (amount: string | number) => {
    return Number(amount).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n >= 10 && n < 20) return teens[n - 10];
      if (n >= 20 && n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n >= 100 && n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
      if (n >= 1000 && n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      if (n >= 100000 && n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
      if (n >= 10000000) return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
      return '';
    };

    return convert(Math.floor(num));
  };

  const totalInWords = numberToWords(Number(invoice.total));

  return (
    <div className="invoice-print bg-white p-8 max-w-[210mm] mx-auto">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-print, .invoice-print * {
            visibility: visible;
          }
          .invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 10mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="border-2 border-black">
        {/* Title */}
        <div className="text-center border-b-2 border-black py-2">
          <h1 className="text-lg font-bold">Tax Invoice</h1>
        </div>

        {/* Company & Customer Info */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          {/* Left: Company Details */}
          <div className="border-r-2 border-black p-3">
            <div className="font-bold text-sm mb-1">{companyName}</div>
            <div className="text-xs whitespace-pre-line mb-2">
              <div>PROP: SUKANTA PAUL</div>
              <div>{companyAddress.split('\n')[0]}</div>
              <div>GSTIN/UIN: {companyGstin}</div>
              <div>State Name: {companyState}, Code: {companyStateCode}</div>
            </div>
          </div>

          {/* Right: Invoice Info */}
          <div>
            <div className="border-b border-black p-2">
              <div className="grid grid-cols-2">
                <span className="text-xs font-semibold">Invoice No.</span>
                <span className="text-xs font-semibold">Dated</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-xs">{invoice.invoiceNumber}</span>
                <span className="text-xs">{formatDate(invoice.date)}</span>
              </div>
            </div>
            <div className="border-b border-black p-2">
              <div className="text-xs font-semibold">Delivery Note</div>
              <div className="text-xs">{invoice.deliveryNote || ''}</div>
            </div>
          </div>
        </div>

        {/* Consignee & Buyer Info */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          {/* Consignee (Ship to) */}
          <div className="border-r-2 border-black p-3">
            <div className="text-xs font-bold mb-1">Consignee (Ship to)</div>
            <div className="text-xs">
              <div className="font-semibold">NAME: {invoice.customer?.name || ''}</div>
              {invoice.customer?.address && (
                <div>Address: {invoice.customer.address}</div>
              )}
              {invoice.customer?.phone && (
                <div>Phone: {invoice.customer.phone}</div>
              )}
              {invoice.customer?.gstin && (
                <div>GSTIN/UIN: {invoice.customer.gstin}</div>
              )}
              {invoice.customer?.state && (
                <div>State Name: {invoice.customer.state}</div>
              )}
            </div>
          </div>

          {/* Buyer Info */}
          <div>
            <div className="border-b border-black p-2">
              <div className="text-xs font-semibold">Buyer's Order No.</div>
              <div className="text-xs">{invoice.buyerOrderNo || ''}</div>
            </div>
            <div className="border-b border-black p-2">
              <div className="grid grid-cols-2">
                <div>
                  <div className="text-xs font-semibold">Dispatch Doc No.</div>
                  <div className="text-xs">{invoice.dispatchDocNo || ''}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold">Delivery Note Date</div>
                  <div className="text-xs">{invoice.deliveryNoteDate ? formatDate(invoice.deliveryNoteDate) : ''}</div>
                </div>
              </div>
            </div>
            <div className="p-2">
              <div className="text-xs font-semibold">Dispatched through</div>
              <div className="text-xs">{invoice.dispatchedThrough || ''}</div>
            </div>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="grid grid-cols-2 border-b-2 border-black">
          <div className="border-r-2 border-black p-3">
            <div className="text-xs font-bold mb-1">Buyer (Bill to): {invoice.customer?.name || ''}</div>
            <div className="text-xs">
              {invoice.customer?.address && (
                <div>Address: {invoice.customer.address}</div>
              )}
              {invoice.customer?.phone && (
                <div>Phone: {invoice.customer.phone}</div>
              )}
              {invoice.customer?.state && (
                <div>State Name: {invoice.customer.state}</div>
              )}
            </div>
          </div>
          <div className="p-2">
            <div className="text-xs font-semibold">Terms of Delivery</div>
            <div className="text-xs">{invoice.termsOfDelivery || ''}</div>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="border-r border-black p-2 text-left w-12">Sl No</th>
                <th className="border-r border-black p-2 text-left">Product Code</th>
                <th className="border-r border-black p-2 text-left">Description of Goods</th>
                <th className="border-r border-black p-2 text-left w-24">HSN/SAC</th>
                <th className="border-r border-black p-2 text-center w-20">Quantity</th>
                <th className="border-r border-black p-2 text-center w-16">Rate</th>
                <th className="border-r border-black p-2 text-center w-16">per</th>
                <th className="p-2 text-right w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={item.id} className="border-b border-black">
                  <td className="border-r border-black p-2">{index + 1}</td>
                  <td className="border-r border-black p-2">{item.part?.partNumber}</td>
                  <td className="border-r border-black p-2">{item.part?.itemName}</td>
                  <td className="border-r border-black p-2">{item.hsnCode}</td>
                  <td className="border-r border-black p-2 text-center">{item.quantity}</td>
                  <td className="border-r border-black p-2 text-right">₹ {formatAmount(item.rate)}</td>
                  <td className="border-r border-black p-2 text-center">{item.unit}</td>
                  <td className="p-2 text-right">{formatAmount(item.amount)}</td>
                </tr>
              ))}
              {/* Empty rows for spacing */}
              {Array.from({ length: Math.max(0, 5 - (invoice.items?.length || 0)) }).map((_, i) => (
                <tr key={`empty-${i}`} className="border-b border-black">
                  <td className="border-r border-black p-2">&nbsp;</td>
                  <td className="border-r border-black p-2">&nbsp;</td>
                  <td className="border-r border-black p-2">&nbsp;</td>
                  <td className="border-r border-black p-2">&nbsp;</td>
                  <td className="border-r border-black p-2">&nbsp;</td>
                  <td className="border-r border-black p-2">&nbsp;</td>
                  <td className="border-r border-black p-2">&nbsp;</td>
                  <td className="p-2">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="grid grid-cols-2 border-t-2 border-black">
          <div className="border-r-2 border-black"></div>
          <div>
            <div className="grid grid-cols-2 border-b border-black">
              <div className="border-r border-black p-2 text-xs font-semibold text-right">Total Amount</div>
              <div className="p-2 text-xs text-right">{formatAmount(invoice.subtotal)}</div>
            </div>
            {Number(invoice.discountPercent || 0) > 0 && (
              <div className="grid grid-cols-2 border-b border-black">
                <div className="border-r border-black p-2 text-xs font-semibold text-right">
                  Discount @{invoice.discountPercent}%
                </div>
                <div className="p-2 text-xs text-right">{formatAmount(invoice.discountAmount)}</div>
              </div>
            )}
            <div className="grid grid-cols-2 border-b border-black">
              <div className="border-r border-black p-2 text-xs font-semibold text-right">Taxable Value</div>
              <div className="p-2 text-xs text-right">{formatAmount(invoice.taxableValue)}</div>
            </div>
            {Number(invoice.cgstPercent || 0) > 0 && (
              <div className="grid grid-cols-2 border-b border-black">
                <div className="border-r border-black p-2 text-xs font-semibold text-right">
                  CGST @{invoice.cgstPercent}%
                </div>
                <div className="p-2 text-xs text-right">{formatAmount(invoice.cgstAmount)}</div>
              </div>
            )}
            {Number(invoice.sgstPercent || 0) > 0 && (
              <div className="grid grid-cols-2 border-b border-black">
                <div className="border-r border-black p-2 text-xs font-semibold text-right">
                  SGST @{invoice.sgstPercent}%
                </div>
                <div className="p-2 text-xs text-right">{formatAmount(invoice.sgstAmount)}</div>
              </div>
            )}
            <div className="grid grid-cols-2 border-b border-black">
              <div className="border-r border-black p-2 text-xs font-semibold text-right">Round off</div>
              <div className="p-2 text-xs text-right">{formatAmount(invoice.roundOff)}</div>
            </div>
            <div className="grid grid-cols-2 border-b-2 border-black bg-gray-50">
              <div className="border-r border-black p-2 text-xs font-bold text-right">Total</div>
              <div className="p-2 text-xs font-bold text-right">₹ {formatAmount(invoice.total)}</div>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="border-b-2 border-black p-3">
          <div className="text-xs font-bold">Total Amount (In words)</div>
          <div className="text-xs">INR {totalInWords} only.</div>
        </div>

        {/* Footer */}
        <div className="grid grid-cols-2">
          {/* Declaration */}
          <div className="border-r-2 border-black p-3">
            <div className="text-xs font-bold mb-2">Declaration</div>
            <div className="text-xs">
              We declare that this invoice shows the actual price of the goods
              described and that all particulars are true and correct.
            </div>
          </div>

          {/* Signature */}
          <div className="p-3">
            <div className="text-xs text-right">
              <div className="font-bold mb-12">for {companyName}</div>
              <div className="mt-8">Authorised Signatory</div>
            </div>
          </div>
        </div>

        {/* Computer Generated Invoice Note */}
        <div className="text-center text-xs py-2 border-t-2 border-black">
          This is a Computer Generated Invoice
        </div>
      </div>
    </div>
  );
}
