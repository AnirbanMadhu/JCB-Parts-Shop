'use client';

import { useState, useEffect } from 'react';
import SalesInvoiceEditForm from "@/app/sales/_components/SalesInvoiceEditForm";
import { useSettings } from '@/hooks/useSettings';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export default function EditSalesInvoicePage({ 
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
        const res = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}`, {
          cache: 'no-store',
        });
        if (!res.ok) {
          setError('Invoice not found');
          setLoading(false);
          return;
        }
        const data = await res.json();
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
  const allowEdit = settings.sales.allowEditSubmitted || invoice.status === 'DRAFT';

  if (!allowEdit) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-xl font-semibold text-red-600">Cannot Edit</h1>
          <p className="mt-2 text-gray-600">Only DRAFT invoices can be edited.</p>
          <p className="mt-4 text-sm text-gray-500">
            To enable editing of submitted invoices, go to Setup and enable "Allow Editing of Submitted Invoices" under Sales Configuration.
          </p>
        </div>
      </div>
    );
  }

  return <SalesInvoiceEditForm invoice={invoice} />;
}
