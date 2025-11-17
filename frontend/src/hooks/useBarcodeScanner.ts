import { useEffect, useRef, useCallback } from 'react';

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  maxLength?: number;
  timeout?: number; // Time in ms to wait for complete barcode
  enabled?: boolean;
  preventDefaultKeys?: boolean; // Prevent default behavior for Enter key
}

/**
 * Hook to handle barcode scanner input
 * 
 * Barcode scanners typically simulate keyboard input and type very quickly,
 * followed by an Enter key. This hook detects rapid keyboard input patterns
 * to distinguish scanner input from manual typing.
 * 
 * @param options - Configuration options for barcode scanning
 */
export function useBarcodeScanner({
  onScan,
  minLength = 3,
  maxLength = 50,
  timeout = 100,
  enabled = true,
  preventDefaultKeys = true,
}: BarcodeScannerOptions) {
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetBuffer = useCallback(() => {
    barcodeBuffer.current = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const processBarcode = useCallback(() => {
    const barcode = barcodeBuffer.current.trim();
    
    if (barcode.length >= minLength && barcode.length <= maxLength) {
      onScan(barcode);
    }
    
    resetBuffer();
  }, [minLength, maxLength, onScan, resetBuffer]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      // Ignore if user is typing in an input field (unless it's a special scanner input)
      const target = event.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      // Handle Enter key - typically sent by scanner at the end
      if (event.key === 'Enter') {
        if (preventDefaultKeys && barcodeBuffer.current.length > 0) {
          event.preventDefault();
        }
        processBarcode();
        return;
      }

      // Handle Tab key - some scanners use this instead of Enter
      if (event.key === 'Tab' && barcodeBuffer.current.length > 0) {
        if (preventDefaultKeys) {
          event.preventDefault();
        }
        processBarcode();
        return;
      }

      // Reset buffer if too much time has passed (user is typing manually)
      if (timeDiff > timeout && barcodeBuffer.current.length > 0) {
        resetBuffer();
      }

      // Only capture alphanumeric and some special characters
      if (event.key.length === 1 && !isInputField) {
        // Prevent default for captured keys when scanner is active
        if (preventDefaultKeys && barcodeBuffer.current.length > 0) {
          event.preventDefault();
        }
        
        barcodeBuffer.current += event.key;
        lastKeyTime.current = currentTime;

        // Auto-process if buffer exceeds max length
        if (barcodeBuffer.current.length >= maxLength) {
          processBarcode();
        } else {
          // Set timeout to process barcode if no more input comes
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          timeoutRef.current = setTimeout(() => {
            if (barcodeBuffer.current.length >= minLength) {
              processBarcode();
            } else {
              resetBuffer();
            }
          }, timeout + 50);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, timeout, minLength, maxLength, processBarcode, resetBuffer, preventDefaultKeys]);

  return { resetBuffer };
}
