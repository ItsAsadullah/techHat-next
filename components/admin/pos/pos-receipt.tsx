'use client';

import { useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, CheckCircle2, Download } from 'lucide-react';
import type { CartItem } from '@/lib/actions/pos-actions';
import type { InvoiceSettings } from '@/lib/actions/invoice-settings-actions';

interface ReceiptData {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountType?: 'fixed' | 'percent';
  discountValue?: number;
  tax: number;
  grandTotal: number;
  paymentMethod: string;
  amountReceived: number;
  change: number;
  customerName?: string;
  customerPhone?: string;
  date: string;
  // Due payment
  paidAmount?: number | null;
  dueAmount?: number;
  posPaymentStatus?: 'PAID' | 'PARTIAL' | 'DUE';
  // Guarantor
  guarantorName?: string;
  guarantorPhone?: string;
  guarantorRelation?: string;
  // Mixed payment breakdown
  cashPayment?: number;
  cardPayment?: number;
  mobilePayment?: number;
  mobileTrxId?: string;
  mobileNumber?: string;
  mobileProvider?: string;
  // Mobile Details (for direct mobile payment)
  mobileCashOutCharge?: number;
}

interface POSReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
  invoiceSettings?: InvoiceSettings;
}

export function POSReceipt({ isOpen, onClose, receipt, invoiceSettings }: POSReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!receipt) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=1123');
    if (!printWindow) return;

    // Use the static assets for header background
    const headerBg = '/images/invoice/header-bg.png';
    const footerBg = '/images/invoice/footer-bg.png';
    const logo = '/images/Logo.png';

    const companyName = invoiceSettings?.invoiceCompanyName || 'TechHat';
    const companyPhone = invoiceSettings?.invoiceCompanyPhone || '+8801911777694';
    const companyEmail = invoiceSettings?.invoiceCompanyEmail || 'techhat.shop@gmail.com';
    const companyAddress = invoiceSettings?.invoiceCompanyAddress || 'Haildhani Bazar, Jhenaidah Sadar, Jhenaidah';

    const styles = `
      @page { 
        size: A4; 
        margin: 0; 
      }
      * { 
        margin: 0; 
        padding: 0; 
        box-sizing: border-box; 
      }
      body { 
        font-family: 'Arial', sans-serif;
        font-size: 13px;
        line-height: 1.6;
        color: #000;
        background: #fff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .invoice-container {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        background: #fff;
        position: relative;
        padding-bottom: 100px;
        overflow: hidden;
      }
      
      /* Header Section */
      .invoice-header {
        position: relative;
        height: 120px;
        background-image: url('${headerBg}');
        background-size: 110%;
        background-position: right center;
        background-repeat: no-repeat;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 40px;
        margin-top: 10px;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      .logo {
        height: 70px;
        width: auto;
        object-fit: contain;
      }
      .company-name {
        font-size: 32px;
        font-weight: 900;
        font-family: 'Impact', 'Arial Black', sans-serif;
        letter-spacing: 2px;
        line-height: 1;
      }
      .company-name .tech {
        color: #E31E24;
      }
      .company-name .hat {
        color: #333;
      }
      .company-slogan {
        font-size: 11px;
        color: #666;
        font-style: italic;
        margin-top: 4px;
      }
      .header-right {
        text-align: right;
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
      }
      .invoice-title {
        color: white;
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 2px;
        display: inline-block;
        margin-top: -5px;
      }
      .company-contact {
        font-size: 16px;
        line-height: 1.3;
        color: #fff;
      }
      .company-contact div {
        display: flex;
        align-items: center;
        justify-content: flex-end;
      }
      .contact-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 8px;
      }
      .contact-icon svg {
        width: 14px;
        height: 14px;
        stroke: currentColor;
        fill: none;
      }
      
      /* Main Content */
      .invoice-body {
        padding: 30px 40px;
      }
      
      .invoice-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 25px;
      }
      .invoice-to {
        flex: 1;
        background: #f9f9f9;
        padding: 15px;
        border-radius: 8px;
      }
      .invoice-to h3 {
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
      }
      .customer-name {
        font-size: 18px;
        font-weight: bold;
        color: #E31E24;
        margin-bottom: 3px;
      }
      .customer-phone {
        font-size: 12px;
        color: #666;
      }
      .invoice-details {
        text-align: right;
        background: #f9f9f9;
        padding: 15px;
        border-radius: 8px;
      }
      .invoice-number {
        background: #333;
        color: white;
        padding: 5px 15px;
        font-size: 12px;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 8px;
        border-radius: 6px;
      }
      .detail-row {
        font-size: 12px;
        margin-bottom: 3px;
      }
      .detail-label {
        font-weight: normal;
        color: #666;
        display: inline-block;
        width: 100px;
        text-align: right;
      }
      .detail-value {
        font-weight: bold;
        color: #000;
      }
      
      /* Table */
      .invoice-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 25px;
        border-radius: 8px;
        overflow: hidden;
      }
      .invoice-table thead {
        background: #E31E24;
        color: white;
      }
      .invoice-table thead th {
        padding: 8px 12px;
        text-align: left;
        font-size: 13px;
        font-weight: bold;
      }
      .invoice-table thead th:first-child {
        border-radius: 8px 0 0 0;
      }
      .invoice-table thead th:last-child {
        border-radius: 0 8px 0 0;
      }
      .invoice-table thead th:nth-child(2),
      .invoice-table thead th:nth-child(3),
      .invoice-table thead th:nth-child(4) {
        text-align: center;
        background: #333;
      }
      .invoice-table tbody tr {
        border-bottom: 1px solid #e0e0e0;
      }
      .invoice-table tbody td {
        padding: 10px 12px;
        font-size: 12px;
      }
      .item-name {
        font-weight: 600;
        color: #000;
      }
      .item-desc {
        font-size: 11px;
        color: #666;
        font-style: italic;
        margin-top: 2px;
      }
      .invoice-table tbody td:nth-child(2),
      .invoice-table tbody td:nth-child(3),
      .invoice-table tbody td:nth-child(4) {
        text-align: center;
        font-weight: 600;
      }
      
      /* Bottom Section */
      .invoice-bottom {
        display: flex;
        justify-content: space-between;
        gap: 40px;
        margin-top: 30px;
      }
      .payment-info {
        flex: 1;
        background: #f9f9f9;
        padding: 15px;
        border-radius: 8px;
      }
      .payment-info h4 {
        font-size: 13px;
        font-weight: bold;
        margin-bottom: 8px;
      }
      .payment-info .info-row {
        font-size: 11px;
        margin-bottom: 4px;
      }
      .info-label {
        display: inline-block;
        width: 80px;
        color: #666;
      }
      .info-value {
        font-weight: 600;
        color: #000;
      }
      
      .totals {
        min-width: 300px;
        border-radius: 8px;
        overflow: hidden;
      }
      .total-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 15px;
        font-size: 13px;
      }
      .total-row.subtotal {
        border-top: 1px solid #ddd;
        border-radius: 8px 8px 0 0;
      }
      .total-row.grand {
        background: #E31E24;
        color: white;
        font-size: 16px;
        font-weight: bold;
        margin-top: 5px;
        border-radius: 6px;
      }
      .total-row.vat,
      .total-row.discount {
        font-size: 12px;
        color: #666;
      }
      
      .terms-section {
        margin-top: 30px;
        padding: 15px;
        background: #f9f9f9;
        border-left: 3px solid #E31E24;
        border-radius: 8px;
      }
      .terms-section h4 {
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .terms-section p {
        font-size: 11px;
        color: #666;
        line-height: 1.5;
      }
      
      .signature-section {
        margin-top: 40px;
        text-align: right;
      }
      .signature-line {
        border-top: 1px solid #000;
        width: 200px;
        margin-left: auto;
        margin-top: 60px;
        padding-top: 5px;
        font-size: 11px;
        text-align: center;
      }
      
      /* Footer Section */
      .invoice-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        padding-top: 10px;
      }
      .footer-decoration {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 60%;
        height: 80px;
        background-image: url('${footerBg}');
        background-size: contain;
        background-position: right bottom;
        background-repeat: no-repeat;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
      }
      .invoice-footer > * {
        position: relative;
        z-index: 1;
      }
      .thank-you {
        font-size: 14px;
        font-weight: bold;
        color: #E31E24;
        margin-bottom: 5px;
      }
      .footer-note {
        font-size: 10px;
        color: #666;
        font-style: italic;
      }
      
      @media print {
        body { margin: 0; }
        .invoice-container { margin: 0; }
      }
    `;

    const contentHtml = `
      <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
          <div class="header-left">
            <img src="${logo}" alt="${companyName}" class="logo" />
            <div>
              <div class="company-name"><span class="tech">TECH</span> <span class="hat">HAT</span></div>
              <div class="company-slogan">Trusted Place of Technology</div>
            </div>
          </div>
          <div class="header-right">
            <div class="invoice-title">INVOICE</div>
            <div class="company-contact">
              <div>${companyPhone} <span class="contact-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 13 19.79 19.79 0 0 1 1.87 4.26 2 2 0 0 1 3.84 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span></div>
              <div>${companyEmail} <span class="contact-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span></div>
              <div>${companyAddress} <span class="contact-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span></div>
            </div>
          </div>
        </div>
        
        <!-- Body -->
        <div class="invoice-body">
          <!-- Invoice Meta -->
          <div class="invoice-meta">
            <div class="invoice-to">
              <h3>Invoice To:</h3>
              <div class="customer-name">${receipt.customerName || 'Guest Customer'}</div>
              ${receipt.customerPhone ? `<div class="customer-phone">P : ${receipt.customerPhone}</div>` : ''}
            </div>
            <div class="invoice-details">
              <div class="invoice-number">INVOICE NO:#${receipt.orderNumber}</div>
              <div class="detail-row">
                <span class="detail-label">Account No</span>
                <span class="detail-value">${receipt.orderNumber.slice(0, 6)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Invoice Date</span>
                <span class="detail-value">${receipt.date}</span>
              </div>
            </div>
          </div>
          
          <!-- Items Table -->
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Item description</th>
                <th>Quantity</th>
                <th>Unite Price</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.items.map(item => `
                <tr>
                  <td>
                    <div class="item-name">${item.name}</div>
                    ${item.variantName ? `<div class="item-desc">${item.variantName}</div>` : ''}
                  </td>
                  <td>${String(item.quantity).padStart(2, '0')}</td>
                  <td>$${item.price}</td>
                  <td>$${item.price * item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <!-- Bottom Section -->
          <div class="invoice-bottom">
            <div class="payment-info">
              <h4>Payment method</h4>
              <div class="info-row">
                <span class="info-label">Account</span>
                <span class="info-value">${receipt.paymentMethod}</span>
              </div>
              ${receipt.paymentMethod === 'MIXED' ? `
                ${receipt.cashPayment ? `<div class="info-row"><span class="info-label">Cash</span><span class="info-value">$${receipt.cashPayment}</span></div>` : ''}
                ${receipt.cardPayment ? `<div class="info-row"><span class="info-label">Card</span><span class="info-value">$${receipt.cardPayment}</span></div>` : ''}
                ${receipt.mobilePayment ? `<div class="info-row"><span class="info-label">Mobile</span><span class="info-value">$${receipt.mobilePayment}</span></div>` : ''}
              ` : ''}
            </div>
            
            <div class="totals">
              <div class="total-row subtotal">
                <span>Sub Total</span>
                <span>$${receipt.subtotal}</span>
              </div>
              ${receipt.tax > 0 ? `
                <div class="total-row vat">
                  <span>Vat & Tax 10%</span>
                  <span>$${receipt.tax.toFixed(2)}</span>
                </div>
              ` : ''}
              ${receipt.discount > 0 ? `
                <div class="total-row discount">
                  <span>Discount ${receipt.discountType === 'percent'
                    ? `${receipt.discountValue}%`
                    : receipt.subtotal > 0
                      ? `(${((receipt.discount / receipt.subtotal) * 100).toFixed(1)}%)`
                      : ''
                  }</span>
                  <span>- ৳${receipt.discount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-row grand">
                <span>Grand Total</span>
                <span>$${receipt.grandTotal.toFixed(2)}</span>
              </div>
              ${(receipt.paidAmount !== null && receipt.paidAmount !== undefined && receipt.posPaymentStatus !== 'PAID') ? `
                <div class="total-row" style="color:#16a34a;font-weight:700;">
                  <span>Paid</span>
                  <span>৳${receipt.paidAmount.toLocaleString()}</span>
                </div>
                ${(receipt.dueAmount ?? 0) > 0 ? `
                  <div class="total-row" style="color:#dc2626;font-weight:700;">
                    <span>Due</span>
                    <span>৳${receipt.dueAmount!.toLocaleString()}</span>
                  </div>
                ` : ''}
              ` : ''}
            </div>
            ${receipt.guarantorName ? `
              <div style="margin-top:10px;padding:8px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;">
                <div style="font-size:11px;font-weight:700;color:#92400e;margin-bottom:4px;">GUARANTOR</div>
                <div style="font-size:12px;font-weight:600;">${receipt.guarantorName}</div>
                ${receipt.guarantorPhone ? `<div style="font-size:11px;color:#555;">${receipt.guarantorPhone}</div>` : ''}
                ${receipt.guarantorRelation ? `<div style="font-size:11px;color:#777;">${receipt.guarantorRelation}</div>` : ''}
              </div>
            ` : ''}
          </div>
          
          <!-- Terms & Conditions -->
          <div class="terms-section">
            <h4>Terms & Conditions:</h4>
            <p>${invoiceSettings?.invoiceFooterText || 'Thank you for your business! All sales are final. Please keep this invoice for your records.'}</p>
          </div>
          
          <!-- Signature -->
          <div class="signature-section">
            <div class="signature-line">Chief Director</div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer-decoration"></div>
        <div class="invoice-footer">
          <div class="thank-you">Thank You for Your Business!</div>
          <div class="footer-note">We appreciate your trust in TECH HAT</div>
        </div>
      </div>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${receipt.orderNumber}</title>
          <meta charset="UTF-8">
          <style>${styles}</style>
        </head>
        <body>
          ${contentHtml}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">Sale Receipt</DialogTitle>
        {/* Success Header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-black">Sale Complete!</h2>
          <p className="text-green-100 mt-1 font-medium">Order #{receipt.orderNumber}</p>
        </div>

        {/* Receipt Preview */}
        <div ref={receiptRef} className="px-6 py-4 space-y-3 max-h-[50vh] overflow-y-auto">
          <div className="text-center text-sm text-gray-500">{receipt.date}</div>

          {(receipt.customerName || receipt.customerPhone) && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
              {receipt.customerName && <p className="font-semibold text-gray-800">{receipt.customerName}</p>}
              {receipt.customerPhone && <p className="text-gray-500">{receipt.customerPhone}</p>}
            </div>
          )}

          <div className="space-y-2">
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {item.name}{item.variantName ? ` (${item.variantName})` : ''}
                  </p>
                  <p className="text-xs text-gray-500">{item.quantity} × ৳{item.price.toLocaleString()}</p>
                </div>
                <p className="font-bold text-gray-900 shrink-0 ml-4">
                  ৳{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">৳{receipt.subtotal.toLocaleString()}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span className="font-semibold">-৳{receipt.discount.toLocaleString()}</span>
              </div>
            )}
            {receipt.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-semibold">৳{receipt.tax.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-black text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>৳{receipt.grandTotal.toLocaleString()}</span>
            </div>
            {receipt.paidAmount !== null && receipt.paidAmount !== undefined && receipt.posPaymentStatus !== 'PAID' && (
              <>
                <div className="flex justify-between text-sm text-green-700 font-semibold">
                  <span>Paid</span>
                  <span>৳{receipt.paidAmount.toLocaleString()}</span>
                </div>
                {(receipt.dueAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-red-600 font-semibold">
                    <span>Due</span>
                    <span>৳{receipt.dueAmount!.toLocaleString()}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Guarantor block */}
          {receipt.guarantorName && (
            <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-200 space-y-0.5">
              <p className="text-xs font-bold text-amber-700">Guarantor</p>
              <p className="text-sm font-semibold text-gray-800">{receipt.guarantorName}</p>
              {receipt.guarantorPhone && <p className="text-xs text-gray-600">{receipt.guarantorPhone}</p>}
              {receipt.guarantorRelation && <p className="text-xs text-gray-500">{receipt.guarantorRelation}</p>}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment</span>
              <span className="font-semibold text-gray-700">{receipt.paymentMethod}</span>
            </div>
            
            {/* Mixed Payment Breakdown */}
            {receipt.paymentMethod === 'MIXED' && (
              <>
                {receipt.cashPayment && receipt.cashPayment > 0 && (
                  <div className="flex justify-between text-xs text-gray-600 pl-4">
                    <span>• Cash</span>
                    <span className="font-semibold">৳{receipt.cashPayment.toLocaleString()}</span>
                  </div>
                )}
                {receipt.cardPayment && receipt.cardPayment > 0 && (
                  <div className="flex justify-between text-xs text-gray-600 pl-4">
                    <span>• Card</span>
                    <span className="font-semibold">৳{receipt.cardPayment.toLocaleString()}</span>
                  </div>
                )}
                {receipt.mobilePayment && receipt.mobilePayment > 0 && (
                  <div className="pl-4 space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>• Mobile Banking ({receipt.mobileProvider || 'General'})</span>
                      <span className="font-semibold">৳{receipt.mobilePayment.toLocaleString()}</span>
                    </div>
                    {(receipt.mobileNumber || receipt.mobileTrxId) && (
                      <div className="text-[10px] text-gray-400 pl-2 border-l-2 border-gray-200">
                        {receipt.mobileNumber && <p>Phone: {receipt.mobileNumber}</p>}
                        {receipt.mobileTrxId && <p>TrxID: {receipt.mobileTrxId}</p>}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Regular Payment Details */}
            {receipt.paymentMethod !== 'MIXED' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Received</span>
                <span className="font-semibold">৳{receipt.amountReceived.toLocaleString()}</span>
              </div>
            )}
            
            {receipt.change > 0 && (
              <div className="flex justify-between text-sm font-bold text-amber-700">
                <span>Change</span>
                <span>৳{receipt.change.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Button
            onClick={handlePrint}
            className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-12 rounded-xl font-bold"
          >
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
