import { notFound } from "next/navigation";
import Link from "next/link";
import BackButton from "@/components/ui/BackButton";
import { Package, Tag, Hash, IndianRupee, Layers } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

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
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-[17px] font-semibold text-gray-900">Item Details</h1>
        </div>
        <Link 
          href={`/common/items/${item.id}/edit`}
          className="px-4 py-1.5 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors"
        >
          Edit Item
        </Link>
      </header>

      <div className="px-6 py-6">
        {/* Item Info Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{item.itemName}</h2>
              <p className="text-sm text-gray-500">Part Number: <span className="font-mono font-medium text-gray-900">{item.partNumber}</span></p>
            </div>
            <div className={`px-4 py-2 rounded-lg text-center ${
              stock > 10 ? 'bg-green-50 border border-green-200' : 
              stock > 0 ? 'bg-yellow-50 border border-yellow-200' : 
              'bg-red-50 border border-red-200'
            }`}>
              <p className="text-xs text-gray-600 mb-1">Current Stock</p>
              <p className={`text-3xl font-bold ${
                stock > 10 ? 'text-green-600' : 
                stock > 0 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {stock}
              </p>
              <p className="text-xs text-gray-500 mt-1">{item.unit}</p>
            </div>
          </div>

          {item.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <p className="text-sm text-gray-900">{item.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">HSN Code</p>
                <p className="text-sm text-gray-900 font-mono">{item.hsnCode}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Unit</p>
                <p className="text-sm text-gray-900">{item.unit}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">GST Rate</p>
                <p className="text-sm text-gray-900">{item.gstPercent}%</p>
              </div>
            </div>

            {item.mrp && (
              <div className="flex items-start gap-3">
                <IndianRupee className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">MRP</p>
                  <p className="text-sm text-gray-900 font-semibold">
                    ₹{Number(item.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}

            {item.rtl && (
              <div className="flex items-start gap-3">
                <IndianRupee className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Retail Price</p>
                  <p className="text-sm text-gray-900 font-semibold">
                    ₹{Number(item.rtl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}

            {item.barcode && (
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Barcode</p>
                  <p className="text-sm text-gray-900 font-mono">{item.barcode}</p>
                </div>
              </div>
            )}

            {item.qrCode && (
              <div className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">QR Code</p>
                  <p className="text-sm text-gray-900 font-mono">{item.qrCode}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500">Created At</p>
              <p className="text-gray-900">
                {new Date(item.createdAt).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Updated</p>
              <p className="text-gray-900">
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
  );
}
