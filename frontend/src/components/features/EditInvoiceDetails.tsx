'use client';

import { API_BASE_URL } from '@/lib/constants';

import { useState } from 'react';
import { FileEdit, Search, Calendar, FileText, Truck, Package } from 'lucide-react';
import { useNotification } from '@/components/NotificationProvider';

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
  const { showNotification } = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Form fields
  const [deliveryNote, setDeliveryNote] = useState('');
  const [buyerOrderNo, setBuyerOrderNo] = useState('');
  const [dispatchDocNo, setDispatchDocNo] = useState('');
  const [deliveryNoteDate, setDeliveryNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchedThrough, setDispatchedThrough] = useState('');
  const [termsOfDelivery, setTermsOfDelivery] = useState('');

  

  const handleSearch = async (query?: string) => {
    const searchText = query !== undefined ? query : searchQuery;
    
    if (!searchText.trim()) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/invoices`, {
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
        inv.invoiceNumber.toLowerCase().includes(searchText.toLowerCase())
      );

      if (filtered.length === 0) {
        showNotification({ type: 'error', title: 'No invoices found matching the search query' });
        setSearchResults([]);
        setShowSuggestions(false);
      } else {
        setSearchResults(filtered);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      showNotification({ 
        type: 'error', 
        title: 'Search failed',
        message: err instanceof Error ? err.message : 'Failed to search invoices'
      });
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    if (value.length >= 2) {
      handleSearch(value);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSearchResults([]);
    setShowSuggestions(false);
    setSearchQuery(invoice.invoiceNumber);
    
    // Populate form fields with existing data
    setDeliveryNote(invoice.deliveryNote || '');
    setBuyerOrderNo(invoice.buyerOrderNo || '');
    setDispatchDocNo(invoice.dispatchDocNo || '');
    setDeliveryNoteDate(invoice.deliveryNoteDate ? invoice.deliveryNoteDate.split('T')[0] : '');
    setDispatchedThrough(invoice.dispatchedThrough || '');
    setTermsOfDelivery(invoice.termsOfDelivery || '');
  };

  const handleUpdate = async () => {
    if (!selectedInvoice) return;

    setIsUpdating(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/invoices/${selectedInvoice.id}`, {
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
      showNotification({ type: 'success', title: 'Invoice details updated successfully!' });
    } catch (err) {
      console.error('Update error:', err);
      showNotification({ 
        type: 'error', 
        title: 'Update failed',
        message: err instanceof Error ? err.message : 'Failed to update invoice details'
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
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setShowSuggestions(true)}
                placeholder="Enter invoice number (e.g., JCB/02/NOV/25-26)"
                className="w-full px-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={isSearching}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Search className="w-4 h-4" />
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          {showSuggestions && searchResults.length > 0 && (
            <div className="bg-card border border-border rounded-lg shadow-sm max-h-60 overflow-y-auto">
              {searchResults.map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => handleSelectInvoice(invoice)}
                  className="w-full px-4 py-3 text-left hover:bg-accent border-b border-border last:border-b-0 transition-all duration-200 cursor-pointer"
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

        {/* Edit Form */}
        {selectedInvoice && (
          <div className="bg-muted/50 border border-border rounded-lg p-6 space-y-6">
            {/* Invoice Info Header */}
            <div className="pb-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {selectedInvoice.invoiceNumber}
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium text-foreground">{selectedInvoice.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date: </span>
                  <span className="font-medium text-foreground">
                    {new Date(selectedInvoice.date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <span className="font-medium text-foreground">{selectedInvoice.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    {selectedInvoice.type === 'SALE' ? 'Customer: ' : 'Supplier: '}
                  </span>
                  <span className="font-medium text-foreground">
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
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4" />
                  Delivery Note
                </label>
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Enter delivery note"
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4" />
                  Buyer&apos;s Order No.
                </label>
                <input
                  type="text"
                  value={buyerOrderNo}
                  onChange={(e) => setBuyerOrderNo(e.target.value)}
                  placeholder="Enter buyer's order number"
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Package className="w-4 h-4" />
                  Dispatch Doc No.
                </label>
                <input
                  type="text"
                  value={dispatchDocNo}
                  onChange={(e) => setDispatchDocNo(e.target.value)}
                  placeholder="Enter dispatch document number"
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  Delivery Note Date
                </label>
                <input
                  type="date"
                  value={deliveryNoteDate}
                  onChange={(e) => setDeliveryNoteDate(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <Truck className="w-4 h-4" />
                  Dispatched Through
                </label>
                <input
                  type="text"
                  value={dispatchedThrough}
                  onChange={(e) => setDispatchedThrough(e.target.value)}
                  placeholder="Enter dispatch method"
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4" />
                  Terms of Delivery
                </label>
                <input
                  type="text"
                  value={termsOfDelivery}
                  onChange={(e) => setTermsOfDelivery(e.target.value)}
                  placeholder="Enter delivery terms"
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed enabled:cursor-pointer"
              >
                {isUpdating ? 'Updating...' : 'Update Invoice Details'}
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>

            {/* Info Note */}
            <div className="w-full bg-blue-100 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                <strong className="font-bold">Note:</strong> Settings are saved automatically and will be applied immediately. When editing is enabled for submitted invoices, users will be able to modify and update invoices after they have been submitted (status is not DRAFT).
              </p>
            </div>
          </div>
        )}

        {/* Initial Help Text */}
        {!selectedInvoice && searchResults.length === 0 && (
          <div className="bg-secondary border border-border rounded-lg p-6 text-center">
            <FileEdit className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Search for an invoice by its number to edit additional details like delivery note, 
              buyer&apos;s order number, dispatch information, and delivery terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
