"use client";

import { API_BASE_URL } from '@/lib/constants';

import { useEffect, useMemo, useState } from "react";
import ScannerInput from "./ScannerInput";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";

type Line = {
  code: string;
  partId: number;
  name: string;
  uom?: string;
  price: number;
  qty: number;
  taxRate: number;
  discount: number;
};

type Supplier = { id: number; name: string };



async function fetchProductByCode(code: string) {
  // Extract code from URL if it's a URL (e.g., https://lamilink.in/q?q=CODE)
  let searchCode = code;
  try {
    const urlObj = new URL(code);
    const qParam = urlObj.searchParams.get('q');
    if (qParam) {
      searchCode = qParam;
    }
  } catch {
    // Not a URL, use the code as-is
  }

  try {
    let url = `${API_BASE_URL}/api/parts/search?barcode=${encodeURIComponent(searchCode)}`;
    let res = await fetch(url, { cache: "no-store" });
    
    if (res.ok) {
      return await res.json();
    }
    
    url = `${API_BASE_URL}/api/parts/search?q=${encodeURIComponent(searchCode)}`;
    res = await fetch(url, { cache: "no-store" });
    
    if (res.ok) {
      const parts = await res.json();
      if (parts.length > 0) {
        return parts[0];
      }
    }
    
    throw new Error(`No part found with code: ${searchCode}`);
  } catch (error) {
    console.error("Error fetching part:", error);
    throw error;
  }
}

export default function PurchaseInvoiceEditForm({ invoice }: { invoice: any }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [number, setNumber] = useState<string>(invoice.invoiceNumber);
  const [date, setDate] = useState<string>(() =>
    new Date(invoice.date).toISOString().slice(0, 10)
  );

  const [supplier, setSupplier] = useState<Supplier | null>(
    invoice.supplier ? { id: invoice.supplier.id, name: invoice.supplier.name } : null
  );
  const [supplierQuery, setSupplierQuery] = useState("");

  const [lines, setLines] = useState<Line[]>(() =>
    invoice.items.map((item: any) => ({
      code: item.part.partNumber,
      partId: item.part.id,
      name: item.part.itemName,
      uom: item.unit,
      price: Number(item.rate),
      qty: item.quantity,
      taxRate: Number(item.part.gstPercent ?? 0),
      discount: 0,
    }))
  );

  const [notes, setNotes] = useState(invoice.note || "");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [partSearchQuery, setPartSearchQuery] = useState("");
  const [partSuggestions, setPartSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const totals = useMemo(() => {
    const sub = lines.reduce((s, l) => s + l.qty * (l.price - l.discount), 0);
    const tax = lines.reduce(
      (s, l) => s + (l.qty * (l.price - l.discount) * l.taxRate) / 100,
      0
    );
    return { sub, tax, grand: sub + tax };
  }, [lines]);

  const handleScan = async (code: string) => {
    const exists = lines.findIndex((l) => l.code === code);
    if (exists >= 0) {
      setLines((prev) =>
        prev.map((l, i) => (i === exists ? { ...l, qty: l.qty + 1 } : l))
      );
      success(`Added 1 more "${lines[exists].name}" (Total: ${lines[exists].qty + 1})`);
      return;
    }

    try {
      const p = await fetchProductByCode(code);
      setLines((prev) => [
        ...prev,
        {
          code: p.partNumber,
          partId: p.id,
          name: p.itemName,
          uom: p.unit,
          price: Number(p.rtl ?? p.mrp ?? 0),
          qty: 1,
          taxRate: Number(p.gstPercent ?? 0),
          discount: 0,
        },
      ]);
      success(`Added "${p.itemName}" to invoice`);
    } catch (error: any) {
      toastError(error.message || "Part not found. Please check the code and try again.");
    }
  };

  // Enable barcode scanner
  useBarcodeScanner({
    onScan: handleScan,
    enabled: !saving && !showPreview,
    minLength: 3,
    enableSound: true,
    enableVisualFeedback: true,
  });

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async (submit: boolean) => {
    if (!supplier || lines.length === 0) {
      toastError("Please select a supplier and add at least one item");
      return;
    }

    setSaving(true);
    try {
      const avgTaxRate = lines.reduce((sum, l) => sum + l.taxRate, 0) / lines.length;
      const cgstPercent = avgTaxRate / 2;
      const sgstPercent = avgTaxRate / 2;

      const invoiceData = {
        invoiceNumber: number,
        date: date,
        type: "PURCHASE" as const,
        status: submit ? "SUBMITTED" as const : "DRAFT" as const,
        supplierId: supplier.id,
        items: lines.map(l => ({
          partId: l.partId,
          quantity: l.qty,
          rate: l.price - l.discount,
          unit: l.uom
        })),
        discountPercent: 0,
        cgstPercent,
        sgstPercent
      };

      const res = await fetch(`${API_BASE_URL}/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update invoice");
      }

      router.push("/purchases/invoices");
    } catch (error: any) {
      toastError("Error updating invoice: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  
  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/suppliers`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setAllSuppliers(data);
        }
      } catch (error) {
        console.error("Error loading suppliers:", error);
      }
    }
    loadSuppliers();
  }, []);

  useEffect(() => {
    async function searchParts() {
      if (!partSearchQuery.trim()) {
        setPartSuggestions([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/parts/search?q=${encodeURIComponent(partSearchQuery)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setPartSuggestions(data.slice(0, 10));
        }
      } catch (error) {
        console.error("Error searching parts:", error);
      } finally {
        setIsSearching(false);
      }
    }
    
    const timer = setTimeout(searchParts, 300);
    return () => clearTimeout(timer);
  }, [partSearchQuery]);

  const filteredSuppliers = useMemo(() => {
    const q = supplierQuery.toLowerCase().trim();
    if (!q) return [];
    return allSuppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [supplierQuery, allSuppliers]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/purchases/invoices" className="text-sm underline">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold">Edit Purchase Invoice - {invoice.invoiceNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="rounded-md border px-3 py-2 hover:bg-neutral-50"
          >
            Preview
          </button>
          <button
            disabled={saving || lines.length === 0 || !supplier}
            onClick={() => save(false)}
            className="rounded-md px-3 py-2 bg-neutral-700 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            disabled={saving || lines.length === 0 || !supplier}
            onClick={() => save(true)}
            className="rounded-md px-3 py-2 bg-black text-white disabled:opacity-60"
          >
            {saving ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="flex flex-col">
          <label className="text-xs text-neutral-500">Invoice Number</label>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
        <div className="flex flex-col relative">
          <label className="text-xs text-neutral-500">Supplier</label>
          {supplier ? (
            <div className="flex items-center gap-2">
              <div className="rounded-lg border px-3 py-2 grow bg-neutral-50">
                {supplier.name}
              </div>
              <button
                onClick={() => {
                  setSupplier(null);
                  setSupplierQuery("");
                }}
                className="rounded-md border px-2 py-2"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={supplierQuery}
                onChange={(e) => setSupplierQuery(e.target.value)}
                placeholder="Search supplier"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {filteredSuppliers.length > 0 && (
                <div className="absolute right-0 z-50 mt-2 w-80 max-h-72 overflow-auto rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-2xl">
                  {filteredSuppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="block w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-150 border-b border-gray-100 dark:border-slate-700 last:border-b-0 font-medium text-gray-900 dark:text-white"
                      onClick={() => {
                        setSupplier(s);
                        setSupplierQuery("");
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Items</h2>
          {!saving && !showPreview && (
            <div className="flex items-center gap-2 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-green-600 dark:text-green-400 font-medium">Scanner ready - scan barcode</span>
            </div>
          )}
        </div>
        <div className="mt-3 relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={partSearchQuery}
                onChange={(e) => setPartSearchQuery(e.target.value)}
                placeholder="Scan barcode or type part number/name to search..."
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {partSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-auto rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-2xl">
                  {partSuggestions.map((part) => (
                    <button
                      key={part.id}
                      type="button"
                      className="block w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-150 border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                      onClick={() => {
                        handleScan(part.partNumber);
                        setPartSearchQuery("");
                        setPartSuggestions([]);
                      }}
                    >
                      <div className="font-semibold text-blue-600 dark:text-blue-400 mb-1">{part.partNumber}</div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {part.itemName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ₹{part.rtl ?? part.mrp} • {part.unit}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (partSearchQuery.trim()) {
                  handleScan(partSearchQuery.trim());
                  setPartSearchQuery("");
                  setPartSuggestions([]);
                }
              }}
              className="px-4 py-2 bg-neutral-800 text-white rounded-lg hover:bg-neutral-900"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[960px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left">Code</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">UOM</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2 text-right">Price</th>
                <th className="px-3 py-2 text-right">Discount</th>
                <th className="px-3 py-2 text-right">Tax %</th>
                <th className="px-3 py-2 text-right">Line Total</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const net = l.price - l.discount;
                const lineTotal = l.qty * net + (l.qty * net * l.taxRate) / 100;
                return (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{l.code}</td>
                    <td className="px-3 py-2">{l.name}</td>
                    <td className="px-3 py-2">{l.uom ?? "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={1}
                        className="w-20 rounded border px-2 py-1 text-right"
                        value={l.qty}
                        onChange={(e) =>
                          updateLine(i, { qty: Math.max(1, Number(e.target.value || 1)) })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-24 rounded border px-2 py-1 text-right"
                        value={l.price}
                        onChange={(e) => updateLine(i, { price: Number(e.target.value || 0) })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-24 rounded border px-2 py-1 text-right"
                        value={l.discount}
                        onChange={(e) =>
                          updateLine(i, { discount: Math.max(0, Number(e.target.value || 0)) })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-20 rounded border px-2 py-1 text-right"
                        value={l.taxRate}
                        onChange={(e) =>
                          updateLine(i, { taxRate: Math.max(0, Number(e.target.value || 0)) })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {lineTotal.toLocaleString(undefined, {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => removeLine(i)}
                        className="rounded-md border px-2 py-1 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="text-xs text-neutral-500">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            placeholder="Any remarks for this purchase..."
          />
        </div>
        <div className="rounded-xl border p-4 h-fit">
          <div className="flex items-center justify-between py-1">
            <span>Subtotal</span>
            <span>
              {totals.sub.toLocaleString(undefined, {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span>Tax</span>
            <span>
              {totals.tax.toLocaleString(undefined, {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="mt-2 border-t pt-3 flex items-center justify-between font-semibold">
            <span>Grand Total</span>
            <span>
              {totals.grand.toLocaleString(undefined, {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Preview — {number}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
            <div className="grid gap-3 text-sm bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400 font-medium min-w-24">Date:</span>
                <span className="text-gray-900 dark:text-white font-semibold">{new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-400 font-medium min-w-24">Supplier:</span>
                <span className="text-gray-900 dark:text-white font-semibold">{supplier ? supplier.name : "—"}</span>
              </div>
            </div>
            <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-gray-100 dark:bg-slate-900">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Name</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Discount</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Tax %</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800">
                  {lines.map((l, i) => {
                    const net = l.price - l.discount;
                    const total = l.qty * net + (l.qty * net * l.taxRate) / 100;
                    return (
                      <tr key={i} className="border-t border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-200">{l.code}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-200">{l.name}</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-200 font-medium">{l.qty}</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-200">₹{l.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-200">₹{l.discount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-200">{l.taxRate}%</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-semibold">
                          {total.toLocaleString(undefined, {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700 min-w-80">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{totals.sub.toLocaleString(undefined, { style: "currency", currency: "INR" })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{totals.tax.toLocaleString(undefined, { style: "currency", currency: "INR" })}</span>
                  </div>
                  <div className="border-t border-gray-300 dark:border-slate-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-base font-bold text-gray-900 dark:text-white">Grand Total:</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{totals.grand.toLocaleString(undefined, { style: "currency", currency: "INR" })}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-5 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Edit
              </button>
              <button
                disabled={saving}
                onClick={() => {
                  setShowPreview(false);
                  void save(false);
                }}
                className="rounded-lg px-5 py-2.5 bg-gray-700 dark:bg-slate-600 text-white hover:bg-gray-800 dark:hover:bg-slate-500 disabled:opacity-60 transition-colors font-medium"
              >
                Save Draft
              </button>
              <button
                disabled={saving}
                onClick={() => {
                  setShowPreview(false);
                  void save(true);
                }}
                className="rounded-lg px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-60 transition-colors font-medium shadow-lg"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
