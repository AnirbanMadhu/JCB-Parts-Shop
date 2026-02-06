"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import ToastContainer from "./ToastContainer";



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
  const { toasts, removeToast, success, error } = useToast();
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
      error('Part Number, Item Name, and HSN Code are required');
      return;
    }

    setSaving(true);
    try {
      // Prepare data - convert empty strings to null for optional fields
      const submitData = {
        ...formData,
        barcode: formData.barcode || null,
        qrCode: formData.qrCode || null,
        description: formData.description || null,
      };

      const res = await fetch(`/api/parts/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update item');
      }

      const updatedItem = await res.json();
      success('Item updated successfully');
      
      // Refresh the router to show updated data
      router.refresh();
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/common/items');
      }, 1500);
    } catch (err: any) {
      error(err.message || 'Error updating item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <header className="sticky top-0 z-10 bg-card border-b border-border px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/common/items" className="text-sm text-primary hover:underline transition-colors">
            ← Back to Items
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-1 h-6 bg-primary rounded-full" />
            <h1 className="text-[17px] font-semibold text-foreground">Edit Item - {item.partNumber}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push('/common/items')}
            className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors border border-border cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-sm cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <div className="px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Part Number */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">
                    Part Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.partNumber}
                    onChange={(e) => handleChange('partNumber', e.target.value.toUpperCase())}
                    className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="e.g., 550/42835C, 336/E8026"
                    pattern="[0-9]+/[A-Z0-9]+"
                    title="Format: Number/Alphanumeric (e.g., 550/42835C)"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Format: Number/Alphanumeric (e.g., 550/42835C, 336/E8026)</p>
                </div>

                {/* Item Name */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">
                    Item Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) => handleChange('itemName', e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* HSN Code */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">
                    HSN Code <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => handleChange('hsnCode', e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* GST Percent */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">GST %</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.gstPercent}
                    onChange={(e) => handleChange('gstPercent', Number(e.target.value))}
                    className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>

                {/* Unit */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
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
                  <label className="text-sm font-medium text-foreground mb-2">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mrp}
                    onChange={(e) => handleChange('mrp', Number(e.target.value))}
                    className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>

                {/* RTL */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">RTL (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.rtl}
                    onChange={(e) => handleChange('rtl', Number(e.target.value))}
                    className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                </div>

                {/* Barcode */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => handleChange('barcode', e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="Product barcode"
                  />
                </div>

                {/* QR Code */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-2">QR Code</label>
                  <input
                    type="text"
                    value={formData.qrCode}
                    onChange={(e) => handleChange('qrCode', e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    placeholder="Product QR code"
                  />
                </div>

                {/* Description - Full Width */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-medium text-foreground mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={4}
                    className="rounded-md border border-input bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
                    placeholder="Optional item description..."
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => router.push('/common/items')}
                  className="px-6 py-2.5 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors border border-border cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 shadow-sm cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
