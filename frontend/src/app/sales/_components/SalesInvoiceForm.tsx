"use client";

import { API_BASE_URL } from '@/lib/constants';

// components/Sales/SalesInvoiceForm.tsx

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



async function fetchProductByCode(code: string) {
  // Extract code from URL if it's a URL (e.g., https://lamilink.in/q?q=CODE)
  let searchCode = code;
  try {
    const url = new URL(code);
    const qParam = url.searchParams.get('q');
    if (qParam) {
      searchCode = qParam;
    }
  } catch {
    // Not a URL, use the code as-is
  }

  // Search by barcode first, then by part number
  try {
    // Try barcode search
    let res = await fetch(`${API_BASE_URL}/api/parts/search?barcode=${encodeURIComponent(searchCode)}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
    
    // Try part number search
    res = await fetch(`${API_BASE_URL}/api/parts/search?q=${encodeURIComponent(searchCode)}`, { cache: "no-store" });
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

  const [number, setNumber] = useState<string>("");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerQuery, setCustomerQuery] = useState("");
  
  // Discount on grand total
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Fetch unique invoice number when customer changes
  useEffect(() => {
    const fetchInvoiceNumber = async () => {
      if (customer?.id) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/api/invoices/next-number?type=SALE&customerId=${customer.id}`
          );
          if (res.ok) {
            const data = await res.json();
            setNumber(data.invoiceNumber);
          }
        } catch (error) {
          console.error('Failed to fetch invoice number:', error);
          // Fallback to basic format
          const now = new Date();
          const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const financialYearStart = currentMonth >= 3 ? currentYear : currentYear - 1;
          const financialYearEnd = currentMonth >= 3 ? currentYear + 1 : currentYear;
          const year = financialYearStart.toString().slice(-2);
          const nextYear = financialYearEnd.toString().slice(-2);
          setNumber(`JCB/01/${month}/${year}-${nextYear}`);
        }
      } else {
        // Generate default invoice number if no customer selected
        const now = new Date();
        const month = now.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const financialYearStart = currentMonth >= 3 ? currentYear : currentYear - 1;
        const financialYearEnd = currentMonth >= 3 ? currentYear + 1 : currentYear;
        const year = financialYearStart.toString().slice(-2);
        const nextYear = financialYearEnd.toString().slice(-2);
        setNumber(`JCB/01/${month}/${year}-${nextYear}`);
      }
    };

    fetchInvoiceNumber();
  }, [customer]);

  const [lines, setLines] = useState<Line[]>([]);
  const [notes, setNotes] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);
  const toast = useToast();
  const { success, error: toastError } = toast;
  
  // For part search suggestions
  const [partSearchQuery, setPartSearchQuery] = useState("");
  const [partSuggestions, setPartSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Track available stock for each part
  const [partStock, setPartStock] = useState<Record<number, number>>({});

  // For manual item entry
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    partNumber: "",
    itemName: "",
    description: "",
    hsnCode: "",
    gstPercent: "18",
    unit: "Nos",
    mrp: "",
    rtl: "",
    barcode: "",
    qty: "1",
  });
  const [savingManualItem, setSavingManualItem] = useState(false);

  // Handle keyboard shortcuts for manual entry modal
  useEffect(() => {
    if (!showManualEntry) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close modal
      if (e.key === "Escape" && !savingManualItem) {
        setShowManualEntry(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showManualEntry, savingManualItem]);

  const totals = useMemo(() => {
    // Calculate subtotal (sum of line items before any discount or tax)
    const sub = lines.reduce((s, l) => s + l.qty * (l.price - l.discount), 0);
    
    // Calculate discount on subtotal (before tax)
    let discountAmount = 0;
    if (discountValue > 0) {
      if (discountType === "percentage") {
        discountAmount = (sub * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
    }
    
    // Calculate taxable value (subtotal minus discount)
    const taxableValue = sub - discountAmount;
    
    // Calculate tax on the taxable value (after discount)
    const tax = lines.reduce(
      (s, l) => {
        const lineTotal = l.qty * (l.price - l.discount);
        // Proportionally apply tax based on taxable value
        const proportion = sub > 0 ? lineTotal / sub : 0;
        const lineTaxableValue = taxableValue * proportion;
        return s + (lineTaxableValue * l.taxRate) / 100;
      },
      0
    );
    
    // Grand total = taxable value + tax
    const grand = taxableValue + tax;
    
    return { sub, tax, discount: discountAmount, grand };
  }, [lines, discountType, discountValue]);

  const handleScan = async (code: string) => {
    try {
      const p = await fetchProductByCode(code);
      
      // Check current stock
      const stockRes = await fetch(`${API_BASE_URL}/api/stock/${p.id}`, { cache: "no-store" });
      if (!stockRes.ok) {
        toastError(`✗ Unable to check stock for ${p.itemName}`);
        return;
      }
      
      const stockData = await stockRes.json();
      const availableStock = stockData.stock;
      
      // Store stock info
      setPartStock(prev => ({ ...prev, [p.id]: availableStock }));
      
      // Check if item already exists in the invoice
      const exists = lines.findIndex((l) => l.code === code);
      
      if (exists >= 0) {
        // Item already exists - check if we can increment quantity
        const existingItem = lines[exists];
        const currentQtyInInvoice = lines.reduce((sum, l) => l.partId === p.id ? sum + l.qty : sum, 0);
        
        if (currentQtyInInvoice >= availableStock) {
          toastError(`✗ Insufficient stock for ${existingItem.name}. Available: ${availableStock}, Already in invoice: ${currentQtyInInvoice}`);
          return;
        }
        
        setLines((prev) =>
          prev.map((l, i) => (i === exists ? { ...l, qty: l.qty + 1 } : l))
        );
        
        // Highlight the updated row
        setHighlightedRow(exists);
        setTimeout(() => setHighlightedRow(null), 1500);
        
        // Show success notification with stock info
        success(`✓ Quantity increased: ${existingItem.name} (Qty: ${existingItem.qty + 1}, Available: ${availableStock})`);
        return;
      }
      
      // New item - check if stock is available
      if (availableStock <= 0) {
        toastError(`✗ Out of stock: ${p.itemName}. Available: ${availableStock}`);
        return;
      }
      
      // Add new item
      setLines((prev) => [
        ...prev,
        {
          code: p.partNumber,
          partId: p.id,
          name: p.itemName,
          uom: p.unit,
          price: Number(p.rtl ?? p.mrp ?? 0), // Use RTL (retail selling price) for sales
          qty: 1,
          taxRate: Number(p.gstPercent ?? 0),
          discount: 0,
        },
      ]);
      
      // Highlight the new row
      setHighlightedRow(lines.length);
      setTimeout(() => setHighlightedRow(null), 1500);
      
      // Show success notification with stock info
      success(`✓ Item added: ${p.itemName} (Available: ${availableStock})`);
    } catch (error) {
      toastError(`✗ Part not found: ${code}`);
    }
  };

  const updateLine = (idx: number, patch: Partial<Line>) => {
    // If updating quantity, check stock availability
    if (patch.qty !== undefined) {
      const line = lines[idx];
      const availableStock = partStock[line.partId];
      
      if (availableStock !== undefined && patch.qty > availableStock) {
        toastError(`✗ Insufficient stock for ${line.name}. Available: ${availableStock}`);
        return;
      }
    }
    
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleManualItemSubmit = async () => {
    // Trim all string inputs
    const trimmedPartNumber = manualEntry.partNumber.trim();
    const trimmedItemName = manualEntry.itemName.trim();
    const trimmedHsnCode = manualEntry.hsnCode.trim().replace(/\s+/g, ''); // Remove all spaces
    const trimmedBarcode = manualEntry.barcode.trim();

    // Validate required fields
    if (!trimmedPartNumber || !trimmedItemName || !trimmedHsnCode) {
      toastError("Part Number, Item Name, and HSN Code are required");
      return;
    }

    // Validate part number format (Number/Alphanumeric or purely numeric)
    const partNumberPattern = /^[0-9]+(\/[A-Z0-9]+)?$/i;
    if (!partNumberPattern.test(trimmedPartNumber)) {
      toastError("Invalid part number format. Use: Number/Alphanumeric (e.g., 550/48325C or 027800028)");
      return;
    }

    // Validate HSN code format (4-8 digits, spaces allowed)
    const hsnPattern = /^[0-9]{4,8}$/;
    if (!hsnPattern.test(trimmedHsnCode)) {
      toastError("Invalid HSN Code. Must be 4-8 digits (e.g., 8431, 7318 11 10)");
      return;
    }

    // Validate GST percent (0-100)
    const gstPercent = parseFloat(manualEntry.gstPercent);
    if (isNaN(gstPercent) || gstPercent < 0 || gstPercent > 100) {
      toastError("GST % must be between 0 and 100");
      return;
    }

    // Validate quantity (positive integer >= 1)
    const qty = parseInt(manualEntry.qty);
    if (isNaN(qty) || qty < 1 || !Number.isInteger(parseFloat(manualEntry.qty))) {
      toastError("Quantity must be a positive whole number (minimum 1)");
      return;
    }

    // Validate MRP if provided
    if (manualEntry.mrp) {
      const mrp = parseFloat(manualEntry.mrp);
      if (isNaN(mrp) || mrp < 0) {
        toastError("MRP must be a positive number");
        return;
      }
    }

    // Validate RTL if provided
    if (manualEntry.rtl) {
      const rtl = parseFloat(manualEntry.rtl);
      if (isNaN(rtl) || rtl < 0) {
        toastError("RTL must be a positive number");
        return;
      }
    }

    // Check if at least one price is provided
    if (!manualEntry.mrp && !manualEntry.rtl) {
      toastError("Please provide at least MRP or RTL price");
      return;
    }

    // Check if item already exists in current invoice lines
    const upperPartNumber = trimmedPartNumber.toUpperCase();
    const existingItem = lines.find((l) => l.code.toUpperCase() === upperPartNumber);
    if (existingItem) {
      toastError(`Item "${upperPartNumber}" is already added to this invoice. Update quantity in the table instead.`);
      return;
    }

    setSavingManualItem(true);
    try {
      // Check if part already exists in database
      const checkRes = await fetch(
        `${API_BASE_URL}/api/parts/search?q=${encodeURIComponent(upperPartNumber)}`,
        { cache: "no-store" }
      );

      let partExistsInDb = false;
      if (checkRes.ok) {
        const existingParts = await checkRes.json();
        partExistsInDb = existingParts.some((p: any) => p.partNumber.toUpperCase() === upperPartNumber);
      }

      // Create or update the part in the database
      const res = await fetch(`${API_BASE_URL}/api/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partNumber: upperPartNumber,
          itemName: trimmedItemName,
          description: manualEntry.description.trim() || null,
          hsnCode: trimmedHsnCode,
          gstPercent: gstPercent,
          unit: manualEntry.unit,
          mrp: manualEntry.mrp ? parseFloat(manualEntry.mrp) : null,
          rtl: manualEntry.rtl ? parseFloat(manualEntry.rtl) : null,
          barcode: trimmedBarcode || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create part");
      }

      const part = await res.json();

      // Check stock for the newly created part
      const stockRes = await fetch(`${API_BASE_URL}/api/stock/${part.id}`, { cache: "no-store" });
      let availableStock = 0;
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        availableStock = stockData.stock;
      }

      // Store stock info
      setPartStock(prev => ({ ...prev, [part.id]: availableStock }));

      // Warn if trying to sell more than available stock
      if (qty > availableStock) {
        toastError(`Warning: Item created but insufficient stock. Available: ${availableStock}, Requested: ${qty}`);
        // Don't add to invoice if insufficient stock
        setManualEntry({
          partNumber: "",
          itemName: "",
          description: "",
          hsnCode: "",
          gstPercent: "18",
          unit: "Nos",
          mrp: "",
          rtl: "",
          barcode: "",
          qty: "1",
        });
        setShowManualEntry(false);
        return;
      }

      // Calculate the price to use (prefer RTL for sales, fallback to MRP)
      const itemPrice = Number(part.rtl ?? part.mrp ?? 0);

      // Add the part to the invoice lines
      setLines((prev) => [
        ...prev,
        {
          code: part.partNumber,
          partId: part.id,
          name: part.itemName,
          uom: part.unit,
          price: itemPrice,
          qty: qty,
          taxRate: Number(part.gstPercent ?? 0),
          discount: 0,
        },
      ]);

      // Highlight the new row
      setHighlightedRow(lines.length);
      setTimeout(() => setHighlightedRow(null), 1500);

      // Show appropriate success message
      const action = partExistsInDb ? "updated and added" : "created and added";
      success(`✓ Item ${action}: ${part.itemName} (Qty: ${qty}, Available Stock: ${availableStock})`);

      // Reset form and close modal
      setManualEntry({
        partNumber: "",
        itemName: "",
        description: "",
        hsnCode: "",
        gstPercent: "18",
        unit: "Nos",
        mrp: "",
        rtl: "",
        barcode: "",
        qty: "1",
      });
      setShowManualEntry(false);
    } catch (error: any) {
      console.error("Error creating manual item:", error);
      toastError(error.message || "Failed to create item. Please try again.");
    } finally {
      setSavingManualItem(false);
    }
  };

  const save = async (submit: boolean) => {
    if (!customer || lines.length === 0) {
      toastError("Please select a customer and add at least one item");
      return;
    }
    
    // Validate stock for all items
    const stockIssues = lines.filter(l => {
      const availableStock = partStock[l.partId];
      return availableStock !== undefined && l.qty > availableStock;
    });
    
    if (stockIssues.length > 0) {
      const itemNames = stockIssues.map(l => l.name).join(", ");
      toastError(`✗ Insufficient stock for: ${itemNames}. Please adjust quantities.`);
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
        discountPercent: discountType === "percentage" ? discountValue : 0,
        discountAmount: discountType === "amount" ? discountValue : 0,
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

      const invoice = await res.json();

      if (submit) {
        success("Invoice created successfully!");
      } else {
        success("Invoice saved as draft!");
      }
      
      // Navigate after a brief delay to show the success message
      setTimeout(() => {
        router.push("/sales/invoices");
      }, 800);
    } catch (error: any) {
      toastError("Error saving invoice: " + error.message);
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
    <div className="min-h-screen bg-background p-6">
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
          <Link href="/sales/invoices" className="text-sm underline text-primary hover:text-primary/80">
            ← Back
          </Link>
          <h1 className="text-xl font-semibold text-foreground">New Sales Invoice</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="rounded-md border-2 border-gray-300 bg-white text-gray-700 px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer font-medium shadow-sm"
          >
            Preview
          </button>
          <button
            disabled={saving || lines.length === 0 || !customer}
            onClick={() => save(false)}
            className="rounded-md border-2 border-blue-500 bg-white text-blue-600 px-4 py-2 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors font-medium shadow-sm"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            disabled={saving || lines.length === 0 || !customer}
            onClick={() => save(true)}
            className="rounded-md border-2 border-blue-600 bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors font-medium shadow-sm"
          >
            {saving ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-foreground mb-1">Invoice Number</label>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-foreground mb-1">Date</label>
          <input
            type="text"
            value={new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            disabled
            className="rounded-lg border border-border bg-muted text-muted-foreground px-3 py-2 cursor-not-allowed"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-medium text-foreground mb-1">Customer</label>
          {customer ? (
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-border bg-muted text-foreground px-3 py-2 grow">
                {customer.name}
              </div>
              <button
                onClick={() => {
                  setCustomer(null);
                  setCustomerQuery("");
                }}
                className="rounded-md border border-border bg-background text-foreground px-2 py-2 hover:bg-muted transition-colors"
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
                className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
              />
              {filteredCustomers.length > 0 && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-2xl">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="block w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors cursor-pointer"
                      onClick={() => {
                        setCustomer(c);
                        setCustomerQuery("");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {c.indexId && <span className="font-mono text-xs text-primary">{c.indexId}</span>}
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
      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-foreground">Add Items</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualEntry(true)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium cursor-pointer"
            >
              + Add Manually
            </button>
            <BarcodeScanner
              onScan={handleScan}
              enabled={true}
              showIndicator={true}
            />
          </div>
        </div>
        <div className="mt-3 mb-8 relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={partSearchQuery}
                onChange={(e) => setPartSearchQuery(e.target.value)}
                placeholder="Scan barcode or type part number/name to search..."
                className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
              />
              {isSearching && (
                <div className="absolute right-3 top-3 text-sm text-muted-foreground">
                  Searching...
                </div>
              )}
              {partSuggestions.length > 0 && (
                <div className="absolute z-50 mt-2 w-full max-h-72 overflow-auto rounded-lg border-2 border-gray-300 bg-white shadow-2xl">
                  <div className="bg-white px-3 py-2 text-sm font-bold text-gray-900 border-b-2 border-gray-300">
                    Select a part to add
                  </div>
                  {partSuggestions.map((part) => (
                    <button
                      key={part.id}
                      type="button"
                      className="block w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-b-0 border-gray-200 transition-colors bg-white cursor-pointer"
                      onClick={() => {
                        handleScan(part.partNumber);
                        setPartSearchQuery("");
                        setPartSuggestions([]);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-blue-600 text-base">{part.partNumber}</div>
                          <div className="text-sm text-gray-900 mt-0.5 line-clamp-2 font-medium">
                            {part.itemName}
                          </div>
                          {part.barcode && (
                            <div className="text-xs text-gray-600 mt-1">
                              Barcode: {part.barcode}
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-gray-900">₹{part.mrp ?? part.rtl}</div>
                          <div className="text-xs text-gray-600">{part.unit}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {!isSearching && partSearchQuery.trim() && partSuggestions.length === 0 && (
                <div className="absolute z-50 mt-2 w-full rounded-lg border-2 border-destructive/50 bg-white dark:bg-gray-800 shadow-xl px-4 py-3">
                  <div className="text-sm text-destructive font-medium">
                    ✗ No parts found matching "{partSearchQuery}"
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Try searching with part number (e.g., JCB-OF-003) or item name
                  </div>
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
              className="px-6 py-2.5 min-h-[44px] bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors font-medium touch-manipulation"
            >
              Add
            </button>
          </div>
        </div>

        {/* Alternative: Original Scanner Input (hidden but functional) */}
        <div className="hidden">
          <ScannerInput onScan={handleScan} />
        </div>

        {/* Items Table */}
        <div className="mt-8 overflow-x-auto">
          <table className="min-w-[1060px] w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left text-foreground font-medium">Code</th>
                <th className="px-3 py-2 text-left text-foreground font-medium">Name</th>
                <th className="px-3 py-2 text-left text-foreground font-medium">UOM</th>
                <th className="px-3 py-2 text-right text-foreground font-medium">Available</th>
                <th className="px-3 py-2 text-right text-foreground font-medium">Qty</th>
                <th className="px-3 py-2 text-right text-foreground font-medium">Price</th>
                <th className="px-3 py-2 text-right text-foreground font-medium">Discount</th>
                <th className="px-3 py-2 text-right text-foreground font-medium">Tax %</th>
                <th className="px-3 py-2 text-right text-foreground font-medium">Line Total</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const net = l.price - l.discount;
                const lineTotal = l.qty * net + (l.qty * net * l.taxRate) / 100;
                const isHighlighted = highlightedRow === i;
                const availableStock = partStock[l.partId];
                const stockWarning = availableStock !== undefined && l.qty > availableStock;
                return (
                  <tr 
                    key={l.code} 
                    className={`border-t border-border transition-all duration-500 ${
                      isHighlighted ? 'bg-green-100 animate-pulse dark:bg-green-900/30' : 'hover:bg-muted/50'
                    }`}
                  >
                    <td className="px-3 py-2 text-foreground">{l.code}</td>
                    <td className="px-3 py-2 text-foreground">{l.name}</td>
                    <td className="px-3 py-2 text-foreground">{l.uom ?? "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-medium ${
                        availableStock === undefined ? 'text-muted-foreground' :
                        availableStock <= 0 ? 'text-red-600' :
                        availableStock < 5 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {availableStock ?? '...'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <input
                          type="number"
                          min={1}
                          max={availableStock}
                          className={`w-20 rounded border ${
                            stockWarning ? 'border-red-500 bg-red-50' : 'border-border bg-background'
                          } text-foreground px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-primary`}
                          value={l.qty}
                          onChange={(e) =>
                            updateLine(i, { qty: Math.max(1, Number(e.target.value || 1)) })
                          }
                        />
                        {stockWarning && (
                          <span className="text-xs text-red-600 whitespace-nowrap">Exceeds stock!</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-24 rounded border border-border bg-background text-foreground px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                        value={l.price}
                        onChange={(e) => updateLine(i, { price: Number(e.target.value || 0) })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-24 rounded border border-border bg-background text-foreground px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                        value={l.discount}
                        onChange={(e) =>
                          updateLine(i, { discount: Math.max(0, Number(e.target.value || 0)) })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        className="w-20 rounded border border-border bg-background text-foreground px-2 py-1 text-right focus:outline-none focus:ring-1 focus:ring-primary"
                        value={l.taxRate}
                        onChange={(e) =>
                          updateLine(i, { taxRate: Math.max(0, Number(e.target.value || 0)) })
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-foreground">
                      {lineTotal.toLocaleString(undefined, {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => removeLine(i)}
                        className="rounded-md border border-border bg-background text-destructive px-3 py-2 min-h-[44px] hover:bg-destructive/10 active:bg-destructive/20 transition-colors touch-manipulation"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
              {lines.length === 0 && (
                <tr className="border-t border-border">
                  <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
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
          <label className="text-sm font-medium text-foreground mb-1 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
            placeholder="Any remarks for this sale..."
          />
        </div>
        <div className="rounded-xl border border-border bg-card p-4 h-fit">
          <div className="flex items-center justify-between py-1 text-foreground">
            <span>Subtotal</span>
            <span>
              {totals.sub.toLocaleString(undefined, {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 text-foreground">
            <span>Tax</span>
            <span>
              {totals.tax.toLocaleString(undefined, {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          
          {/* Discount on Grand Total */}
          <div className="mt-2 border-t border-border pt-2 pb-2">
            <label className="text-sm font-medium text-foreground mb-1 block">
              Discount
            </label>
            <div className="flex gap-2">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "percentage" | "amount")}
                className="px-2 py-1 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="percentage">%</option>
                <option value="amount">₹</option>
              </select>
              <input
                type="number"
                min="0"
                step={discountType === "percentage" ? "0.01" : "1"}
                max={discountType === "percentage" ? "100" : undefined}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="flex-1 px-2 py-1 text-sm rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="0"
              />
            </div>
            {totals.discount > 0 && (
              <div className="flex items-center justify-between py-1 mt-1 text-sm text-green-600 dark:text-green-400">
                <span>Discount Applied</span>
                <span>
                  -{totals.discount.toLocaleString(undefined, {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-2 border-t border-border pt-3 flex items-center justify-between font-semibold text-foreground">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-card border border-border shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-muted/30">
              <h3 className="text-base sm:text-lg font-semibold text-foreground truncate mr-2">Preview — {number}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-md border border-border bg-background text-foreground px-3 py-2 min-h-[44px] hover:bg-muted active:bg-muted/80 transition-colors text-sm font-medium touch-manipulation flex-shrink-0"
              >
                Close
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
              {/* Invoice Details */}
              <div className="grid gap-3 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">Date:</span>
                  <span className="text-foreground font-semibold">
                    {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
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
                    {totals.discount > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-green-600 dark:text-green-400 font-medium">Discount ({discountType === "percentage" ? `${discountValue}%` : "₹"})</span>
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          -{totals.discount.toLocaleString(undefined, {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
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
                onClick={() => {
                  setShowPreview(false);
                  void save(true);
                }}
                className="rounded-md px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm cursor-pointer"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-muted/30">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Add Item Manually</h3>
              <button
                onClick={() => setShowManualEntry(false)}
                className="rounded-md border border-border bg-background text-foreground px-3 py-2 min-h-[44px] hover:bg-muted active:bg-muted/80 transition-colors text-sm font-medium touch-manipulation"
              >
                Cancel
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Part Number */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-1">
                    Part Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={manualEntry.partNumber}
                    onChange={(e) => setManualEntry({ ...manualEntry, partNumber: e.target.value })}
                    placeholder="e.g., 550/42835C"
                    className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                    autoFocus
                  />
                  <span className="text-xs text-muted-foreground mt-1">Format: Number/Alphanumeric</span>
                </div>

                {/* Item Name */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-1">
                    Item Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={manualEntry.itemName}
                    onChange={(e) => setManualEntry({ ...manualEntry, itemName: e.target.value })}
                    placeholder="e.g., Hydraulic Pump"
                    className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    value={manualEntry.description}
                    onChange={(e) => setManualEntry({ ...manualEntry, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                    className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                </div>

                {/* HSN Code */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-1">
                    HSN Code <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={manualEntry.hsnCode}
                    onChange={(e) => setManualEntry({ ...manualEntry, hsnCode: e.target.value })}
                    placeholder="e.g., 8431"
                    className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                  <span className="text-xs text-muted-foreground mt-1">4-8 digit code</span>
                </div>

                {/* GST Percent */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-1">GST %</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={manualEntry.gstPercent}
                    onChange={(e) => setManualEntry({ ...manualEntry, gstPercent: e.target.value })}
                    placeholder="18"
                    className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                  <span className="text-xs text-muted-foreground mt-1">Value between 0-100</span>
                </div>

                {/* Unit */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-1">Unit</label>
                  <select
                    value={manualEntry.unit}
                    onChange={(e) => setManualEntry({ ...manualEntry, unit: e.target.value })}
                    className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Nos">Nos</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Kg">Kg</option>
                    <option value="Mtr">Mtr</option>
                    <option value="Set">Set</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={manualEntry.qty}
                    onChange={(e) => setManualEntry({ ...manualEntry, qty: e.target.value })}
                    placeholder="1"
                    className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                  <span className="text-xs text-muted-foreground mt-1">Minimum 1</span>
                </div>

                {/* MRP */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-1">
                    MRP (₹) <span className="text-orange-500 text-xs">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualEntry.mrp}
                    onChange={(e) => setManualEntry({ ...manualEntry, mrp: e.target.value })}
                    placeholder="0.00"
                    className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                  <span className="text-xs text-orange-500 mt-1">MRP or RTL required</span>
                </div>

                {/* RTL */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium text-foreground mb-1">
                    RTL (₹) <span className="text-orange-500 text-xs">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={manualEntry.rtl}
                    onChange={(e) => setManualEntry({ ...manualEntry, rtl: e.target.value })}
                    placeholder="0.00"
                    className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                  <span className="text-xs text-orange-500 mt-1">MRP or RTL required</span>
                </div>

                {/* Barcode */}
                <div className="flex flex-col md:col-span-2">
                  <label className="text-sm font-medium text-foreground mb-1">Barcode</label>
                  <input
                    value={manualEntry.barcode}
                    onChange={(e) => setManualEntry({ ...manualEntry, barcode: e.target.value })}
                    placeholder="Optional barcode"
                    className="rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
              <button
                onClick={() => setShowManualEntry(false)}
                disabled={savingManualItem}
                className="rounded-md border border-border bg-background text-foreground px-4 py-2 hover:bg-muted transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualItemSubmit}
                disabled={savingManualItem || !manualEntry.partNumber || !manualEntry.itemName || !manualEntry.hsnCode}
                className="rounded-md px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingManualItem ? "Creating..." : "Create & Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
