// components/Sales/SalesInvoiceForm.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ScannerInput from "@/app/purchases/_components/ScannerInput";
import BarcodeScanner from "@/components/features/BarcodeScanner";
import Toast from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
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

type Customer = { id: number; name: string; indexId?: string };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

async function fetchProductByCode(code: string) {
  // Search by barcode first, then by part number
  try {
    // Try barcode search
    let res = await fetch(`${API_BASE_URL}/api/parts/search?barcode=${encodeURIComponent(code)}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
    
    // Try part number search
    res = await fetch(`${API_BASE_URL}/api/parts/search?q=${encodeURIComponent(code)}`, { cache: "no-store" });
    if (res.ok) {
      const parts = await res.json();
      if (parts.length > 0) {
        return parts[0]; // Return first match
      }
    }
    
    throw new Error("Part not found");
  } catch (error) {
    console.error("Error fetching part:", error);
    throw error;
  }
}

export default function SalesInvoiceForm() {
  const router = useRouter();

  const [number, setNumber] = useState<string>(() => {
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    return `SINV-${ts}-${Math.floor(Math.random() * 900 + 100)}`;
  });
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");

  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const toast = useToast();
  
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
      // Item already exists - increment quantity (auto-grouping)
      const existingItem = lines[exists];
      setLines((prev) =>
        prev.map((l, i) => (i === exists ? { ...l, qty: l.qty + 1 } : l))
      );
      
      // Highlight the updated row
      setHighlightedRow(exists);
      setTimeout(() => setHighlightedRow(null), 1500);
      
      // Show success notification
      toast.success(`✓ Quantity increased: ${existingItem.name} (Qty: ${existingItem.qty + 1})`);
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
          price: Number(p.mrp ?? p.rtl ?? 0), // Use MRP for sales
          qty: 1,
          taxRate: Number(p.gstPercent ?? 0),
          discount: 0,
        },
      ]);
      
      // Highlight the new row
      setHighlightedRow(lines.length);
      setTimeout(() => setHighlightedRow(null), 1500);
      
      // Show success notification
      toast.success(`✓ Item added: ${p.itemName}`);
    } catch (error) {
      toast.error(`✗ Part not found: ${code}`);
    }
  };

  const updateLine = (idx: number, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async (submit: boolean) => {
    if (!customer || lines.length === 0) {
      alert("Please select a customer and add at least one item");
      return;
    }

    setSaving(true);
    try {
      // Calculate totals
      const subtotal = lines.reduce((s, l) => s + l.qty * (l.price - l.discount), 0);
      const taxableValue = subtotal;
      
      // Assuming CGST + SGST split (9% each for 18% GST)
      const avgTaxRate = lines.reduce((sum, l) => sum + l.taxRate, 0) / lines.length;
      const cgstPercent = avgTaxRate / 2;
      const sgstPercent = avgTaxRate / 2;

      // Prepare invoice data
      const invoiceData = {
        invoiceNumber: number,
        date: date,
        type: "SALE" as const,
        status: submit ? "SUBMITTED" as const : "DRAFT" as const,
        customerId: customer.id,
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
        router.push("/sales/invoices");
      } else {
        alert("Invoice saved successfully!");
      }
    } catch (error: any) {
      alert("Error saving invoice: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Fetch customers from API
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/customers`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setAllCustomers(data);
        }
      } catch (error) {
        console.error("Error loading customers:", error);
      }
    }
    loadCustomers();
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
      
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/parts/search?q=${encodeURIComponent(partSearchQuery)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
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

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.toLowerCase().trim();
    if (!q) return [];
    return allCustomers.filter((c) => 
      c.name.toLowerCase().includes(q) ||
      (c.indexId && c.indexId.toLowerCase().includes(q))
    );
  }, [customerQuery, allCustomers]);

  return (
    <div className="p-6">
      {/* Toast notifications */}
      {toast.toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => toast.removeToast(t.id)}
        />
      ))}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/sales/invoices" className="text-sm underline">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold">New Sales Invoice</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="rounded-md border px-3 py-2 hover:bg-neutral-50"
          >
            Preview
          </button>
          <button
            disabled={saving || lines.length === 0 || !customer}
            onClick={() => save(false)}
            className="rounded-md px-3 py-2 bg-neutral-700 text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            disabled={saving || lines.length === 0 || !customer}
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
          <label className="text-xs text-neutral-500">Customer</label>
          {customer ? (
            <div className="flex items-center gap-2">
              <div className="rounded-lg border px-3 py-2 grow bg-neutral-50">
                {customer.name}
              </div>
              <button
                onClick={() => {
                  setCustomer(null);
                  setCustomerQuery("");
                }}
                className="rounded-md border px-2 py-2"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Search by customer name or ID (e.g., CUST-001)"
                className="w-full rounded-lg border px-3 py-2"
              />
              {filteredCustomers.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="block w-full text-left px-3 py-2 hover:bg-neutral-50"
                      onClick={() => {
                        setCustomer(c);
                        setCustomerQuery("");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {c.indexId && <span className="font-mono text-xs text-blue-600">{c.indexId}</span>}
                        <span>{c.name}</span>
                      </div>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium">Add Items</h2>
          <BarcodeScanner 
            onScan={handleScan}
            enabled={true}
            showIndicator={true}
          />
        </div>
        <div className="mt-3 relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={partSearchQuery}
                onChange={(e) => setPartSearchQuery(e.target.value)}
                placeholder="Scan barcode or manually type part number/name..."
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
                        {part.itemName} - ₹{part.mrp ?? part.rtl} ({part.unit})
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
          <div className="mt-2 text-xs text-neutral-500 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>Primary:</strong> Scan barcode with scanner - auto-detects and adds item instantly. <strong>Fallback:</strong> Manually type if barcode not available.</span>
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
                const isHighlighted = highlightedRow === i;
                return (
                  <tr 
                    key={l.code} 
                    className={`border-t transition-all duration-500 ${
                      isHighlighted ? 'bg-green-100 animate-pulse' : 'hover:bg-gray-50'
                    }`}
                  >
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
            placeholder="Any remarks for this sale..."
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
                <span className="text-neutral-500">Customer:</span>{" "}
                {customer ? customer.name : "—"}
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
