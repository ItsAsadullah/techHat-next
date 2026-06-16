const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../app/admin/pos/pos-client.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Remove dynamic import for POSReceipt and add static import
content = content.replace(
  "const POSReceipt = dynamic(() => import('@/components/admin/pos/pos-receipt').then(m => ({ default: m.POSReceipt })), { ssr: false });",
  "import { POSReceipt } from '@/components/admin/pos/pos-receipt';"
);

// 2. Add delay before completeSale to allow React to paint the popup
content = content.replace(
  "setReceiptStatus('processing');\n      setShowReceipt(true);\n\n      const result = await completeSale(input);",
  "setReceiptStatus('processing');\n      setShowReceipt(true);\n\n      // Force React to paint the UI before blocking the thread with Server Action payload serialization\n      await new Promise(resolve => setTimeout(resolve, 50));\n\n      const result = await completeSale(input);"
);

fs.writeFileSync(targetFile, content);
console.log('Fixed delay successfully');
