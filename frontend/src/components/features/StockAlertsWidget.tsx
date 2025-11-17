'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Package, X, Bell, BellOff } from 'lucide-react';
import { useStockAlerts, saveStockAlertConfig, getStockAlertConfig } from '@/hooks/useStockAlerts';
import { useState, useEffect } from 'react';
import { slideInFromRight } from '@/lib/motion';

/**
 * Stock Alerts Widget
 * Displays low stock and critical stock alerts in real-time
 */
export function StockAlertsWidget() {
  const [enabled, setEnabled] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load config after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const config = getStockAlertConfig();
    setEnabled(config.enabled);
  }, []);
  
  const {
    alerts,
    hasAlerts,
    criticalAlerts,
    warningAlerts,
    clearAlert,
    clearAllAlerts,
  } = useStockAlerts({ enabled });

  const toggleAlerts = () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    saveStockAlertConfig({ enabled: newEnabled });
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  if (!enabled) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={toggleAlerts}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gray-200 text-gray-600 rounded-full shadow-lg hover:bg-gray-300 transition-colors"
        title="Enable stock alerts"
      >
        <BellOff className="w-6 h-6" />
      </motion.button>
    );
  }

  if (!hasAlerts) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={toggleAlerts}
        className="fixed bottom-6 right-6 z-40 p-4 bg-green-100 text-green-600 rounded-full shadow-lg hover:bg-green-200 transition-colors"
        title="All stock levels are healthy"
      >
        <Bell className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <>
      {/* Alert Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setShowDetails(!showDetails)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-colors ${
          criticalAlerts.length > 0
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-yellow-500 text-white hover:bg-yellow-600'
        }`}
      >
        <div className="relative">
          <AlertTriangle className="w-6 h-6" />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {alerts.length}
          </motion.span>
        </div>
      </motion.button>

      {/* Alert Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            variants={slideInFromRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-24 right-6 z-40 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[500px] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-semibold text-gray-900">Stock Alerts</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearAllAlerts}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Alert List */}
            <div className="overflow-y-auto flex-1">
              {/* Critical Alerts */}
              {criticalAlerts.length > 0 && (
                <div className="p-4 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                    Critical ({criticalAlerts.length})
                  </h4>
                  <div className="space-y-2">
                    {criticalAlerts.map((alert) => (
                      <motion.div
                        key={alert.partId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-red-900 truncate">
                              {alert.itemName}
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                              {alert.partNumber}
                            </p>
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              Only {alert.currentStock} units left
                            </p>
                          </div>
                          <button
                            onClick={() => clearAlert(alert.partId)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning Alerts */}
              {warningAlerts.length > 0 && (
                <div className="p-4">
                  <h4 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
                    Low Stock ({warningAlerts.length})
                  </h4>
                  <div className="space-y-2">
                    {warningAlerts.map((alert) => (
                      <motion.div
                        key={alert.partId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-yellow-900 truncate">
                              {alert.itemName}
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              {alert.partNumber}
                            </p>
                            <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {alert.currentStock} units remaining
                            </p>
                          </div>
                          <button
                            onClick={() => clearAlert(alert.partId)}
                            className="text-yellow-400 hover:text-yellow-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={toggleAlerts}
                className="w-full text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Disable Alerts
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
