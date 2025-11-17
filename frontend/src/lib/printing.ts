/**
 * Invoice Printing Utilities
 * Supports thermal printer, PDF export, and barcode generation
 */

import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generate barcode as data URL
 */
export function generateBarcode(value: string, format: 'CODE128' | 'EAN13' | 'UPC' = 'CODE128'): string {
  const canvas = document.createElement('canvas');
  
  try {
    JsBarcode(canvas, value, {
      format,
      width: 2,
      height: 50,
      displayValue: true,
      fontSize: 12,
      margin: 10,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Barcode generation failed:', error);
    return '';
  }
}

/**
 * Print invoice to thermal printer (direct print)
 */
export function printThermal(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Print element not found');
    return;
  }

  // Clone the element to avoid modifying the original
  const printContent = element.cloneNode(true) as HTMLElement;
  
  // Create print window
  const printWindow = window.open('', '_blank', 'width=300,height=600');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  // Thermal printer optimized styles (58mm or 80mm)
  const thermalStyles = `
    <style>
      @page {
        size: 80mm auto;
        margin: 0;
      }
      
      body {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.4;
        margin: 0;
        padding: 5mm;
        width: 80mm;
      }
      
      h1 { font-size: 16px; font-weight: bold; text-align: center; margin: 5px 0; }
      h2 { font-size: 14px; font-weight: bold; margin: 5px 0; }
      h3 { font-size: 12px; font-weight: bold; margin: 3px 0; }
      
      table { width: 100%; border-collapse: collapse; margin: 5px 0; }
      th, td { padding: 2px; text-align: left; font-size: 11px; }
      th { font-weight: bold; border-bottom: 1px dashed #000; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .border-top { border-top: 1px dashed #000; padding-top: 5px; }
      .border-bottom { border-bottom: 1px dashed #000; padding-bottom: 5px; }
      .mt-2 { margin-top: 10px; }
      .barcode { text-align: center; margin: 10px 0; }
      
      @media print {
        body { width: 80mm; }
      }
    </style>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Invoice</title>
        ${thermalStyles}
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for images to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
}

/**
 * Export invoice as PDF
 */
export async function exportToPDF(elementId: string, filename: string = 'invoice.pdf'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Export element not found');
    return;
  }

  try {
    // Capture element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    // Create PDF
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}

/**
 * Standard A4 print (for laser printers)
 */
export function printA4(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Print element not found');
    return;
  }

  // Clone the element
  const printContent = element.cloneNode(true) as HTMLElement;
  
  // Create print window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  // A4 optimized styles
  const a4Styles = `
    <style>
      @page {
        size: A4;
        margin: 20mm;
      }
      
      body {
        font-family: Arial, sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: #000;
        margin: 0;
        padding: 0;
      }
      
      h1 { font-size: 20pt; font-weight: bold; margin: 10px 0; }
      h2 { font-size: 16pt; font-weight: bold; margin: 8px 0; }
      h3 { font-size: 14pt; font-weight: bold; margin: 6px 0; }
      
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 10px 0;
      }
      
      th, td { 
        padding: 8px; 
        text-align: left; 
        border: 1px solid #ddd;
      }
      
      th { 
        background-color: #f8f9fa; 
        font-weight: bold;
      }
      
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      .border-top { border-top: 2px solid #000; padding-top: 10px; }
      .border-bottom { border-bottom: 2px solid #000; padding-bottom: 10px; }
      .mt-4 { margin-top: 20px; }
      .barcode { text-align: center; margin: 15px 0; }
      
      @media print {
        body { margin: 0; }
        .no-print { display: none; }
      }
    </style>
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Invoice</title>
        ${a4Styles}
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for images to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
}

/**
 * Get printer-friendly invoice template
 */
export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName?: string;
  supplierName?: string;
  items: Array<{
    itemName: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  discount?: number;
  cgst?: number;
  sgst?: number;
  total: number;
  barcode?: string;
}

/**
 * Generate thermal receipt HTML
 */
export function generateThermalReceipt(data: InvoiceData): string {
  const barcodeImg = data.barcode ? generateBarcode(data.barcode) : null;
  
  return `
    <div class="thermal-receipt">
      <h1>S.P.TRADERS AND BUILDERS</h1>
      <p class="text-center">JCB Parts Shop</p>
      <p class="text-center border-bottom pb-2">GST: XXXXXXXXX</p>
      
      ${barcodeImg ? `<div class="barcode"><img src="${barcodeImg}" alt="Barcode" /></div>` : ''}
      
      <p><strong>Invoice:</strong> ${data.invoiceNumber}</p>
      <p><strong>Date:</strong> ${data.date}</p>
      ${data.customerName ? `<p><strong>Customer:</strong> ${data.customerName}</p>` : ''}
      ${data.supplierName ? `<p><strong>Supplier:</strong> ${data.supplierName}</p>` : ''}
      
      <table class="mt-2">
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Rate</th>
            <th class="text-right">Amt</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.itemName}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">₹${item.rate.toFixed(2)}</td>
              <td class="text-right">₹${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="border-top mt-2">
        <table>
          <tr>
            <td><strong>Subtotal:</strong></td>
            <td class="text-right">₹${data.subtotal.toFixed(2)}</td>
          </tr>
          ${data.discount ? `
            <tr>
              <td>Discount:</td>
              <td class="text-right">-₹${data.discount.toFixed(2)}</td>
            </tr>
          ` : ''}
          ${data.cgst ? `
            <tr>
              <td>CGST:</td>
              <td class="text-right">₹${data.cgst.toFixed(2)}</td>
            </tr>
          ` : ''}
          ${data.sgst ? `
            <tr>
              <td>SGST:</td>
              <td class="text-right">₹${data.sgst.toFixed(2)}</td>
            </tr>
          ` : ''}
          <tr class="border-top">
            <td><strong>TOTAL:</strong></td>
            <td class="text-right"><strong>₹${data.total.toFixed(2)}</strong></td>
          </tr>
        </table>
      </div>
      
      <p class="text-center mt-2 border-top pt-2">Thank you for your business!</p>
    </div>
  `;
}
