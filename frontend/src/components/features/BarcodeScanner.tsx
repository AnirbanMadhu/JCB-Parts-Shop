'use client';

import { useState, useEffect } from 'react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { Scan, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void | Promise<void>;
  enabled?: boolean;
  showIndicator?: boolean;
  minLength?: number;
  maxLength?: number;
  className?: string;
}

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

/**
 * BarcodeScanner Component
 * 
 * Provides visual feedback when a barcode scanner is used.
 * Works with any USB/Bluetooth barcode scanner that emulates keyboard input.
 * 
 * Usage:
 * ```tsx
 * <BarcodeScanner
 *   onScan={(barcode) => handleBarcodeScanned(barcode)}
 *   enabled={true}
 *   showIndicator={true}
 * />
 * ```
 */
export default function BarcodeScanner({
  onScan,
  enabled = true,
  showIndicator = true,
  minLength = 3,
  maxLength = 50,
  className = '',
}: BarcodeScannerProps) {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [lastScannedCode, setLastScannedCode] = useState<string>('');

  const handleScan = async (barcode: string) => {
    setStatus('scanning');
    setLastScannedCode(barcode);

    try {
      await onScan(barcode);
      setStatus('success');
      
      // Reset to idle after showing success
      setTimeout(() => {
        setStatus('idle');
        setLastScannedCode('');
      }, 2000);
    } catch (error) {
      console.error('Barcode scan error:', error);
      setStatus('error');
      
      // Reset to idle after showing error
      setTimeout(() => {
        setStatus('idle');
        setLastScannedCode('');
      }, 3000);
    }
  };

  useBarcodeScanner({
    onScan: handleScan,
    enabled,
    minLength,
    maxLength,
    preventDefaultKeys: true,
  });

  if (!showIndicator) {
    return null;
  }

  const getStatusColor = () => {
    switch (status) {
      case 'scanning':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'scanning':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Scan className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'scanning':
        return 'Processing scan...';
      case 'success':
        return `✓ Added: ${lastScannedCode}`;
      case 'error':
        return `✗ Not found: ${lastScannedCode}`;
      default:
        return enabled ? '⚡ Scanner ready - scan barcode' : 'Scanner disabled';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">
        {getStatusText()}
      </span>
    </div>
  );
}
