/**
 * Stock Alert System
 * Monitor stock levels and trigger alerts when inventory is low
 */

import { useEffect, useState } from 'react';
import { useStock } from './useAPI';
import { useNotification } from '@/components/NotificationProvider';

export interface StockAlert {
  partId: number;
  partNumber: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  severity: 'warning' | 'critical';
}

export interface StockAlertConfig {
  enabled: boolean;
  minStockThreshold: number; // Default minimum stock level
  criticalStockThreshold: number; // Critical stock level (near zero)
  checkInterval: number; // How often to check (in milliseconds)
  showNotifications: boolean;
  playSound: boolean;
}

const DEFAULT_CONFIG: StockAlertConfig = {
  enabled: true,
  minStockThreshold: 10,
  criticalStockThreshold: 3,
  checkInterval: 30000, // 30 seconds
  showNotifications: true,
  playSound: true,
};

/**
 * Hook to monitor stock levels and trigger alerts
 */
export function useStockAlerts(config: Partial<StockAlertConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const { data: stockData, error, isLoading } = useStock();
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [hasShownAlerts, setHasShownAlerts] = useState<Set<number>>(new Set());
  const { showNotification } = useNotification();

  useEffect(() => {
    if (!fullConfig.enabled || !stockData) return;

    const newAlerts: StockAlert[] = [];

    stockData.forEach((item) => {
      const stock = item.stock || 0;
      
      // Critical alert
      if (stock <= fullConfig.criticalStockThreshold && stock >= 0) {
        newAlerts.push({
          partId: item.id,
          partNumber: item.partNumber,
          itemName: item.itemName,
          currentStock: stock,
          minStock: fullConfig.criticalStockThreshold,
          severity: 'critical',
        });

        // Show notification if not shown before
        if (!hasShownAlerts.has(item.id) && fullConfig.showNotifications) {
          showNotification({
            type: 'error',
            title: 'Critical Stock Alert',
            message: `${item.itemName} (${item.partNumber}) is critically low: ${stock} units remaining`,
            duration: 0, // Don't auto-hide critical alerts
          });
          
          if (fullConfig.playSound) {
            playAlertSound('critical');
          }

          // Mark as shown
          setHasShownAlerts((prev) => {
            const newSet = new Set(prev);
            newSet.add(item.id);
            return newSet;
          });
        }
      }
      // Warning alert
      else if (stock <= fullConfig.minStockThreshold && stock > fullConfig.criticalStockThreshold) {
        newAlerts.push({
          partId: item.id,
          partNumber: item.partNumber,
          itemName: item.itemName,
          currentStock: stock,
          minStock: fullConfig.minStockThreshold,
          severity: 'warning',
        });

        // Show notification if not shown before
        if (!hasShownAlerts.has(item.id) && fullConfig.showNotifications) {
          showNotification({
            type: 'warning',
            title: 'Low Stock Warning',
            message: `${item.itemName} (${item.partNumber}) is running low: ${stock} units remaining`,
            duration: 10000,
          });
          
          if (fullConfig.playSound) {
            playAlertSound('warning');
          }

          // Mark as shown
          setHasShownAlerts((prev) => {
            const newSet = new Set(prev);
            newSet.add(item.id);
            return newSet;
          });
        }
      }
    });

    setAlerts(newAlerts);
  }, [stockData, fullConfig.enabled, fullConfig.minStockThreshold, fullConfig.criticalStockThreshold, fullConfig.showNotifications, fullConfig.playSound]);

  const clearAlert = (partId: number) => {
    setAlerts((prev: StockAlert[]) => prev.filter((alert: StockAlert) => alert.partId !== partId));
    setHasShownAlerts((prev: Set<number>) => {
      const newSet = new Set(prev);
      newSet.delete(partId);
      return newSet;
    });
  };

  const clearAllAlerts = () => {
    setAlerts([]);
    setHasShownAlerts(new Set());
  };

  return {
    alerts,
    hasAlerts: alerts.length > 0,
    criticalAlerts: alerts.filter((a: StockAlert) => a.severity === 'critical'),
    warningAlerts: alerts.filter((a: StockAlert) => a.severity === 'warning'),
    clearAlert,
    clearAllAlerts,
    isLoading,
    error,
  };
}

/**
 * Play alert sound based on severity
 */
function playAlertSound(severity: 'warning' | 'critical') {
  if (typeof window === 'undefined') return;

  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (severity === 'critical') {
      // Urgent beeping sound
      oscillator.frequency.value = 800;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.3);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.4);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } else {
      // Gentle alert sound
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  } catch (e) {
    console.warn('Could not play alert sound:', e);
  }
}

/**
 * Get stock alert configuration from localStorage
 */
export function getStockAlertConfig(): StockAlertConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  const stored = localStorage.getItem('stock_alert_config');
  if (stored) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch (e) {
      console.error('Failed to parse stock alert config:', e);
    }
  }
  return DEFAULT_CONFIG;
}

/**
 * Save stock alert configuration to localStorage
 */
export function saveStockAlertConfig(config: Partial<StockAlertConfig>) {
  if (typeof window === 'undefined') return;

  const currentConfig = getStockAlertConfig();
  const newConfig = { ...currentConfig, ...config };
  localStorage.setItem('stock_alert_config', JSON.stringify(newConfig));
}
