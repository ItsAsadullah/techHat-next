export const transferTransitions: Record<string, readonly string[]> = {
  DRAFT: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['RECEIVED'],
  RECEIVED: [],
  CANCELLED: [],
};

export function assertTransferTransition(current: string, next: string) {
  if (!transferTransitions[current]?.includes(next)) {
    throw new Error(`Cannot change ${current.replaceAll('_', ' ')} to ${next.replaceAll('_', ' ')}. Refresh and follow the transfer steps.`);
  }
}

export function assertInventoryItems(items: { productId: string; variantId?: string | null }[]) {
  if (!items.length || items.length > 200) throw new Error('Add between 1 and 200 items.');
  const keys = new Set<string>();
  for (const item of items) {
    if (!item.productId) throw new Error('Select a product for every item.');
    const key = `${item.productId}:${item.variantId || ''}`;
    if (keys.has(key)) throw new Error('Each product / variant can appear only once.');
    keys.add(key);
  }
}

export function assertQuantity(value: number, label: string, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum || value > 2147483647) {
    throw new Error(`${label} must be a whole number of at least ${minimum}.`);
  }
}

export function adjustmentVariance(systemQty: number, actualQty: number, reason: string) {
  assertQuantity(systemQty, 'System quantity');
  assertQuantity(actualQty, 'Counted quantity');
  if (!['COUNT', 'DAMAGE', 'THEFT', 'EXPIRED'].includes(reason)) throw new Error('Select a valid adjustment reason.');
  const variance = actualQty - systemQty;
  if (reason !== 'COUNT' && variance > 0) throw new Error('Damage, loss and expiry can only reduce stock. Enter the remaining usable quantity.');
  return variance;
}
