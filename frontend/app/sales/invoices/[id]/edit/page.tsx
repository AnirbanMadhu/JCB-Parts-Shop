import SalesInvoiceEditForm from "@/components/Sales/SalesInvoiceEditForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function getInvoice(id: string) {
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

export default async function EditSalesInvoicePage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const invoice = await getInvoice(id);

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-red-600">Invoice not found</h1>
          <p className="mt-2 text-gray-600">The invoice you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  if (invoice.status !== 'DRAFT') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-red-600">Cannot Edit</h1>
          <p className="mt-2 text-gray-600">Only DRAFT invoices can be edited.</p>
        </div>
      </div>
    );
  }

  return <SalesInvoiceEditForm invoice={invoice} />;
}
