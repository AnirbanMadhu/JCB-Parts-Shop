// components/Purchases/PurchaseInvoiceForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ScannerInput from "./ScannerInput";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Line = {
  code: string;           // barcode or part number
  partId: number;
  name: string;
  uom?: string;
  price: number;
  qty: number;            // default 1
  taxRate: number;        // e.g., 18 => 18%
  discount: number;       // per-unit discount (₹)
};

type Supplier = { id: number; name: string };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function fetchProductByCode(code: string) {
  // Search by barcode first, then by part number
  try {
    console.log("Searching for part:", code);
    console.log("API URL:", API_BASE_URL);
    
    // Try barcode search
    let url = `${API_BASE_URL}/api/parts/search?barcode=${encodeURIComponent(code)}`;
    console.log("Trying barcode search:", url);
    let res = await fetch(url, { cache: "no-store" });
    
    if (res.ok) {
      const part = await res.json();
      console.log("Found by barcode:", part);
      return part;
    }
    
    // Try part number search
    url = `${API_BASE_URL}/api/parts/search?q=${encodeURIComponent(code)}`;
    console.log("Trying part number search:", url);
    res = await fetch(url, { cache: "no-store" });
    
    if (res.ok) {
      const parts = await res.json();
      console.log("Search results:", parts);
      if (parts.length > 0) {
        console.log("Found by part number:", parts[0]);
        return parts[0]; // Return first match
      }
    }
    
    console.log("Part not found in database");
    throw new Error(`No part found with code: ${code}`);
  } catch (error) {
    console.error("Error fetching part:", error);
    throw error;
  }
}

export default function PurchaseInvoiceForm() {
  const router = useRouter();

  const [number, setNumber] = useState<string>(() => {
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `PINV-${ts}-${Math.floor(Math.random() * 900 + 100)}`;
  });
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [supplierQuery, setSupplierQuery] = useState("");

  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // For part search suggestions
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
      console.log("Adding part to invoice:", p);
      setLines((prev) => [
        ...prev,
        {
          code: p.partNumber,
          partId: p.id,
          name: p.itemName,
          uom: p.unit,
          price: Number(p.rtl ?? p.mrp ?? 0),
          qty: 1, // default quantity
          taxRate: Number(p.gstPercent ?? 0),
          discount: 0,
        },
      ]);
    } catch (error: any) {
      console.error("Failed to add part:", error);
      alert(error.message || "Part not found. Please check the code and try again.");
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
      alert("Please select a supplier and add at least one item");
      return;
    }

    setSaving(true);
    try {
      // Calculate totals
      const subtotal = lines.reduce((s, l) => s + l.qty * (l.price - l.discount), 0);
      const taxableValue = subtotal; // After discount, if any
      
      // Assuming CGST + SGST split (9% each for 18% GST)
      const avgTaxRate = lines.reduce((sum, l) => sum + l.taxRate, 0) / lines.length;
      const cgstPercent = avgTaxRate / 2;
      const sgstPercent = avgTaxRate / 2;

      // Prepare invoice data
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

      const res = await fetch(`${API_BASE_URL}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save invoice");
      }

      if (submit) {
        router.push("/purchases/invoices");
      } else {
        alert("Invoice saved successfully!");
      }
    } catch (error: any) {
      alert("Error saving invoice: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Fetch suppliers from API
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

  // Search for parts as user types
  useEffect(() => {
    async function searchParts() {
      if (!partSearchQuery.trim()) {
        setPartSuggestions([]);
        setIsSearching(false);
        return;
      }
      
      setIsSearching(true);
      console.log("Searching for parts with query:", partSearchQuery);
      
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/parts/search?q=${encodeURIComponent(partSearchQuery)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          console.log("Found parts:", data);
          setPartSuggestions(data.slice(0, 10)); // Show max 10 suggestions
        }
      } catch (error) {
        console.error("Error searching parts:", error);
      } finally {
        setIsSearching(false);
      }
    }
    
    const timer = setTimeout(searchParts, 300); // Debounce search
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
          <h1 className="text-xl font-semibold">New Purchase Invoice</h1>
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

      {/* Meta */}
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

      {/* Scanner */}
      <div className="mt-8 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Add Items</h2>
          <span className="text-xs text-neutral-500">
            Search by part number, barcode, or name
          </span>
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
              {isSearching && (
                <div className="absolute right-3 top-3 text-sm text-neutral-500">
                  Searching...
                </div>
              )}
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
                        {part.barcode && <span className="ml-2">| Barcode: {part.barcode}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!isSearching && partSearchQuery.trim() && partSuggestions.length === 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg px-3 py-2 text-sm text-red-600">
                  No parts found matching "{partSearchQuery}". Try typing "JCB" to see available parts.
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
          <div className="mt-2 text-xs text-neutral-500">
            Or use barcode scanner - scan will automatically add the item
          </div>
        </div>

        {/* Alternative: Original Scanner Input (hidden but functional) */}
        <div className="hidden">
          <ScannerInput onScan={handleScan} />
        </div>

        {/* Items Table */}
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
                  <tr key={l.code} className="border-t">
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
              {lines.length === 0 && (
                <tr className="border-t">
                  <td colSpan={9} className="px-3 py-6 text-center text-neutral-500">
                    Scan a barcode / enter part number to add items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes & totals */}
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
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview — {number}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-md border px-3 py-1"
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
                  {lines.map((l) => {
                    const net = l.price - l.discount;
                    const total = l.qty * net + (l.qty * net * l.taxRate) / 100;
                    return (
                      <tr key={l.code} className="border-t">
                        <td className="px-3 py-2">{l.code}</td>
                        <td className="px-3 py-2">{l.name}</td>
                        <td className="px-3 py-2 text-right">{l.qty}</td>
                        <td className="px-3 py-2 text-right">{l.price}</td>
                        <td className="px-3 py-2 text-right">{l.discount}</td>
                        <td className="px-3 py-2 text-right">{l.taxRate}</td>
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

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-md border px-3 py-2"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setShowPreview(false);
                  void save(true);
                }}
                className="rounded-md px-3 py-2 bg-black text-white"
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
