const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../components/admin/pos/pos-receipt.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update imports
content = content.replace(
  "import { Printer, X, CheckCircle2, Download } from 'lucide-react';",
  "import { Printer, X, CheckCircle2, Download, Loader2, AlertCircle, RefreshCw } from 'lucide-react';"
);

// 2. Update Props
content = content.replace(
  `interface POSReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
  invoiceSettings?: InvoiceSettings;
}`,
  `interface POSReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
  invoiceSettings?: InvoiceSettings;
  status?: 'processing' | 'success' | 'error';
  errorMessage?: string;
  onRetry?: () => void;
}`
);

// 3. Update component signature
content = content.replace(
  `export function POSReceipt({ isOpen, onClose, receipt, invoiceSettings }: POSReceiptProps) {`,
  `export function POSReceipt({ isOpen, onClose, receipt, invoiceSettings, status = 'success', errorMessage, onRetry }: POSReceiptProps) {`
);

// 4. Block print
content = content.replace(
  `  const handlePrint = () => {`,
  `  const handlePrint = () => {\n    if (status !== 'success') return;`
);

// 5. Update Header UI
const oldHeader = `        <DialogTitle className="sr-only">Sale Receipt</DialogTitle>
        {/* Success Header */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-black">Sale Complete!</h2>
          <p className="text-green-100 mt-1 font-medium">Order #{receipt.orderNumber}</p>
        </div>`;

const newHeader = `        <DialogTitle className="sr-only">Sale Receipt</DialogTitle>
        {/* Status Header */}
        {status === 'processing' && (
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            </div>
            <h2 className="text-2xl font-black">Processing Sale...</h2>
            <p className="text-blue-100 mt-1 font-medium">Generating Invoice...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-black">Sale Complete!</h2>
            <p className="text-green-100 mt-1 font-medium">Order #{receipt.orderNumber}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-black">Sale Failed</h2>
            <p className="text-red-100 mt-1 font-medium">{errorMessage || 'Something went wrong. Please try again.'}</p>
          </div>
        )}`;

content = content.replace(oldHeader, newHeader);

// 6. Update Buttons
const oldButtons = `        {/* Actions */}
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
        </div>`;

const newButtons = `        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {status === 'error' ? (
            <Button
              onClick={onRetry}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Checkout
            </Button>
          ) : (
            <Button
              onClick={handlePrint}
              disabled={status === 'processing'}
              className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-xl font-bold"
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={onClose}
            variant="outline"
            disabled={status === 'processing'}
            className="flex-1 h-12 rounded-xl font-bold"
          >
            {status === 'error' ? 'Cancel' : 'New Sale'}
          </Button>
        </div>`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync(targetFile, content);
console.log('Updated pos-receipt.tsx successfully');
