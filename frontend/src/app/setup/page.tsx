'use client';

import { useState, useEffect } from 'react';

export default function SetupPage() {
  const [salesAllowEditSubmitted, setSalesAllowEditSubmitted] = useState(false);
  const [purchasesAllowEditSubmitted, setPurchasesAllowEditSubmitted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const salesSetting = localStorage.getItem('settings.sales.allowEditSubmitted');
    const purchasesSetting = localStorage.getItem('settings.purchases.allowEditSubmitted');
    
    if (salesSetting !== null) {
      setSalesAllowEditSubmitted(salesSetting === 'true');
    }
    if (purchasesSetting !== null) {
      setPurchasesAllowEditSubmitted(purchasesSetting === 'true');
    }
  }, []);

  // Save settings to localStorage when changed
  const handleSalesToggle = (value: boolean) => {
    setSalesAllowEditSubmitted(value);
    localStorage.setItem('settings.sales.allowEditSubmitted', value.toString());
  };

  const handlePurchasesToggle = (value: boolean) => {
    setPurchasesAllowEditSubmitted(value);
    localStorage.setItem('settings.purchases.allowEditSubmitted', value.toString());
  };

  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Setup</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600 mb-6">
            Configure your system settings and preferences
          </p>
          <div className="space-y-6">
            {/* Sales Configuration */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales Configuration</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      Allow Editing of Submitted Invoices
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enable this to allow modification and updates to sales invoices after they have been submitted (status is not DRAFT)
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={salesAllowEditSubmitted}
                        onChange={(e) => handleSalesToggle(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchases Configuration */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Purchases Configuration</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      Allow Editing of Submitted Invoices
                    </h3>
                    <p className="text-sm text-gray-600">
                      Enable this to allow modification and updates to purchase invoices after they have been submitted (status is not DRAFT)
                    </p>
                  </div>
                  <div className="ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={purchasesAllowEditSubmitted}
                        onChange={(e) => handlePurchasesToggle(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* System Information */}
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">System Information</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Settings are saved automatically and will be applied immediately. 
                  When editing is enabled for submitted invoices, users will be able to modify invoices regardless of their status.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
