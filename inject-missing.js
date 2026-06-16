const fs = require('fs');
const path = './prisma/schema.prisma';
let schema = fs.readFileSync(path, 'utf8');

function injectIntoModel(modelName, newFields, checkStr) {
  const mapRegex = new RegExp(`(model\\s+${modelName}\\s+\\{[\\s\\S]*?)(@@map\\(.*\\)[\\s\\S]*?\\})`);
  schema = schema.replace(mapRegex, (match, p1, p2) => {
    if (match.includes(checkStr)) return match;
    return p1 + newFields + '\n  ' + p2;
  });
}

const supplierFields = `
  supplierCode      String? @unique @map("supplier_code")
  email             String?
  district          String?
  country           String?
  contactPerson     String? @map("contact_person")
  tradeLicenseNo    String? @map("trade_license_no")
  binNumber         String? @map("bin_number")
  tinNumber         String? @map("tin_number")
  status            SupplierStatus @default(ACTIVE)
  openingBalance    Float @default(0) @map("opening_balance")
  purchaseOrders    PurchaseOrder[]
  grns              GoodsReceiveNote[]
  supplierLedgers   SupplierLedger[]
  supplierProducts  SupplierProduct[]`;

const productFields = `
  lastPurchaseCost       Float @default(0) @map("last_purchase_cost")
  reservedStock          Int @default(0) @map("reserved_stock")
  safetyStock            Int @default(0) @map("safety_stock")
  reorderQty             Int @default(0) @map("reorder_qty")
  leadTimeDays           Int @default(0) @map("lead_time_days")
  seoTitle               String? @map("seo_title")
  metaDescription        String? @map("meta_description")
  tags                   String[]
  stockAdjustments       StockAdjustmentItem[]
  stockLedgers           StockLedger[]
  goodsReceiveNoteItems  GoodsReceiveNoteItem[]
  purchaseOrderItems     PurchaseOrderItem[]
  purchaseReturnItems    PurchaseReturnItem[]
  warehouseTransferItems WarehouseTransferItem[]
  productAuditLogs       ProductAuditLog[]
  supplierProducts       SupplierProduct[]`;

const categoryFields = `
  status String? @default("ACTIVE")`;

const variantFields = `
  lastPurchaseCost       Float @default(0) @map("last_purchase_cost")
  stockAdjustments       StockAdjustmentItem[]
  stockLedgers           StockLedger[]
  goodsReceiveNoteItems  GoodsReceiveNoteItem[]
  purchaseOrderItems     PurchaseOrderItem[]
  purchaseReturnItems    PurchaseReturnItem[]
  warehouseTransferItems WarehouseTransferItem[]`;

injectIntoModel('Supplier', supplierFields, 'supplierCode');
injectIntoModel('Product', productFields, 'lastPurchaseCost');
injectIntoModel('Category', categoryFields, 'status String?');
injectIntoModel('Variant', variantFields, 'lastPurchaseCost');

// Missing Enums and Models
const enumsAndModels = `
enum SupplierStatus {
  ACTIVE
  INACTIVE
  BLOCKED
}

enum WarehouseType {
  MAIN
  STORE
  TRANSIT
  DAMAGE
}

enum StockAdjustmentReason {
  DAMAGE
  COUNT
  THEFT
  EXPIRED
}

enum StockAdjustmentStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
}

enum TransferStatus {
  DRAFT
  APPROVED
  IN_TRANSIT
  RECEIVED
  CANCELLED
}

enum GRNStatus {
  DRAFT
  RECEIVED
  REJECTED
  PARTIAL
}

enum PurchaseOrderStatus {
  DRAFT
  SUBMITTED
  APPROVED
  PARTIALLY_RECEIVED
  RECEIVED
  CLOSED
  CANCELLED
}

enum PurchaseReturnStatus {
  DRAFT
  APPROVED
  RETURNED
  CLOSED
  CANCELLED
}

// --------------------------------------
// WAREHOUSE & INVENTORY
// --------------------------------------

model Warehouse {
  id        String   @id @default(uuid())
  name      String
  code      String   @unique
  type      WarehouseType @default(MAIN)
  address   String?
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  stockAdjustments  StockAdjustment[]
  stockLedgers      StockLedger[]
  goodsReceiveNotes GoodsReceiveNote[]
  purchaseOrders    PurchaseOrder[]
  purchaseReturns   PurchaseReturn[]
  transfersFrom     WarehouseTransfer[] @relation("warehouseTransfersSourceIdToWarehouse")
  transfersTo       WarehouseTransfer[] @relation("warehouseTransfersDestinationIdToWarehouse")

  @@map("warehouses")
}

model StockAdjustment {
  id               String   @id @default(uuid())
  adjustmentNumber String   @unique @map("adjustment_number")
  date             DateTime @default(now())
  warehouseId      String   @map("warehouse_id")
  reason           StockAdjustmentReason
  status           StockAdjustmentStatus @default(DRAFT)
  note             String?
  approvedBy       String?  @map("approved_by")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @default(now()) @updatedAt @map("updated_at")

  warehouse Warehouse             @relation(fields: [warehouseId], references: [id])
  items     StockAdjustmentItem[]

  @@map("stock_adjustments")
}

model StockAdjustmentItem {
  id                String   @id @default(uuid())
  stockAdjustmentId String   @map("stock_adjustment_id")
  productId         String   @map("product_id")
  variantId         String?  @map("variant_id")
  quantity          Int
  unitCost          Float    @default(0) @map("unit_cost")
  createdAt         DateTime @default(now()) @map("created_at")

  stockAdjustment StockAdjustment @relation(fields: [stockAdjustmentId], references: [id], onDelete: Cascade)
  product         Product         @relation(fields: [productId], references: [id])
  variant         Variant?        @relation(fields: [variantId], references: [id])

  @@map("stock_adjustment_items")
}

model StockLedger {
  id             String   @id @default(uuid())
  warehouseId    String   @map("warehouse_id")
  productId      String   @map("product_id")
  variantId      String?  @map("variant_id")
  inQty          Int      @default(0) @map("in_qty")
  outQty         Int      @default(0) @map("out_qty")
  balanceQty     Int      @map("balance_qty")
  unitCost       Float    @default(0) @map("unit_cost")
  totalValue     Float    @default(0) @map("total_value")
  referenceType  String   @map("reference_type")
  referenceId    String   @map("reference_id")
  note           String?
  createdAt      DateTime @default(now()) @map("created_at")

  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  product   Product   @relation(fields: [productId], references: [id])
  variant   Variant?  @relation(fields: [variantId], references: [id])

  @@map("stock_ledgers")
}

model WarehouseTransfer {
  id              String   @id @default(uuid())
  transferNumber  String   @unique @map("transfer_number")
  date            DateTime @default(now())
  sourceId        String   @map("source_id")
  destinationId   String   @map("destination_id")
  status          TransferStatus @default(DRAFT)
  note            String?
  dispatchedBy    String?  @map("dispatched_by")
  receivedBy      String?  @map("received_by")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at")

  sourceWarehouse Warehouse @relation("warehouseTransfersSourceIdToWarehouse", fields: [sourceId], references: [id])
  destWarehouse   Warehouse @relation("warehouseTransfersDestinationIdToWarehouse", fields: [destinationId], references: [id])
  items           WarehouseTransferItem[]

  @@map("warehouse_transfers")
}

model WarehouseTransferItem {
  id                  String   @id @default(uuid())
  warehouseTransferId String   @map("warehouse_transfer_id")
  productId           String   @map("product_id")
  variantId           String?  @map("variant_id")
  quantity            Int
  unitCost            Float    @default(0) @map("unit_cost")
  createdAt           DateTime @default(now()) @map("created_at")

  warehouseTransfer WarehouseTransfer @relation(fields: [warehouseTransferId], references: [id], onDelete: Cascade)
  product           Product           @relation(fields: [productId], references: [id])
  variant           Variant?          @relation(fields: [variantId], references: [id])

  @@map("warehouse_transfer_items")
}

model GoodsReceiveNote {
  id                String   @id @default(uuid())
  grnNumber         String   @unique @map("grn_number")
  purchaseOrderId   String   @map("purchase_order_id")
  supplierId        String   @map("supplier_id")
  warehouseId       String   @map("warehouse_id")
  receivedDate      DateTime @default(now()) @map("received_date")
  status            GRNStatus @default(DRAFT)
  note              String?
  attachment        String?
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @default(now()) @updatedAt @map("updated_at")

  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  supplier      Supplier      @relation(fields: [supplierId], references: [id])
  warehouse     Warehouse     @relation(fields: [warehouseId], references: [id])
  items         GoodsReceiveNoteItem[]

  @@map("goods_receive_notes")
}

model GoodsReceiveNoteItem {
  id            String   @id @default(uuid())
  grnId         String   @map("grn_id")
  productId     String   @map("product_id")
  variantId     String?  @map("variant_id")
  receivedQty   Int      @map("received_qty")
  rejectedQty   Int      @default(0) @map("rejected_qty")
  acceptedQty   Int      @map("accepted_qty")
  unitCost      Float    @default(0) @map("unit_cost")
  batchNumber   String?  @map("batch_number")
  imei          String?
  serialNumber  String?  @map("serial_number")
  createdAt     DateTime @default(now()) @map("created_at")

  goodsReceiveNote GoodsReceiveNote @relation(fields: [grnId], references: [id], onDelete: Cascade)
  product          Product          @relation(fields: [productId], references: [id])
  variant          Variant?         @relation(fields: [variantId], references: [id])

  @@map("goods_receive_note_items")
}

model PurchaseOrder {
  id                   String   @id @default(uuid())
  poNumber             String   @unique @map("po_number")
  supplierId           String   @map("supplier_id")
  warehouseId          String?  @map("warehouse_id")
  date                 DateTime @default(now())
  expectedDeliveryDate DateTime? @map("expected_delivery_date")
  totalAmount          Float    @default(0) @map("total_amount")
  discount             Float    @default(0)
  tax                  Float    @default(0)
  shippingCost         Float    @default(0) @map("shipping_cost")
  otherCost            Float    @default(0) @map("other_cost")
  grandTotal           Float    @default(0) @map("grand_total")
  status               PurchaseOrderStatus @default(DRAFT)
  note                 String?
  attachment           String?
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @default(now()) @updatedAt @map("updated_at")

  supplier          Supplier              @relation(fields: [supplierId], references: [id])
  warehouse         Warehouse?            @relation(fields: [warehouseId], references: [id])
  items             PurchaseOrderItem[]
  goodsReceiveNotes GoodsReceiveNote[]
  purchaseReturns   PurchaseReturn[]

  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id               String   @id @default(uuid())
  purchaseOrderId  String   @map("purchase_order_id")
  productId        String   @map("product_id")
  variantId        String?  @map("variant_id")
  quantity         Int
  receivedQty      Int      @default(0) @map("received_qty")
  unitCost         Float    @map("unit_cost")
  discount         Float    @default(0)
  tax              Float    @default(0)
  subtotal         Float
  createdAt        DateTime @default(now()) @map("created_at")

  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  product       Product       @relation(fields: [productId], references: [id])
  variant       Variant?      @relation(fields: [variantId], references: [id])

  @@map("purchase_order_items")
}

model PurchaseReturn {
  id              String   @id @default(uuid())
  returnNumber    String   @unique @map("return_number")
  supplierId      String   @map("supplier_id")
  purchaseOrderId String   @map("purchase_order_id")
  warehouseId     String   @map("warehouse_id")
  date            DateTime @default(now())
  status          PurchaseReturnStatus @default(DRAFT)
  reason          String?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at")

  supplier      Supplier             @relation(fields: [supplierId], references: [id])
  purchaseOrder PurchaseOrder        @relation(fields: [purchaseOrderId], references: [id])
  warehouse     Warehouse            @relation(fields: [warehouseId], references: [id])
  items         PurchaseReturnItem[]

  @@map("purchase_returns")
}

model PurchaseReturnItem {
  id               String   @id @default(uuid())
  purchaseReturnId String   @map("purchase_return_id")
  productId        String   @map("product_id")
  variantId        String?  @map("variant_id")
  returnQty        Int      @map("return_qty")
  unitCost         Float    @map("unit_cost")

  purchaseReturn PurchaseReturn @relation(fields: [purchaseReturnId], references: [id], onDelete: Cascade)
  product        Product        @relation(fields: [productId], references: [id])
  variant        Variant?       @relation(fields: [variantId], references: [id])

  @@map("purchase_return_items")
}

model SupplierLedger {
  id             String   @id @default(uuid())
  supplierId     String   @map("supplier_id")
  type           String
  debit          Float    @default(0)
  credit         Float    @default(0)
  runningBalance Float    @map("running_balance")
  referenceId    String?  @map("reference_id")
  note           String?
  date           DateTime @default(now())
  createdAt      DateTime @default(now()) @map("created_at")

  supplier Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)

  @@index([supplierId])
  @@map("supplier_ledgers")
}

model SupplierProduct {
  id         String   @id @default(uuid())
  supplierId String   @map("supplier_id")
  productId  String   @map("product_id")
  price      Float    @default(0)
  createdAt  DateTime @default(now()) @map("created_at")

  supplier Supplier @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  product  Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([supplierId, productId])
  @@map("supplier_products")
}

model ProductAuditLog {
  id            String   @id @default(uuid())
  productId     String   @map("product_id")
  action        String
  changedBy     String?  @map("changed_by")
  changedFields Json?    @map("changed_fields")
  note          String?
  createdAt     DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId, createdAt])
  @@map("product_audit_logs")
}

model Customer {
  id            String   @id @default(uuid())
  customerCode  String   @unique @map("customer_code")
  name          String
  phone         String?
  email         String?
  address       String?
  companyName   String?  @map("company_name")
  taxId         String?  @map("tax_id")
  customerGroup String   @default("RETAIL") @map("customer_group")
  openingBalance Float   @default(0) @map("opening_balance")
  balance       Float    @default(0)
  creditLimit   Float    @default(0) @map("credit_limit")
  status        String   @default("ACTIVE")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at")

  customerLedgers CustomerLedger[]
  orders          Order[]

  @@map("customers")
}

model CustomerLedger {
  id             String   @id @default(uuid())
  customerId     String   @map("customer_id")
  type           String
  debit          Float    @default(0)
  credit         Float    @default(0)
  runningBalance Float    @map("running_balance")
  referenceId    String?  @map("reference_id")
  note           String?
  date           DateTime @default(now())
  
  customer       Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([customerId])
  @@map("customer_ledgers")
}

// --------------------------------------
// ACCOUNTING
// --------------------------------------

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
  COGS
}

model FiscalYear {
  id        String   @id @default(uuid())
  name      String   @unique
  startDate DateTime @map("start_date")
  endDate   DateTime @map("end_date")
  isClosed  Boolean  @default(false) @map("is_closed")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  periods AccountingPeriod[]

  @@map("fiscal_years")
}

model AccountingPeriod {
  id           String   @id @default(uuid())
  fiscalYearId String   @map("fiscal_year_id")
  name         String
  startDate    DateTime @map("start_date")
  endDate      DateTime @map("end_date")
  isClosed     Boolean  @default(false) @map("is_closed")
  createdAt    DateTime @default(now()) @map("created_at")

  fiscalYear     FiscalYear     @relation(fields: [fiscalYearId], references: [id])
  journalEntries JournalEntry[]

  @@map("accounting_periods")
}

model ChartOfAccount {
  id                String             @id @default(uuid())
  code              String             @unique
  name              String
  type              AccountType
  isSystem          Boolean            @default(false) @map("is_system")
  balance           Float              @default(0)
  journalEntryItems JournalEntryItem[]

  @@map("chart_of_accounts")
}

model JournalEntry {
  id                 String   @id @default(uuid())
  entryNumber        String   @unique @map("entry_number")
  date               DateTime @default(now())
  reference          String?
  note               String?
  accountingPeriodId String?  @map("accounting_period_id")

  accountingPeriod  AccountingPeriod?  @relation(fields: [accountingPeriodId], references: [id])
  journalEntryItems JournalEntryItem[]

  createdAt DateTime @default(now()) @map("created_at")

  @@map("journal_entries")
}

model JournalEntryItem {
  id             String         @id @default(uuid())
  journalEntryId String         @map("journal_entry_id")
  accountId      String         @map("account_id")
  debit          Float          @default(0)
  credit         Float          @default(0)
  description    String?

  journalEntry   JournalEntry   @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  chartOfAccount ChartOfAccount @relation(fields: [accountId], references: [id])

  @@map("journal_entry_items")
}
`;

if (!schema.includes('enum WarehouseType')) {
  schema += '\n' + enumsAndModels;
}

// Inject CustomerLedger into Customer
schema = schema.replace(/(model\\s+Customer\\s+\\{[\\s\\S]*?)(@@map\\(.*\\)[\\s\\S]*?\\})/, (match, p1, p2) => {
  if (match.includes('customerLedgers')) return match;
  return p1 + '\n  customerLedgers CustomerLedger[]\n  ' + p2;
});

fs.writeFileSync(path, schema);
