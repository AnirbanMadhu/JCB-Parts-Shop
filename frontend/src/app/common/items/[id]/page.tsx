import { notFound } from "next/navigation";
import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import { Package, Tag, Hash, IndianRupee, Layers } from "lucide-react";
import { API_BASE_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{
    id: string;
  }>;
};

async function fetchItem(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/parts/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch item:', error);
    return null;
  }
}

async function fetchItemStock(id: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/stock/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return { stock: 0 };
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch item stock:', error);
    return { stock: 0 };
  }
}

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await fetchItem(id);
  
  if (!item) {
    notFound();
  }

  const stockData = await fetchItemStock(id);
  const stock = stockData.stock || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-[17px] font-semibold text-foreground">Item Details</h1>
          </div>
        </div>
        <Link 
          href={`/common/items/${item.id}/edit`}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
        >
          Edit Item
        </Link>
      </header>

      <div className="px-6 py-6">
        {/* Item Info Card */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">{item.itemName}</h2>
              <p className="text-sm text-muted-foreground">Part Number: <span className="font-mono font-medium text-foreground">{item.partNumber}</span></p>
            </div>
            <div className={`px-4 py-3 rounded-lg text-center min-w-[120px] ${
              stock > 10 ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' : 
              stock > 0 ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800' : 
              'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
            }`}>
              <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
              <p className={`text-3xl font-bold ${
                stock > 10 ? 'text-green-600 dark:text-green-500' : 
                stock > 0 ? 'text-yellow-600 dark:text-yellow-500' : 
                'text-red-600 dark:text-red-500'
              }`}>
                {stock}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{item.unit}</p>
            </div>
          </div>

          {item.description && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Description</p>
              <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">HSN Code</p>
                <p className="text-sm text-foreground font-mono font-medium">{item.hsnCode}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Unit</p>
                <p className="text-sm text-foreground font-medium">{item.unit}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">GST Rate</p>
                <p className="text-sm text-foreground font-medium">{item.gstPercent}%</p>
              </div>
            </div>

            {item.mrp && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <IndianRupee className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">MRP</p>
                  <p className="text-sm text-foreground font-semibold">
                    ₹{Number(item.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}

            {item.rtl && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <IndianRupee className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Retail Price</p>
                  <p className="text-sm text-foreground font-semibold">
                    ₹{Number(item.rtl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}

            {item.barcode && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <Layers className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Barcode</p>
                  <p className="text-sm text-foreground font-mono font-medium">{item.barcode}</p>
                </div>
              </div>
            )}

            {item.qrCode && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                <Layers className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">QR Code</p>
                  <p className="text-sm text-foreground font-mono font-medium">{item.qrCode}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted/50">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created At</p>
                <p className="text-foreground font-medium">
                  {new Date(item.createdAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-muted/50">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-foreground font-medium">
                  {new Date(item.updatedAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
