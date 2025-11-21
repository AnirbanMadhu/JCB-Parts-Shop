'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import UserManagement from '@/components/ui/UserManagement';
import EditInvoiceDetails from '@/components/features/EditInvoiceDetails';

export default function SetupPage() {
  const [salesAllowEditSubmitted, setSalesAllowEditSubmitted] = useState(false);
  const [purchasesAllowEditSubmitted, setPurchasesAllowEditSubmitted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isAdmin } = useAuth();

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
    <ProtectedRoute>
      <div className="h-full overflow-auto bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Setup</h1>
          <p className="text-muted-foreground">
            Configure your system settings and preferences
          </p>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 transition-all hover:shadow-md">
          <div className="space-y-6">
            {/* User Management - Admin Only */}
            {isAdmin() && (
              <div className="border-b border-border pb-6">
                <UserManagement />
              </div>
            )}

            {/* Sales Configuration */}
            <div className="border-b border-border pb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                Sales Configuration
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-all duration-200 group">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                      Allow Editing of Submitted Invoices
                    </h3>
                    <p className="text-sm text-muted-foreground">
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
                      <div className="w-11 h-6 bg-red-500 dark:bg-red-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 dark:peer-focus:ring-emerald-400/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:shadow-md after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-600 shadow-sm"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Purchases Configuration */}
            <div className="border-b border-border pb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                Purchases Configuration
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-all duration-200 group">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                      Allow Editing of Submitted Invoices
                    </h3>
                    <p className="text-sm text-muted-foreground">
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
                      <div className="w-11 h-6 bg-red-500 dark:bg-red-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 dark:peer-focus:ring-emerald-400/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:shadow-md after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 dark:peer-checked:bg-emerald-600 shadow-sm"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Invoice Details */}
            <div className="border-b border-border pb-6">
              <EditInvoiceDetails />
            </div>

            {/* System Information */}
            <div className="pt-2">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full" />
                System Information
              </h2>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 backdrop-blur-sm">
                <p className="text-sm text-foreground">
                  <strong>Note:</strong> Settings are saved automatically and will be applied immediately. 
                  When editing is enabled for submitted invoices, users will be able to modify invoices regardless of their status.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
