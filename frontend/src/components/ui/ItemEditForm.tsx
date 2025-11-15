"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

type ItemFormData = {
  partNumber: string;
  itemName: string;
  description: string;
  hsnCode: string;
  gstPercent: number;
  unit: string;
  mrp: number;
  rtl: number;
  barcode: string;
  qrCode: string;
};

export default function ItemEditForm({ item }: { item: any }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<ItemFormData>({
    partNumber: item.partNumber || '',
    itemName: item.itemName || '',
    description: item.description || '',
    hsnCode: item.hsnCode || '',
    gstPercent: item.gstPercent || 18,
    unit: item.unit || 'PCS',
    mrp: item.mrp ? Number(item.mrp) : 0,
    rtl: item.rtl ? Number(item.rtl) : 0,
    barcode: item.barcode || '',
    qrCode: item.qrCode || '',
  });

  const handleChange = (field: keyof ItemFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.partNumber || !formData.itemName || !formData.hsnCode) {
      alert('Part Number, Item Name, and HSN Code are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/parts/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update item');
      }

      alert('Item updated successfully');
      router.push('/common/items');
    } catch (error: any) {
      alert('Error updating item: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/common/items" className="text-sm text-blue-600 hover:underline">
            ← Back to Items
          </Link>
          <h1 className="text-[17px] font-semibold text-gray-900">Edit Item - {item.partNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/common/items')}
            className="px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-1.5 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="px-6 py-6">
        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Part Number */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Part Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.partNumber}
                onChange={(e) => handleChange('partNumber', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Item Name */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.itemName}
                onChange={(e) => handleChange('itemName', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* HSN Code */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                HSN Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.hsnCode}
                onChange={(e) => handleChange('hsnCode', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* GST Percent */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">GST %</label>
              <input
                type="number"
                step="0.01"
                value={formData.gstPercent}
                onChange={(e) => handleChange('gstPercent', Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Unit */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PCS">PCS</option>
                <option value="SET">SET</option>
                <option value="LTR">LTR</option>
                <option value="KG">KG</option>
                <option value="MTR">MTR</option>
                <option value="BOX">BOX</option>
              </select>
            </div>

            {/* MRP */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.mrp}
                onChange={(e) => handleChange('mrp', Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* RTL */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">RTL (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.rtl}
                onChange={(e) => handleChange('rtl', Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Barcode */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* QR Code */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">QR Code</label>
              <input
                type="text"
                value={formData.qrCode}
                onChange={(e) => handleChange('qrCode', e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description - Full Width */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional item description..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/common/items')}
              className="px-6 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-sm bg-[#2c3e50] text-white rounded-md hover:bg-[#1a252f] transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
