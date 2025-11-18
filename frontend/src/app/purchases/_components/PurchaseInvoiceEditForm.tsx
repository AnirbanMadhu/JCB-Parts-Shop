"use client";

import { useEffect, useMemo, useState } from "react";
import ScannerInput from "./ScannerInput";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function fetchProductByCode(code: string) {
  try {
    let url = `${API_BASE_URL}/api/parts/search?barcode=${encodeURIComponent(code)}`;
    let res = await fetch(url, { cache: "no-store" });
    
    if (res.ok) {
      return await res.json();
    }
    
    url = `${API_BASE_URL}/api/parts/search?q=${encodeURIComponent(code)}`;
    res = await fetch(url, { cache: "no-store" });
    
    if (res.ok) {
      const parts = await res.json();
      if (parts.length > 0) {
        return parts[0];
      }
    }
    
    throw new Error(`No part found with code: ${code}`);
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
    } catch (error: any) {
      toastError(error.message || "Part not found. Please check the code and try again.");
    }
  };

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
          <label className="text-xs text-neutral-500">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </div>
        <div className="flex flex-col">
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
                className="w-full rounded-lg border px-3 py-2"
              />
              {filteredSuppliers.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow">
                  {filteredSuppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="block w-full text-left px-3 py-2 hover:bg-neutral-50"
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
        </div>
        <div className="mt-3 relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={partSearchQuery}
                onChange={(e) => setPartSearchQuery(e.target.value)}
                placeholder="Type part number, barcode, or name..."
                className="w-full rounded-lg border px-3 py-2"
              />
              {partSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow-lg">
                  {partSuggestions.map((part) => (
                    <button
                      key={part.id}
                      type="button"
                      className="block w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                      onClick={() => {
                        handleScan(part.partNumber);
                        setPartSearchQuery("");
                        setPartSuggestions([]);
                      }}
                    >
                      <div className="font-medium text-blue-600">{part.partNumber}</div>
                      <div className="text-xs text-neutral-600">
                        {part.itemName} - ₹{part.rtl ?? part.mrp} ({part.unit})
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview — {number}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-md border px-3 py-1 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <div><span className="text-neutral-500">Date:</span> {date}</div>
              <div>
                <span className="text-neutral-500">Supplier:</span>{" "}
                {supplier ? supplier.name : "—"}
              </div>
            </div>
            <div className="mt-4 overflow-x-auto rounded-lg border">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">Discount</th>
                    <th className="px-3 py-2 text-right">Tax %</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => {
                    const net = l.price - l.discount;
                    const total = l.qty * net + (l.qty * net * l.taxRate) / 100;
                    return (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{l.code}</td>
                        <td className="px-3 py-2">{l.name}</td>
                        <td className="px-3 py-2 text-right">{l.qty}</td>
                        <td className="px-3 py-2 text-right">₹{l.price.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">₹{l.discount.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">{l.taxRate}%</td>
                        <td className="px-3 py-2 text-right">
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

            <div className="mt-4 flex justify-end gap-4">
              <div className="text-right">
                <div className="text-sm text-neutral-500">Subtotal: {totals.sub.toLocaleString(undefined, { style: "currency", currency: "INR" })}</div>
                <div className="text-sm text-neutral-500">Tax: {totals.tax.toLocaleString(undefined, { style: "currency", currency: "INR" })}</div>
                <div className="text-lg font-semibold mt-1">Grand Total: {totals.grand.toLocaleString(undefined, { style: "currency", currency: "INR" })}</div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-md border px-4 py-2 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                disabled={saving}
                onClick={() => {
                  setShowPreview(false);
                  void save(false);
                }}
                className="rounded-md px-4 py-2 bg-neutral-700 text-white hover:bg-neutral-800 disabled:opacity-60"
              >
                Save Draft
              </button>
              <button
                disabled={saving}
                onClick={() => {
                  setShowPreview(false);
                  void save(true);
                }}
                className="rounded-md px-4 py-2 bg-black text-white hover:bg-neutral-900 disabled:opacity-60"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
