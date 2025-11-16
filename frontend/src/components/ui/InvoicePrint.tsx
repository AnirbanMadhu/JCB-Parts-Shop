'use client';

import React, { useMemo } from 'react';

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

const ITEMS_PER_PAGE = 15; // Approximate items that fit on one page

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

  // Split items into pages
  const pages = useMemo(() => {
    const items = invoice.items || [];
    const pageArray: InvoiceItem[][] = [];
    
    for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
      pageArray.push(items.slice(i, i + ITEMS_PER_PAGE));
    }
    
    // If no items, create one empty page
    if (pageArray.length === 0) {
      pageArray.push([]);
    }
    
    return pageArray;
  }, [invoice.items]);

  const InvoiceHeader = () => (
    <>
      {/* Title */}
      <div className="text-center border-b-2 border-black py-1">
        <h1 className="text-sm font-bold">Tax Invoice</h1>
      </div>

      {/* Company & Invoice Info */}
      <div className="grid grid-cols-2 border-b-2 border-black">
        {/* Left: Company Details */}
        <div className="border-r-2 border-black p-2">
          <div className="font-bold text-xs mb-1">{companyName}</div>
          <div className="text-[9px]">
            <div>PROP: SUKANTA PAUL</div>
            <div>ROY GATE PALASHI, MAJHI PARA</div>
            <div>GSTIN/UIN: {companyGstin}</div>
            <div>State Name: {companyState}, Code: {companyStateCode}</div>
          </div>
        </div>

        {/* Right: Invoice Info */}
        <div>
          <div className="border-b border-black p-1.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] font-semibold">Invoice No.</span>
                <div className="text-[9px] mt-0.5">{invoice.invoiceNumber}</div>
              </div>
              <div>
                <span className="text-[9px] font-semibold">Dated</span>
                <div className="text-[9px] mt-0.5">{formatDate(invoice.date)}</div>
              </div>
            </div>
          </div>
          <div className="p-1.5">
            <div className="text-[9px] font-semibold">Delivery Note</div>
            <div className="text-[9px] mt-0.5">{invoice.deliveryNote || ''}</div>
          </div>
        </div>
      </div>

      {/* Consignee & Buyer Order Info */}
      <div className="grid grid-cols-2 border-b-2 border-black">
        {/* Consignee (Ship to) */}
        <div className="border-r-2 border-black p-2">
          <div className="text-[9px] font-bold mb-1">Consignee (Ship to)</div>
          <div className="text-[9px]">
            <div className="font-semibold mb-0.5">NAME: {invoice.customer?.name || ''}</div>
            {invoice.customer?.address && (
              <div className="mb-0.5">Address: {invoice.customer.address}</div>
            )}
            {invoice.customer?.phone && (
              <div className="mb-0.5">Phone: {invoice.customer.phone}</div>
            )}
            {invoice.customer?.gstin && (
              <div className="mb-0.5">GSTIN/UIN: {invoice.customer.gstin}</div>
            )}
            {invoice.customer?.state && (
              <div>State Name: {invoice.customer.state}</div>
            )}
          </div>
        </div>

        {/* Buyer Info */}
        <div>
          <div className="border-b border-black p-1.5">
            <div className="text-[9px] font-semibold">Buyer's Order No.</div>
            <div className="text-[9px] mt-0.5">{invoice.buyerOrderNo || ''}</div>
          </div>
          <div className="border-b border-black p-1.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[9px] font-semibold">Dispatch Doc No.</div>
                <div className="text-[9px] mt-0.5">{invoice.dispatchDocNo || ''}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold">Delivery Note Date</div>
                <div className="text-[9px] mt-0.5">{invoice.deliveryNoteDate ? formatDate(invoice.deliveryNoteDate) : ''}</div>
              </div>
            </div>
          </div>
          <div className="p-1.5">
            <div className="text-[9px] font-semibold">Dispatched through</div>
            <div className="text-[9px] mt-0.5">{invoice.dispatchedThrough || ''}</div>
          </div>
        </div>
      </div>

      {/* Buyer Bill To Info */}
      <div className="grid grid-cols-2 border-b-2 border-black">
        <div className="border-r-2 border-black p-2">
          <div className="text-[9px] font-bold mb-1">Buyer (Bill to): {invoice.customer?.name || ''}</div>
          <div className="text-[9px]">
            {invoice.customer?.address && (
              <div className="mb-0.5">Address: {invoice.customer.address}</div>
            )}
            {invoice.customer?.phone && (
              <div className="mb-0.5">Phone: {invoice.customer.phone}</div>
            )}
            {invoice.customer?.state && (
              <div>State Name: {invoice.customer.state}</div>
            )}
          </div>
        </div>
        <div className="p-2">
          <div className="text-[9px] font-semibold">Terms of Delivery</div>
          <div className="text-[9px] mt-0.5">{invoice.termsOfDelivery || ''}</div>
        </div>
      </div>
    </>
  );

  const ItemsTableHeader = () => (
    <thead>
      <tr className="border-b-2 border-black">
        <th className="border-r border-black p-1 text-left text-[9px] font-bold w-10">Sl<br/>No</th>
        <th className="border-r border-black p-1 text-left text-[9px] font-bold">Product Code</th>
        <th className="border-r border-black p-1 text-left text-[9px] font-bold">Description of Goods</th>
        <th className="border-r border-black p-1 text-left text-[9px] font-bold">HSN/SAC</th>
        <th className="border-r border-black p-1 text-center text-[9px] font-bold">Quantity</th>
        <th className="border-r border-black p-1 text-center text-[9px] font-bold">Rate</th>
        <th className="border-r border-black p-1 text-center text-[9px] font-bold">per</th>
        <th className="p-1 text-right text-[9px] font-bold">Amount</th>
      </tr>
    </thead>
  );

  return (
    <div className="invoice-print bg-white">
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
            margin: 0;
            padding: 0;
          }
          .invoice-page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .invoice-page:last-child {
            page-break-after: auto;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 10mm;
            size: A4 portrait;
          }
        }
        @media screen {
          .invoice-page {
            margin-bottom: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        const startIndex = pageIndex * ITEMS_PER_PAGE;
        
        return (
          <div key={pageIndex} className="invoice-page max-w-[210mm] mx-auto p-4">
            <div className="border-2 border-black">
              <InvoiceHeader />

              {/* Items Table */}
              <div>
                <table className="w-full text-[9px]">
                  <ItemsTableHeader />
                  <tbody>
                    {pageItems.map((item, index) => (
                      <tr key={item.id} className="border-b border-black">
                        <td className="border-r border-black p-1">{startIndex + index + 1}</td>
                        <td className="border-r border-black p-1">{item.part?.partNumber || ''}</td>
                        <td className="border-r border-black p-1">{item.part?.itemName || ''}</td>
                        <td className="border-r border-black p-1 text-center">{item.hsnCode || item.part?.hsnCode || ''}</td>
                        <td className="border-r border-black p-1 text-center">{item.quantity}</td>
                        <td className="border-r border-black p-1 text-right">₹ {formatAmount(item.rate)}</td>
                        <td className="border-r border-black p-1 text-center">{item.unit || item.part?.unit || ''}</td>
                        <td className="p-1 text-right">{formatAmount(item.amount)}</td>
                      </tr>
                    ))}
                    
                    {/* Add empty rows on last page if needed for spacing */}
                    {isLastPage && pageItems.length < 3 && Array.from({ length: 3 - pageItems.length }).map((_, i) => (
                      <tr key={`empty-${i}`} className="border-b border-black">
                        <td className="border-r border-black p-1 h-6">&nbsp;</td>
                        <td className="border-r border-black p-1">&nbsp;</td>
                        <td className="border-r border-black p-1">&nbsp;</td>
                        <td className="border-r border-black p-1">&nbsp;</td>
                        <td className="border-r border-black p-1">&nbsp;</td>
                        <td className="border-r border-black p-1">&nbsp;</td>
                        <td className="border-r border-black p-1">&nbsp;</td>
                        <td className="p-1">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Show totals only on last page */}
              {isLastPage && (
                <>
                  {/* Totals Section */}
                  <div className="grid grid-cols-2 border-t-2 border-black">
                    <div className="border-r-2 border-black"></div>
                    <div>
                      <div className="grid grid-cols-2 border-b border-black">
                        <div className="border-r border-black p-1 text-[9px] font-semibold text-right">Total Amount</div>
                        <div className="p-1 text-[9px] text-right">{formatAmount(invoice.subtotal)}</div>
                      </div>
                      {Number(invoice.discountPercent || 0) > 0 && (
                        <div className="grid grid-cols-2 border-b border-black">
                          <div className="border-r border-black p-1 text-[9px] font-semibold text-right">
                            Discount @{invoice.discountPercent}%
                          </div>
                          <div className="p-1 text-[9px] text-right">{formatAmount(invoice.discountAmount)}</div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 border-b border-black">
                        <div className="border-r border-black p-1 text-[9px] font-semibold text-right">Taxable Value</div>
                        <div className="p-1 text-[9px] text-right">{formatAmount(invoice.taxableValue)}</div>
                      </div>
                      {Number(invoice.cgstPercent || 0) > 0 && (
                        <div className="grid grid-cols-2 border-b border-black">
                          <div className="border-r border-black p-1 text-[9px] font-semibold text-right">
                            CGST @{invoice.cgstPercent}%
                          </div>
                          <div className="p-1 text-[9px] text-right">{formatAmount(invoice.cgstAmount)}</div>
                        </div>
                      )}
                      {Number(invoice.sgstPercent || 0) > 0 && (
                        <div className="grid grid-cols-2 border-b border-black">
                          <div className="border-r border-black p-1 text-[9px] font-semibold text-right">
                            SGST @{invoice.sgstPercent}%
                          </div>
                          <div className="p-1 text-[9px] text-right">{formatAmount(invoice.sgstAmount)}</div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 border-b border-black">
                        <div className="border-r border-black p-1 text-[9px] font-semibold text-right">Round off</div>
                        <div className="p-1 text-[9px] text-right">{formatAmount(invoice.roundOff)}</div>
                      </div>
                      <div className="grid grid-cols-2 border-b-2 border-black">
                        <div className="border-r border-black p-1 text-[9px] font-bold text-right">Total</div>
                        <div className="p-1 text-[9px] font-bold text-right">₹ {formatAmount(invoice.total)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Amount in Words */}
                  <div className="border-b-2 border-black p-2">
                    <div className="text-[9px] font-bold">Total Amount (In words)</div>
                    <div className="text-[9px]">INR {totalInWords} only.</div>
                  </div>

                  {/* Footer with Declaration and Signature */}
                  <div className="grid grid-cols-2 min-h-[100px]">
                    {/* Declaration */}
                    <div className="border-r-2 border-black p-2">
                      <div className="text-[9px] font-bold mb-1">Declaration</div>
                      <div className="text-[9px]">
                        We declare that this invoice shows the actual price of the goods
                        described and that all particulars are true and correct.
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="p-2 relative">
                      <div className="text-[9px] text-right">
                        <div className="font-bold mb-1">for {companyName}</div>
                        <div className="mt-16 pt-2">Authorised Signatory</div>
                      </div>
                    </div>
                  </div>

                  {/* Computer Generated Invoice Note */}
                  <div className="text-center text-[9px] py-1 border-t-2 border-black">
                    This is a Computer Generated Invoice
                  </div>
                </>
              )}

              {/* For non-last pages, show continuation note */}
              {!isLastPage && (
                <div className="border-t-2 border-black p-2 text-center text-[9px] italic">
                  Continued on next page...
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
