'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Scan } from 'lucide-react';

interface ScanFeedbackProps {
  type: 'success' | 'error' | 'scanning';
  message: string;
}

/**
 * Visual feedback component for barcode scanning
 */
export function ScanFeedback({ type, message }: ScanFeedbackProps) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    error: <XCircle className="w-5 h-5 text-red-600" />,
    scanning: <Scan className="w-5 h-5 text-blue-600 animate-pulse" />
  };

  const backgrounds = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    scanning: 'bg-blue-50 border-blue-200'
  };

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    scanning: 'text-blue-800'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${backgrounds[type]}`}
    >
      {icons[type]}
      <span className={`font-medium ${textColors[type]}`}>{message}</span>
    </motion.div>
  );
}

interface BarcodeScannerIndicatorProps {
  isScanning: boolean;
  feedback?: { type: 'success' | 'error'; message: string; timestamp: number } | null;
}

/**
 * Barcode scanner status indicator with visual feedback
 */
export function BarcodeScannerIndicator({ isScanning, feedback }: BarcodeScannerIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {isScanning && (
        <ScanFeedback key="scanning" type="scanning" message="Scanning..." />
      )}
      {!isScanning && feedback && (
        <ScanFeedback 
          key={`feedback-${feedback.timestamp}`}
          type={feedback.type} 
          message={feedback.message} 
        />
      )}
    </AnimatePresence>
  );
}
