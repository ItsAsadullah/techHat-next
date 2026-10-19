# Inventory operations

## Transfers

- Draft: save a route and quantities; no stock is reserved or moved.
- Approved: reserve the items against further transfers and customer availability.
- In transit: dispatch writes a source warehouse OUT movement. Owned stock is unchanged and stays reserved until receipt.
- Received: confirm the full quantity was checked at the destination; write an IN movement and release the reservation. No new purchase or global stock is created.
- Cancel: permitted before dispatch and releases reservations. Dispatched transfers cannot be cancelled as if the goods were still at the source.

Partial receipts and transit discrepancies are not recorded by this workflow. Keep the transfer in transit while resolving shortages; do not confirm a full receipt that did not happen. Older in-transit transfers without a dispatch ledger are posted atomically on receipt after checking source availability.

## Counts and adjustments

Select an active warehouse, search by product or variant SKU, and enter the counted usable quantity. Damage, theft and expiry can only reduce stock. A note is required. Save the server-verified system count, actual count, variance and current cost as a draft. Approval checks that the stock has not moved since the draft and that reductions do not consume reserved quantities. Stale drafts should be rejected and counted again. Approved adjustments remain immutable.

## Deployment

The additive migration `prisma/migrations/20261019_inventory_count_snapshots/migration.sql` adds nullable `system_qty` and `actual_qty` columns to `stock_adjustment_items`. Apply it through the project's database release process before deploying this code, then generate the Prisma client. Historical approved entries retain their variance; absent count snapshots display as a dash. Older drafts must be rejected and recounted.

Do not use the existing `npm run build` script for validation: it includes `prisma db push --accept-data-loss`. Use `npx prisma generate`, `npx tsc --noEmit`, `npx tsx --test tests/inventory.test.ts`, and `npx next build` instead.

This change prevents future reservation synchronization from overwriting physical stock. It does not reconstruct physical stock already damaged by that historical bug. Compare product caches, warehouse ledgers and a physical count before correcting historical discrepancies. Product ownership includes goods in transit; warehouse balances exclude dispatched goods.

Stock actions check authenticated staff access, validate product/variant ownership and active locations, and execute in serializable transactions with bounded retries. Reference numbers use a date and random suffix rather than row counts. Failed actions do not commit partial stock movements.
