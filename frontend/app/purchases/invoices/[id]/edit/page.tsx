import PurchaseInvoiceEditForm from "@/components/Purchases/PurchaseInvoiceEditForm";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function getInvoice(id: string) {
  try {
    console.log(`Fetching invoice ${id} from ${API_BASE_URL}/api/invoices/${id}`);
    const res = await fetch(`${API_BASE_URL}/api/invoices/${id}`, {
      cache: 'no-store',
    });
    console.log('Response status:', res.status);
    if (!res.ok) {
      console.error('Failed to fetch invoice:', res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    console.log('Invoice data:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return null;
  }
}

export default async function EditPurchaseInvoicePage({ 
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

  return <PurchaseInvoiceEditForm invoice={invoice} />;
}
