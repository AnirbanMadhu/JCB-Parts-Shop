import { useEffect, useRef, useCallback, useState } from 'react';

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
  minLength?: number;
  maxLength?: number;
  timeout?: number; // Time in ms to wait for complete barcode
  enabled?: boolean;
  preventDefaultKeys?: boolean; // Prevent default behavior for Enter key
  enableSound?: boolean; // Play sound on successful scan
  enableVisualFeedback?: boolean; // Show visual feedback on scan
}

interface ScanFeedback {
  type: 'success' | 'error';
  message: string;
  timestamp: number;
}

/**
 * Enhanced hook to handle barcode scanner input with visual and audio feedback
 * 
 * Barcode scanners typically simulate keyboard input and type very quickly,
 * followed by an Enter key. This hook detects rapid keyboard input patterns
 * to distinguish scanner input from manual typing.
 * 
 * @param options - Configuration options for barcode scanning
 */
export function useBarcodeScanner({
  onScan,
  onError,
  minLength = 3,
  maxLength = 50,
  timeout = 100,
  enabled = true,
  preventDefaultKeys = true,
  enableSound = true,
  enableVisualFeedback = true,
}: BarcodeScannerOptions) {
  const barcodeBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Audio feedback
  const playSuccessSound = useCallback(() => {
    if (!enableSound || typeof window === 'undefined') return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      console.warn('Could not play sound:', e);
    }
  }, [enableSound]);

  const playErrorSound = useCallback(() => {
    if (!enableSound || typeof window === 'undefined') return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 400;
      oscillator.type = 'sawtooth';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      console.warn('Could not play sound:', e);
    }
  }, [enableSound]);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    if (!enableVisualFeedback) return;
    
    setFeedback({ type, message, timestamp: Date.now() });
    setTimeout(() => setFeedback(null), 3000);
  }, [enableVisualFeedback]);

  const resetBuffer = useCallback(() => {
    barcodeBuffer.current = '';
    setIsScanning(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const processBarcode = useCallback(() => {
    const barcode = barcodeBuffer.current.trim();
    
    if (barcode.length < minLength) {
      const errorMsg = `Barcode too short (${barcode.length} chars, min ${minLength})`;
      showFeedback('error', errorMsg);
      playErrorSound();
      onError?.(errorMsg);
      resetBuffer();
      return;
    }
    
    if (barcode.length > maxLength) {
      const errorMsg = `Barcode too long (${barcode.length} chars, max ${maxLength})`;
      showFeedback('error', errorMsg);
      playErrorSound();
      onError?.(errorMsg);
      resetBuffer();
      return;
    }
    
    // Success
    playSuccessSound();
    showFeedback('success', `Scanned: ${barcode}`);
    onScan(barcode);
    resetBuffer();
  }, [minLength, maxLength, onScan, onError, resetBuffer, playSuccessSound, playErrorSound, showFeedback]);

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
        
        // First character starts scanning
        if (barcodeBuffer.current.length === 0) {
          setIsScanning(true);
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

  return { 
    resetBuffer,
    feedback,
    isScanning,
    clearFeedback: () => setFeedback(null)
  };
}
