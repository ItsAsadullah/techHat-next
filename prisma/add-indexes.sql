-- Performance indexes for Product table
CREATE INDEX IF NOT EXISTS "products_categoryId_isActive_idx" ON "products" ("categoryId", "isActive");
CREATE INDEX IF NOT EXISTS "products_isActive_isFlashSale_idx" ON "products" ("isActive", "isFlashSale");
CREATE INDEX IF NOT EXISTS "products_isActive_is_best_seller_idx" ON "products" ("isActive", "is_best_seller");
CREATE INDEX IF NOT EXISTS "products_isActive_isFeatured_idx" ON "products" ("isActive", "isFeatured");
CREATE INDEX IF NOT EXISTS "products_isActive_sold_count_idx" ON "products" ("isActive", "sold_count");
CREATE INDEX IF NOT EXISTS "products_isActive_view_count_idx" ON "products" ("isActive", "view_count");
CREATE INDEX IF NOT EXISTS "products_isActive_createdAt_idx" ON "products" ("isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "products_brandId_idx" ON "products" ("brandId");
CREATE INDEX IF NOT EXISTS "products_isActive_price_idx" ON "products" ("isActive", "price");
CREATE INDEX IF NOT EXISTS "products_isActive_offerPrice_idx" ON "products" ("isActive", "offerPrice");

-- Performance indexes for ProductImage table
CREATE INDEX IF NOT EXISTS "product_images_product_id_display_order_idx" ON "product_images" ("product_id", "display_order");
CREATE INDEX IF NOT EXISTS "product_images_product_id_is_thumbnail_idx" ON "product_images" ("product_id", "is_thumbnail");

-- Performance indexes for Category table
CREATE INDEX IF NOT EXISTS "categories_parentId_isActive_idx" ON "categories" ("parentId", "isActive");
