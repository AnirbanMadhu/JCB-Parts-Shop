"use client";

import { API_BASE_URL } from '@/lib/constants';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useSettings } from "@/hooks/useSettings";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import ToastContainer from "@/components/ui/ToastContainer";

type Line = {
  code: string;
  partId: number;
  name: string;
  uom?: string;
  price: number;
  qty: number;
  taxRate: number;
  discount: number;
  availableStock?: number;
};

type Customer = { id: number; name: string; indexId?: string };



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

export default function SalesInvoiceEditForm({ invoice }: { invoice: any }) {
  const router = useRouter();
  const { toasts, removeToast, success, error: showError } = useToast();
  const { settings } = useSettings();

  const [number, setNumber] = useState<string>(invoice.invoiceNumber);
  const [date, setDate] = useState<string>(() =>
    new Date(invoice.date).toISOString().slice(0, 10)
  );

  const [customer, setCustomer] = useState<Customer | null>(
    invoice.customer ? { id: invoice.customer.id, name: invoice.customer.name } : null
  );
  const [customerQuery, setCustomerQuery] = useState("");

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
      availableStock: 0,
    }))
  );

  const [notes, setNotes] = useState(invoice.note || "");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stockData, setStockData] = useState<{ [partId: number]: number }>({});
  
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
      const currentLine = lines[exists];
      const availableStock = stockData[currentLine.partId] || 0;
      const currentQtyInInvoice = currentLine.qty;
      
      if (currentQtyInInvoice >= availableStock) {
        showError(`Cannot add more. Only ${availableStock} units available in stock`);
        return;
      }
      
      setLines((prev) =>
        prev.map((l, i) => (i === exists ? { ...l, qty: l.qty + 1 } : l))
      );
      success(`Added 1 more "${lines[exists].name}" (Total: ${lines[exists].qty + 1})`);
      return;
    }

    try {
      const p = await fetchProductByCode(code);
      
      // Fetch stock for this part
      const stockRes = await fetch(`${API_BASE_URL}/api/stock/${p.id}`, { cache: "no-store" });
      const stockInfo = stockRes.ok ? await stockRes.json() : { stock: 0 };
      const availableStock = stockInfo.stock || 0;
      
      if (availableStock <= 0) {
        showError(`"${p.itemName}" is out of stock`);
        return;
      }
      
      setStockData(prev => ({ ...prev, [p.id]: availableStock }));
      setLines((prev) => [
        ...prev,
        {
          code: p.partNumber,
          partId: p.id,
          name: p.itemName,
          uom: p.unit,
          price: Number(p.mrp ?? p.rtl ?? 0),
          qty: 1,
          taxRate: Number(p.gstPercent ?? 0),
          discount: 0,
          availableStock: availableStock,
        },
      ]);
      success(`Added "${p.itemName}" to invoice (${availableStock} available)`);
    } catch (error: any) {
      showError(error.message || "Part not found. Please check the code and try again.");
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
    setLines((prev) => prev.map((l, i) => {
      if (i === idx) {
        const updatedLine = { ...l, ...patch };
        
        // Check stock constraint if quantity is being updated
        if (patch.qty !== undefined) {
          const availableStock = stockData[l.partId] || l.availableStock || 0;
          if (patch.qty > availableStock) {
            showError(`Cannot set quantity to ${patch.qty}. Only ${availableStock} units available in stock`);
            return l; // Don't update if exceeds stock
          }
        }
        
        return updatedLine;
      }
      return l;
    }));
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const save = async (submit: boolean) => {
    if (!customer || lines.length === 0) {
      showError("Please select a customer and add at least one item");
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
        sgstPercent,
        allowEditSubmitted: settings.sales.allowEditSubmitted
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

      success(`Invoice ${submit ? 'submitted' : 'saved'} successfully`);
      setTimeout(() => {
        router.push("/sales/invoices");
      }, 1000);
    } catch (error: any) {
      showError(error.message || "Failed to update invoice");
    } finally {
      setSaving(false);
    }
  };

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

  // Fetch stock data for all parts in the invoice
  useEffect(() => {
    async function loadStockData() {
      try {
        const stockPromises = lines.map(async (line) => {
          const res = await fetch(`${API_BASE_URL}/api/stock/${line.partId}`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            return { partId: line.partId, stock: data.stock || 0 };
          }
          return { partId: line.partId, stock: 0 };
        });
        
        const stockResults = await Promise.all(stockPromises);
        const stockMap: { [partId: number]: number } = {};
        stockResults.forEach(({ partId, stock }) => {
          stockMap[partId] = stock;
        });
        
        setStockData(stockMap);
        
        // Update lines with available stock
        setLines(prev => prev.map(line => ({
          ...line,
          availableStock: stockMap[line.partId] || 0
        })));
      } catch (error) {
        console.error("Error loading stock data:", error);
      }
    }
    
    if (lines.length > 0) {
      loadStockData();
    }
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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/sales/invoices" className="text-sm underline">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold">Edit Sales Invoice - {invoice.invoiceNumber}</h1>
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
                className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              {filteredCustomers.length > 0 && (
                <div className="absolute right-0 z-50 mt-2 w-80 max-h-72 overflow-auto rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-2xl">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="block w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors duration-150 border-b border-gray-100 dark:border-slate-700 last:border-b-0"
                      onClick={() => {
                        setCustomer(c);
                        setCustomerQuery("");
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {c.indexId && (
                          <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                            {c.indexId}
                          </span>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                      </div>
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
                        ₹{part.mrp ?? part.rtl} • {part.unit}
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
                <th className="px-3 py-2 text-right">Available</th>
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
                const availableStock = stockData[l.partId] || l.availableStock || 0;
                const remainingStock = availableStock - l.qty;
                
                return (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-2">{l.code}</td>
                    <td className="px-3 py-2">{l.name}</td>
                    <td className="px-3 py-2">{l.uom ?? "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-semibold ${
                          availableStock > 10 ? 'text-green-600' : 
                          availableStock > 0 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`}>
                          {availableStock}
                        </span>
                        {remainingStock >= 0 && (
                          <span className="text-xs text-gray-500">
                            →{remainingStock}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={1}
                        max={availableStock}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-card border border-border shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <h3 className="text-lg font-semibold text-foreground">Preview — {number}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-md border border-border bg-background text-foreground px-3 py-1.5 hover:bg-muted transition-colors text-sm font-medium cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Invoice Details */}
              <div className="grid gap-3 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Date:</span>
                  <span className="text-foreground font-semibold">
                    {new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Customer:</span>
                  <span className="text-foreground font-semibold">{customer ? customer.name : "—"}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-foreground font-semibold">Code</th>
                      <th className="px-3 py-2.5 text-left text-foreground font-semibold">Name</th>
                      <th className="px-3 py-2.5 text-right text-foreground font-semibold">Qty</th>
                      <th className="px-3 py-2.5 text-right text-foreground font-semibold">Price</th>
                      <th className="px-3 py-2.5 text-right text-foreground font-semibold">Discount</th>
                      <th className="px-3 py-2.5 text-right text-foreground font-semibold">Tax %</th>
                      <th className="px-3 py-2.5 text-right text-foreground font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card">
                    {lines.map((l, i) => {
                      const net = l.price - l.discount;
                      const total = l.qty * net + (l.qty * net * l.taxRate) / 100;
                      return (
                        <tr key={i} className="border-t border-border hover:bg-muted/50 transition-colors">
                          <td className="px-3 py-2.5 text-foreground font-mono">{l.code}</td>
                          <td className="px-3 py-2.5 text-foreground">{l.name}</td>
                          <td className="px-3 py-2.5 text-right text-foreground font-semibold">{l.qty}</td>
                          <td className="px-3 py-2.5 text-right text-foreground">₹{l.price.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right text-foreground">{l.discount > 0 ? `₹${l.discount.toFixed(2)}` : '—'}</td>
                          <td className="px-3 py-2.5 text-right text-foreground">{l.taxRate}%</td>
                          <td className="px-3 py-2.5 text-right text-foreground font-semibold">
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

              {/* Totals Summary */}
              <div className="mt-6 flex justify-end">
                <div className="min-w-80 rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Subtotal</span>
                      <span className="text-foreground font-semibold">
                        {totals.sub.toLocaleString(undefined, { style: "currency", currency: "INR" })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Tax</span>
                      <span className="text-foreground font-semibold">
                        {totals.tax.toLocaleString(undefined, { style: "currency", currency: "INR" })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className="text-foreground font-bold">Grand Total</span>
                      <span className="text-foreground font-bold text-lg">
                        {totals.grand.toLocaleString(undefined, { style: "currency", currency: "INR" })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-md border border-border bg-background text-foreground px-4 py-2 hover:bg-muted transition-colors text-sm font-medium cursor-pointer"
              >
                Edit
              </button>
              <button
                disabled={saving}
                onClick={() => {
                  setShowPreview(false);
                  void save(false);
                }}
                className="rounded-md px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 transition-colors text-sm font-medium cursor-pointer"
              >
                Save Draft
              </button>
              <button
                disabled={saving}
                onClick={() => {
                  setShowPreview(false);
                  void save(true);
                }}
                className="rounded-md px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm cursor-pointer"
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
