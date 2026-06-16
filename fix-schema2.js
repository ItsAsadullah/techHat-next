const fs = require('fs');
const path = './prisma/schema.prisma';
let schema = fs.readFileSync(path, 'utf8');

// Function to replace a model completely
function replaceModel(modelName, newContent) {
  const startStr = `model ${modelName} {`;
  const startIndex = schema.indexOf(startStr);
  if (startIndex === -1) return;
  const endStr = "}";
  let bracketCount = 1;
  let endIndex = startIndex + startStr.length;
  while(bracketCount > 0 && endIndex < schema.length) {
    if (schema[endIndex] === '{') bracketCount++;
    if (schema[endIndex] === '}') bracketCount--;
    endIndex++;
  }
  schema = schema.substring(0, startIndex) + newContent + schema.substring(endIndex);
}

replaceModel('Supplier', `model Supplier {
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

  purchases         Purchase[]
  purchaseOrders    PurchaseOrder[]
  payments          SupplierPayment[]
  grns              GoodsReceiveNote[]
  supplierLedgers   SupplierLedger[]
  supplierProducts  SupplierProduct[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  @@map("suppliers")
}`);

replaceModel('Product', `model Product {
  id          String  @id @default(uuid())
  name        String
  description String? @db.Text
  categoryId  String? @map("category_id")
  brandId     String? @map("brand_id")

  type   ProductType            @default(STANDARD)
  status ProductLifecycleStatus @default(DRAFT)
  model  String?

  basePrice Float? @map("base_price")
  costPrice Float? @map("cost_price")
  lastPurchaseCost Float @default(0) @map("last_purchase_cost")

  unit          String?
  weight        Float?
  weightUnit    String? @map("weight_unit")
  isTracked     Boolean @default(true) @map("is_tracked")
  isSellable    Boolean @default(true) @map("is_sellable")
  isPurchasable Boolean @default(true) @map("is_purchasable")

  reservedStock Int @default(0) @map("reserved_stock")
  safetyStock   Int @default(0) @map("safety_stock")
  reorderQty    Int @default(0) @map("reorder_qty")
  leadTimeDays  Int @default(0) @map("lead_time_days")

  seoTitle        String? @map("seo_title")
  metaDescription String? @map("meta_description")
  tags            String[]

  specifications Json?

  category Category? @relation(fields: [categoryId], references: [id])
  brand    Brand?    @relation(fields: [brandId], references: [id])

  variants      Variant[]
  productImages ProductImage[]
  specs         ProductSpec[]

  stockAdjustments       StockAdjustmentItem[]
  stockLedgers           StockLedger[]
  goodsReceiveNoteItems  GoodsReceiveNoteItem[]
  purchaseOrderItems     PurchaseOrderItem[]
  purchaseReturnItems    PurchaseReturnItem[]
  warehouseTransferItems WarehouseTransferItem[]
  productAuditLogs       ProductAuditLog[]
  supplierProducts       SupplierProduct[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("products")
}`);

replaceModel('Category', `model Category {
  id          String  @id @default(uuid())
  name        String
  slug        String  @unique
  description String? @db.Text
  image       String?
  parentId    String? @map("parent_id")
  shortCode   String? @map("short_code")
  sortOrder   Int     @default(0) @map("sort_order")
  isActive    Boolean @default(true) @map("is_active")
  status      String? @default("ACTIVE")

  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")

  products Product[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("categories")
}`);

replaceModel('Variant', `model Variant {
  id             String  @id @default(uuid())
  productId      String  @map("product_id")
  name           String
  sku            String? @unique
  barcode        String? @unique
  price          Float
  costPrice      Float   @map("cost_price")
  lastPurchaseCost Float @default(0) @map("last_purchase_cost")
  offerPrice     Float?  @map("offer_price")
  expense        Float   @default(0)
  attributes     Json?
  image          String?
  productImageId String? @map("product_image_id")

  product Product       @relation(fields: [productId], references: [id], onDelete: Cascade)
  imageRef ProductImage? @relation(fields: [productImageId], references: [id])

  orderItems OrderItem[]

  stockAdjustments       StockAdjustmentItem[]
  stockLedgers           StockLedger[]
  goodsReceiveNoteItems  GoodsReceiveNoteItem[]
  purchaseOrderItems     PurchaseOrderItem[]
  purchaseReturnItems    PurchaseReturnItem[]
  warehouseTransferItems WarehouseTransferItem[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("product_variants")
}`);

fs.writeFileSync(path, schema);
