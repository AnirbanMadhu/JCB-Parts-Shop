'use client';

import { useState, useEffect } from 'react';
import PurchaseInvoiceEditForm from "@/app/purchases/_components/PurchaseInvoiceEditForm";
import { useSettings } from '@/hooks/useSettings';
import { API_BASE_URL } from '@/lib/constants';

export default function EditPurchaseInvoicePage({ 
  params 
}: { 
  params: Promise<{ id: string }>
}) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const { settings, isLoaded } = useSettings();

  useEffect(() => {
    params.then(({ id }) => {
      setInvoiceId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!invoiceId) return;

    async function fetchInvoice() {
      try {
        console.log(`Fetching invoice ${invoiceId} from ${API_BASE_URL}/api/invoices/${invoiceId}`);
        const res = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
          cache: 'no-store',
        });
        console.log('Response status:', res.status);
        if (!res.ok) {
          console.error('Failed to fetch invoice:', res.status, res.statusText);
          setError('Invoice not found');
          setLoading(false);
          return;
        }
        const data = await res.json();
        console.log('Invoice data:', data);
        setInvoice(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch invoice:', err);
        setError('Failed to load invoice');
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceId]);

  if (loading || !isLoaded) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-red-600">Invoice not found</h1>
          <p className="mt-2 text-gray-600">The invoice you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Check if editing is allowed based on settings
  const allowEdit = settings.purchases.allowEditSubmitted || invoice.status === 'DRAFT';

  if (!allowEdit) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-red-600">Cannot Edit</h1>
          <p className="mt-2 text-gray-600">Only DRAFT invoices can be edited.</p>
          <p className="mt-4 text-sm text-gray-500">
            To enable editing of submitted invoices, go to Setup and enable "Allow Editing of Submitted Invoices" under Purchases Configuration.
          </p>
        </div>
      </div>
    );
  }

  return <PurchaseInvoiceEditForm invoice={invoice} />;
}
