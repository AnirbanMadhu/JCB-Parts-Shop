'use client';

import { useState } from 'react';
import { FileEdit, Search, Calendar, FileText, Truck, Package } from 'lucide-react';

interface Invoice {
  id: number;
  invoiceNumber: string;
  type: 'PURCHASE' | 'SALE';
  date: string;
  status: string;
  deliveryNote?: string;
  buyerOrderNo?: string;
  dispatchDocNo?: string;
  deliveryNoteDate?: string;
  dispatchedThrough?: string;
  termsOfDelivery?: string;
  customer?: { name: string };
  supplier?: { name: string };
}

export default function EditInvoiceDetails() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form fields
  const [deliveryNote, setDeliveryNote] = useState('');
  const [buyerOrderNo, setBuyerOrderNo] = useState('');
  const [dispatchDocNo, setDispatchDocNo] = useState('');
  const [deliveryNoteDate, setDeliveryNoteDate] = useState('');
  const [dispatchedThrough, setDispatchedThrough] = useState('');
  const [termsOfDelivery, setTermsOfDelivery] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setMessage({ type: 'error', text: 'Please enter an invoice number' });
      return;
    }

    setIsSearching(true);
    setMessage(null);
    setSearchResults([]);
    setSelectedInvoice(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const invoices: Invoice[] = await response.json();
      
      // Filter by invoice number (partial match)
      const filtered = invoices.filter(inv => 
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filtered.length === 0) {
        setMessage({ type: 'error', text: 'No invoices found matching the search query' });
      } else {
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to search invoices' 
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSearchResults([]);
    
    // Populate form fields with existing data
    setDeliveryNote(invoice.deliveryNote || '');
    setBuyerOrderNo(invoice.buyerOrderNo || '');
    setDispatchDocNo(invoice.dispatchDocNo || '');
    setDeliveryNoteDate(invoice.deliveryNoteDate ? invoice.deliveryNoteDate.split('T')[0] : '');
    setDispatchedThrough(invoice.dispatchedThrough || '');
    setTermsOfDelivery(invoice.termsOfDelivery || '');
    setMessage(null);
  };

  const handleUpdate = async () => {
    if (!selectedInvoice) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/invoices/${selectedInvoice.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          deliveryNote: deliveryNote.trim() || null,
          buyerOrderNo: buyerOrderNo.trim() || null,
          dispatchDocNo: dispatchDocNo.trim() || null,
          deliveryNoteDate: deliveryNoteDate || null,
          dispatchedThrough: dispatchedThrough.trim() || null,
          termsOfDelivery: termsOfDelivery.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update invoice');
      }

      const updatedInvoice = await response.json();
      setSelectedInvoice(updatedInvoice);
      setMessage({ type: 'success', text: 'Invoice details updated successfully!' });
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update invoice details' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedInvoice(null);
    setDeliveryNote('');
    setBuyerOrderNo('');
    setDispatchDocNo('');
    setDeliveryNoteDate('');
    setDispatchedThrough('');
    setTermsOfDelivery('');
    setMessage(null);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-primary rounded-full" />
        <FileEdit className="w-5 h-5" />
        Edit Invoice Details
      </h2>
      
      <div className="space-y-6">
        {/* Search Section */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter invoice number (e.g., SAL-2025-001)"
                className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Search className="w-4 h-4" />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-card border border-border rounded-lg shadow-sm max-h-60 overflow-y-auto">
              {searchResults.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => handleSelectInvoice(invoice)}
                  className="w-full px-4 py-3 text-left hover:bg-accent border-b border-border last:border-b-0 transition-all duration-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.type === 'SALE' ? invoice.customer?.name : invoice.supplier?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString()}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        invoice.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <p className="text-sm text-foreground">{message.text}</p>
          </div>
        )}

        {/* Edit Form */}
        {selectedInvoice && (
          <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-6">
            {/* Invoice Info Header */}
            <div className="pb-4 border-b border-gray-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedInvoice.invoiceNumber}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Type: </span>
                  <span className="font-medium text-gray-900">{selectedInvoice.type}</span>
                </div>
                <div>
                  <span className="text-gray-600">Date: </span>
                  <span className="font-medium text-gray-900">
                    {new Date(selectedInvoice.date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Status: </span>
                  <span className="font-medium text-gray-900">{selectedInvoice.status}</span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {selectedInvoice.type === 'SALE' ? 'Customer: ' : 'Supplier: '}
                  </span>
                  <span className="font-medium text-gray-900">
                    {selectedInvoice.type === 'SALE' 
                      ? selectedInvoice.customer?.name 
                      : selectedInvoice.supplier?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4" />
                  Delivery Note
                </label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Enter delivery note"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4" />
                  Buyer&apos;s Order No.
                </label>
                <input
                  type="text"
                  value={buyerOrderNo}
                  onChange={(e) => setBuyerOrderNo(e.target.value)}
                  placeholder="Enter buyer's order number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Package className="w-4 h-4" />
                  Dispatch Doc No.
                </label>
                <input
                  type="text"
                  value={dispatchDocNo}
                  onChange={(e) => setDispatchDocNo(e.target.value)}
                  placeholder="Enter dispatch document number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  Delivery Note Date
                </label>
                <input
                  type="date"
                  value={deliveryNoteDate}
                  onChange={(e) => setDeliveryNoteDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Truck className="w-4 h-4" />
                  Dispatched Through
                </label>
                <input
                  type="text"
                  value={dispatchedThrough}
                  onChange={(e) => setDispatchedThrough(e.target.value)}
                  placeholder="Enter dispatch method"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4" />
                  Terms of Delivery
                </label>
                <input
                  type="text"
                  value={termsOfDelivery}
                  onChange={(e) => setTermsOfDelivery(e.target.value)}
                  placeholder="Enter delivery terms"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-300">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isUpdating ? 'Updating...' : 'Update Invoice Details'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Clear
              </button>
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can edit empty fields or update existing invoice details. 
                Leave fields blank to clear existing values.
              </p>
            </div>
          </div>
        )}

        {/* Initial Help Text */}
        {!selectedInvoice && searchResults.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <FileEdit className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              Search for an invoice by its number to edit additional details like delivery note, 
              buyer&apos;s order number, dispatch information, and delivery terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
