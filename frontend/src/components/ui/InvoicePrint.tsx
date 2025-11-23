"use client";

import React, { useMemo } from "react";

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
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const numberToWords = (num: number): string => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    if (num === 0) return "Zero";

    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n >= 10 && n < 20) return teens[n - 10];
      if (n >= 20 && n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      if (n >= 100 && n < 1000)
        return (
          ones[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 !== 0 ? " " + convert(n % 100) : "")
        );
      if (n >= 1000 && n < 100000)
        return (
          convert(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 !== 0 ? " " + convert(n % 1000) : "")
        );
      if (n >= 100000 && n < 10000000)
        return (
          convert(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 !== 0 ? " " + convert(n % 100000) : "")
        );
      if (n >= 10000000)
        return (
          convert(Math.floor(n / 10000000)) +
          " Crore" +
          (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "")
        );
      return "";
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
        <h1 className="text-sm font-bold text-black">Tax Invoice</h1>
      </div>

      {/* Company & Invoice Info */}
      <div className="grid grid-cols-2 border-b-2 border-black">
        {/* Left: Company Details */}
        <div className="border-r-2 border-black p-2">
          <div className="font-bold text-xs mb-1 text-black">{companyName}</div>
          <div className="text-[9px] text-black">
            <div>PROP: SUKANTA PAUL</div>
            <div>ROY GATE PALASHI, MAJHI PARA</div>
            <div>GSTIN/UIN: {companyGstin}</div>
            <div>
              State Name: {companyState}, Code: {companyStateCode}
            </div>
          </div>
        </div>

        {/* Right: Invoice Info */}
        <div>
          <div className="border-b border-black p-1.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] font-semibold text-black">
                  Invoice No.
                </span>
                <div className="text-[9px] mt-0.5 text-black">
                  {invoice.invoiceNumber}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-semibold text-black">
                  Dated
                </span>
                <div className="text-[9px] mt-0.5 text-black">
                  {formatDate(invoice.date)}
                </div>
              </div>
            </div>
          </div>
          <div className="p-1.5">
            <div className="text-[9px] font-semibold text-black">
              Delivery Note
            </div>
            <div className="text-[9px] mt-0.5 text-black">
              {invoice.deliveryNote || ""}
            </div>
          </div>
        </div>
      </div>

      {/* Consignee & Buyer Order Info */}
      <div className="grid grid-cols-2 border-b-2 border-black">
        {/* Consignee (Ship to) */}
        <div className="border-r-2 border-black p-2">
          <div className="text-[9px] font-bold mb-1 text-black">
            Consignee (Ship to)
          </div>
          <div className="text-[9px] text-black">
            <div className="font-semibold mb-0.5">
              NAME: {invoice.customer?.name || ""}
            </div>
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
            <div className="text-[9px] font-semibold text-black">
              Buyer's Order No.
            </div>
            <div className="text-[9px] mt-0.5 text-black">
              {invoice.buyerOrderNo || ""}
            </div>
          </div>
          <div className="border-b border-black p-1.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[9px] font-semibold text-black">
                  Dispatch Doc No.
                </div>
                <div className="text-[9px] mt-0.5 text-black">
                  {invoice.dispatchDocNo || ""}
                </div>
              </div>
              <div>
                <div className="text-[9px] font-semibold text-black">
                  Delivery Note Date
                </div>
                <div className="text-[9px] mt-0.5 text-black">
                  {invoice.deliveryNoteDate
                    ? formatDate(invoice.deliveryNoteDate)
                    : ""}
                </div>
              </div>
            </div>
          </div>
          <div className="p-1.5">
            <div className="text-[9px] font-semibold text-black">
              Dispatched through
            </div>
            <div className="text-[9px] mt-0.5 text-black">
              {invoice.dispatchedThrough || ""}
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Bill To Info */}
      <div className="grid grid-cols-2 border-b-2 border-black">
        <div className="border-r-2 border-black p-2">
          <div className="text-[9px] font-bold mb-1 text-black">
            Buyer (Bill to): {invoice.customer?.name || ""}
          </div>
          <div className="text-[9px] text-black">
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
          <div className="text-[9px] font-semibold text-black">
            Terms of Delivery
          </div>
          <div className="text-[9px] mt-0.5 text-black">
            {invoice.termsOfDelivery || ""}
          </div>
        </div>
      </div>
    </>
  );

  const ItemsTableHeader = () => (
    <thead>
      <tr className="border-b border-black bg-white">
        <th className="border-r border-black p-1 text-center text-[10px] font-semibold w-12 text-black align-middle">
          Sl
          <br />
          No
        </th>
        <th className="border-r border-black p-1 text-center text-[10px] font-semibold w-24 text-black align-middle">
          Product Code
        </th>
        <th className="border-r border-black p-1 text-center text-[10px] font-semibold text-black align-middle">
          Description of Goods
        </th>
        <th className="border-r border-black p-1 text-center text-[10px] font-semibold w-20 text-black align-middle">
          HSN/SAC
        </th>
        <th className="border-r border-black p-1 text-center text-[10px] font-semibold w-16 text-black align-middle">
          Quantity
        </th>
        <th className="border-r border-black p-1 text-center text-[10px] font-semibold w-20 text-black align-middle">
          Rate
        </th>
        <th className="border-r border-black p-1 text-center text-[10px] font-semibold w-12 text-black align-middle">
          per
        </th>
        <th className="p-1 text-center text-[10px] font-semibold w-24 text-black align-middle">
          Amount
        </th>
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
          .invoice-print,
          .invoice-print * {
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
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>

      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        const startIndex = pageIndex * ITEMS_PER_PAGE;

        return (
          <div
            key={pageIndex}
            className="invoice-page max-w-[210mm] mx-auto p-4"
          >
            <div className="border-2 border-black">
              <InvoiceHeader />

              {/* Items Table */}
              <div>
                <table className="w-full text-[9px]">
                  <ItemsTableHeader />
                  <tbody>
                    {pageItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-black bg-white"
                      >
                        <td className="border-r border-black p-1.5 text-center text-[10px] text-black align-top">
                          {startIndex + index + 1}
                        </td>
                        <td className="border-r border-black p-1.5 text-[10px] text-black align-top">
                          {item.part?.partNumber || ""}
                        </td>
                        <td className="border-r border-black p-1.5 text-[10px] text-black align-top">
                          {item.part?.itemName || ""}
                        </td>
                        <td className="border-r border-black p-1.5 text-center text-[10px] text-black align-top">
                          {(item.hsnCode || item.part?.hsnCode || "").replace(
                            /(\d{4})(\d{2})(\d{2})/,
                            "$1 $2 $3"
                          )}
                        </td>
                        <td className="border-r border-black p-1.5 text-center text-[10px] text-black align-top">
                          {item.quantity}
                        </td>
                        <td className="border-r border-black p-1.5 text-right text-[10px] text-black align-top">
                          ₹
                          <span className="ml-2">
                            {formatAmount(item.rate)}
                          </span>
                        </td>
                        <td className="border-r border-black p-1.5 text-center text-[10px] text-black align-top">
                          {item.unit || item.part?.unit || ""}
                        </td>
                        <td className="p-1.5 text-right text-[10px] text-black align-top">
                          {formatAmount(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Show totals only on last page */}
              {isLastPage && (
                <>
                  {/* Totals Section - Full Width with Right Column for Amounts */}
                  <div className="border-t border-black">
                    <div className="flex">
                      {/* Left Empty Space */}
                      <div className="flex-1 border-r border-black"></div>

                      {/* Right Column with Totals */}
                      <div className="w-80">
                        <div className="flex border-b border-black">
                          <div className="flex-1 p-1.5 text-[10px] font-semibold text-right text-black">
                            Subtotal
                          </div>
                          <div className="w-28 p-1.5 text-[10px] text-right text-black">
                            {formatAmount(invoice.subtotal)}
                          </div>
                        </div>
                        {Number(invoice.cgstPercent || 0) > 0 && (
                          <div className="flex border-b border-black">
                            <div className="flex-1 p-1.5 text-[10px] font-semibold text-right text-black">
                              CGST @{invoice.cgstPercent}%
                            </div>
                            <div className="w-28 p-1.5 text-[10px] text-right text-black">
                              {formatAmount(invoice.cgstAmount)}
                            </div>
                          </div>
                        )}
                        {Number(invoice.sgstPercent || 0) > 0 && (
                          <div className="flex border-b border-black">
                            <div className="flex-1 p-1.5 text-[10px] font-semibold text-right text-black">
                              SGST @{invoice.sgstPercent}%
                            </div>
                            <div className="w-28 p-1.5 text-[10px] text-right text-black">
                              {formatAmount(invoice.sgstAmount)}
                            </div>
                          </div>
                        )}
                        {(Number(invoice.discountPercent || 0) > 0 ||
                          Number(invoice.discountAmount || 0) > 0) && (
                          <div className="flex border-b border-black">
                            <div className="flex-1 p-1.5 text-[10px] font-semibold text-right text-black">
                              Discount
                              {(invoice.discountPercent ?? 0) > 0
                                ? ` @${invoice.discountPercent}%`
                                : ""}
                            </div>
                            <div className="w-28 p-1.5 text-[10px] text-right text-black">
                              -{formatAmount(invoice.discountAmount)}
                            </div>
                          </div>
                        )}
                        <div className="flex border-b border-black">
                          <div className="flex-1 p-1.5 text-[10px] font-semibold text-right text-black">
                            Round off
                          </div>
                          <div className="w-28 p-1.5 text-[10px] text-right text-black">
                            {formatAmount(invoice.roundOff)}
                          </div>
                        </div>
                        <div className="flex border-b border-black">
                          <div className="flex-1 p-1.5 text-[10px] font-bold text-right text-black">
                            Grand Total
                          </div>
                          <div className="w-28 p-1.5 text-[11px] font-bold text-right text-black">
                            ₹
                            <span className="ml-2">
                              {formatAmount(invoice.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount in Words */}
                  <div className="border-b border-black border-t border-black p-2.5">
                    <div className="text-[10px] font-bold text-black mb-1">
                      Total Amount (In words)
                    </div>
                    <div className="text-[10px] text-black">
                      INR {totalInWords} only.
                    </div>
                    <div className="text-[8px] text-right text-black mt-1">
                      E. & O.E
                    </div>
                  </div>

                  {/* Footer with Declaration and Signature */}
                  <div className="grid grid-cols-2 min-h-[120px]">
                    {/* Declaration */}
                    <div className="border-r border-black p-3">
                      <div className="text-[10px] font-bold mb-2 text-black">
                        Declaration
                      </div>
                      <div className="text-[9px] text-black leading-relaxed">
                        We declare that this invoice shows the actual price of
                        the goods described and that all particulars are true
                        and correct.
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="p-3 relative">
                      <div className="text-[10px] text-right text-black h-full flex flex-col justify-between">
                        <div>
                          <div className="font-bold mb-1">
                            for {companyName}
                          </div>
                        </div>
                        <div className="mt-auto">
                          <div className="mb-1">Authorised Signatory</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Computer Generated Invoice Note */}
                  <div className="text-center text-[9px] py-1.5 border-t border-black text-black">
                    This is a Computer Generated Invoice
                  </div>
                </>
              )}

              {/* For non-last pages, show continuation note */}
              {!isLastPage && (
                <div className="border-t-2 border-black p-2 text-center text-[9px] italic text-black">
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
