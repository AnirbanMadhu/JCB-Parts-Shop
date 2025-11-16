import { notFound } from "next/navigation";
import InvoiceView from "@/components/ui/InvoiceView";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export const dynamic = 'force-dynamic';

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

export default async function SalesInvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const invoice = await fetchInvoice(id);
  
  if (!invoice) {
    notFound();
  }
  
  return <InvoiceView invoice={invoice} />;
}
