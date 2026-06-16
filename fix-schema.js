const fs = require('fs');

const schemaPath = './prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// 1. Update Supplier
schema = schema.replace(/model Supplier \{([\s\S]*?)@@map\("suppliers"\)\n\}/m, `model Supplier {
  id          String  @id @default(uuid())
  name        String
  supplierCode String? @unique @map("supplier_code")
  companyName String? @map("company_name")
  phone       String
  email       String?
  address     String?
  district    String?
  country     String?
  contactPerson String? @map("contact_person")
  tradeLicenseNo String? @map("trade_license_no")
  binNumber   String? @map("bin_number")
  tinNumber   String? @map("tin_number")
  notes       String? @db.Text
  status      SupplierStatus @default(ACTIVE)
  isActive    Boolean @default(true) @map("is_active")
  openingBalance Float @default(0) @map("opening_balance")

  purchases       Purchase[]
  purchaseOrders  PurchaseOrder[]
  payments        SupplierPayment[]
  grns            GoodsReceiveNote[]
  supplierLedgers SupplierLedger[]
  products        SupplierProduct[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  @@map("suppliers")
}`);

// 2. Update Product
schema = schema.replace(/model Product \{([\s\S]*?)@@map\("products"\)\n\}/m, (match, p1) => {
  let newContent = p1;
  // Add missing fields if not there
  if (!newContent.includes('lastPurchaseCost')) newContent += `  lastPurchaseCost Float @default(0) @map("last_purchase_cost")\n`;
  if (!newContent.includes('reservedStock')) newContent += `  reservedStock Int @default(0) @map("reserved_stock")\n`;
  if (!newContent.includes('safetyStock')) newContent += `  safetyStock Int @default(0) @map("safety_stock")\n`;
  if (!newContent.includes('reorderQty')) newContent += `  reorderQty Int @default(0) @map("reorder_qty")\n`;
  if (!newContent.includes('leadTimeDays')) newContent += `  leadTimeDays Int @default(0) @map("lead_time_days")\n`;
  if (!newContent.includes('seoTitle')) newContent += `  seoTitle String? @map("seo_title")\n`;
  if (!newContent.includes('metaDescription')) newContent += `  metaDescription String? @map("meta_description")\n`;
  if (!newContent.includes('tags')) newContent += `  tags String[]\n`;
  
  if (!newContent.includes('stockAdjustments')) newContent += `  stockAdjustments StockAdjustmentItem[]\n`;
  if (!newContent.includes('stockLedgers')) newContent += `  stockLedgers StockLedger[]\n`;
  if (!newContent.includes('goodsReceiveNoteItems')) newContent += `  goodsReceiveNoteItems GoodsReceiveNoteItem[]\n`;
  if (!newContent.includes('purchaseOrderItems')) newContent += `  purchaseOrderItems PurchaseOrderItem[]\n`;
  if (!newContent.includes('purchaseReturnItems')) newContent += `  purchaseReturnItems PurchaseReturnItem[]\n`;
  if (!newContent.includes('warehouseTransferItems')) newContent += `  warehouseTransferItems WarehouseTransferItem[]\n`;
  if (!newContent.includes('productAuditLogs')) newContent += `  productAuditLogs ProductAuditLog[]\n`;
  if (!newContent.includes('supplierProducts')) newContent += `  supplierProducts SupplierProduct[]\n`;

  return `model Product {${newContent}@@map("products")\n}`;
});

// 3. Update Category
schema = schema.replace(/model Category \{([\s\S]*?)@@map\("categories"\)\n\}/m, (match, p1) => {
  let newContent = p1;
  if (!newContent.includes('status')) newContent += `  status String? @default("ACTIVE")\n`;
  return `model Category {${newContent}@@map("categories")\n}`;
});

// 4. Update Variant
schema = schema.replace(/model Variant \{([\s\S]*?)@@map\("product_variants"\)\n\}/m, (match, p1) => {
  let newContent = p1;
  if (!newContent.includes('lastPurchaseCost')) newContent += `  lastPurchaseCost Float @default(0) @map("last_purchase_cost")\n`;
  
  if (!newContent.includes('stockAdjustments')) newContent += `  stockAdjustments StockAdjustmentItem[]\n`;
  if (!newContent.includes('stockLedgers')) newContent += `  stockLedgers StockLedger[]\n`;
  if (!newContent.includes('goodsReceiveNoteItems')) newContent += `  goodsReceiveNoteItems GoodsReceiveNoteItem[]\n`;
  if (!newContent.includes('purchaseOrderItems')) newContent += `  purchaseOrderItems PurchaseOrderItem[]\n`;
  if (!newContent.includes('purchaseReturnItems')) newContent += `  purchaseReturnItems PurchaseReturnItem[]\n`;
  if (!newContent.includes('warehouseTransferItems')) newContent += `  warehouseTransferItems WarehouseTransferItem[]\n`;

  return `model Variant {${newContent}@@map("product_variants")\n}`;
});

// Enums
const enumsToAdd = `
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
`;

// Models
const modelsToAdd = `
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
`;

if (!schema.includes('enum WarehouseType')) {
  schema += '\\n' + enumsToAdd + '\\n' + modelsToAdd;
}

fs.writeFileSync(schemaPath, schema);
console.log("Schema updated.");
