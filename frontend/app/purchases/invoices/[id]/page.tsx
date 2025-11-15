import { notFound } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function fetchInvoice(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return null;
  }
}

export default async function PurchaseInvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const invoice = await fetchInvoice(id);
  
  if (!invoice) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Purchase Invoice Details</h1>
          <p className="text-sm text-gray-500 mt-1">Invoice #{invoice.invoiceNumber}</p>
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
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Supplier Information</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500">Supplier:</span>
                  <p className="text-sm font-medium">{invoice.supplier?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

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
            href="/purchases/invoices"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Back to Invoices
          </a>
          {invoice.status === 'DRAFT' && (
            <a
              href={`/purchases/invoices/${invoice.id}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Invoice
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
