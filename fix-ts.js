const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const { search, replace } of replacements) {
    content = content.split(search).join(replace);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
}

// 1. ledger-viewer-actions.ts
replaceInFile('./lib/actions/ledger-viewer-actions.ts', [
  { search: 'closingQty', replace: 'balanceQty' },
  { search: 'remarks', replace: 'note' }
]);

// 2. po-actions.ts
replaceInFile('./lib/actions/po-actions.ts', [
  { search: 'productVariant: true', replace: 'variant: true' }
]);

// 3. pos-actions.ts
replaceInFile('./lib/actions/pos-actions.ts', [
  { search: 'variants: true', replace: 'variant: true' }
]);

// 4. product-enterprise-actions.ts
replaceInFile('./lib/actions/product-enterprise-actions.ts', [
  { search: 'skuSequence: true,', replace: '' },
  { search: 'isPrimary: \'desc\'', replace: 'price: \'desc\'' },
  { search: 'date: \'desc\'', replace: 'createdAt: \'desc\'' },
  { search: 'date: {', replace: 'createdAt: {' },
  { search: 'warehouse:', replace: 'warehouseId:' },
  { search: 'closingQty', replace: 'balanceQty' }
]);

// 5. product-history-actions.ts
replaceInFile('./lib/actions/product-history-actions.ts', [
  { search: 'productVariant: true', replace: 'variant: true' }
]);

// 6. purchase-return-actions.ts
replaceInFile('./lib/actions/purchase-return-actions.ts', [
  { search: 'productVariant: true', replace: 'variant: true' }
]);

// 7. receivables-actions.ts
replaceInFile('./lib/actions/receivables-actions.ts', [
  { search: 'ledgers: {', replace: 'customerLedgers: {' },
  { search: 'customer.ledgers', replace: 'customer.customerLedgers' },
  { search: 'c.ledgers', replace: 'c.customerLedgers' }
]);

// 8. reservation-actions.ts
replaceInFile('./lib/actions/reservation-actions.ts', [
  { search: 'adjustedQty: true', replace: 'quantity: true' },
  { search: 'adjustedQty', replace: 'quantity' }
]);

// 9. stock-ledger-actions.ts
replaceInFile('./lib/actions/stock-ledger-actions.ts', [
  { search: 'StockLedgerRefType', replace: 'String' } // Remove the enum if not defined
]);

// 10. transfer-actions.ts
replaceInFile('./lib/actions/transfer-actions.ts', [
  { search: 'destinationWarehouse: true', replace: 'destWarehouse: true' },
  { search: 'productVariant: true', replace: 'variant: true' },
  { search: 'transferCost', replace: 'unitCost' }
]);

// 11. warehouse-actions.ts
replaceInFile('./lib/actions/warehouse-actions.ts', [
  { search: 'date:', replace: 'createdAt:' },
  { search: 'adjustedQty: true', replace: 'quantity: true' },
  { search: 'adjustedQty', replace: 'quantity' }
]);

// 12. warehouse-analytics-actions.ts
replaceInFile('./lib/actions/warehouse-analytics-actions.ts', [
  { search: 'date:', replace: 'createdAt:' }
]);

// 13. test-e2e.ts (tests can be just commented out or ignored, but let's fix)
replaceInFile('./scripts/test-e2e.ts', [
  { search: 'systemQty:', replace: 'quantity:' },
  { search: 'openingQty:', replace: 'inQty:' }
]);

console.log('Fixed TS files');
