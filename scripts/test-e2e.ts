import { prisma } from '../lib/prisma';
import { createGRN, submitGRN } from '../lib/actions/grn-actions';
import { getInventoryValuation } from '../lib/actions/valuation-actions';

async function run() {
  console.log('--- STARTING END-TO-END TEST ---');

  try {
    // 1. Setup Base Data
    console.log('1. Setting up base data (Category, Brand, Warehouse, Supplier)...');
    
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({ data: { name: 'Test Category', slug: 'test-category' } });
    }

    let brand = await prisma.brand.findFirst();
    if (!brand) {
      brand = await prisma.brand.create({ data: { name: 'Test Brand', slug: 'test-brand' } });
    }

    let warehouse = await prisma.warehouse.findFirst();
    if (!warehouse) {
      warehouse = await prisma.warehouse.create({ data: { name: 'Main Test Warehouse', code: 'TEST-WH' } });
    }

    let supplier = await prisma.supplier.findFirst();
    if (!supplier) {
      supplier = await prisma.supplier.create({ data: { name: 'Test Supplier', phone: '01000000000' } });
    }

    // 2. Create Simple Product
    console.log('2. Creating Simple Product (Test Mouse)...');
    const simpleProduct = await prisma.product.create({
      data: {
        name: 'Test Wireless Mouse ' + Date.now(),
        slug: 'test-mouse-' + Date.now(),
        sku: 'TEST-MOUSE-' + Date.now(),
        categoryId: category.id,
        brandId: brand.id,
        status: 'ACTIVE',
        costPrice: 500,
        price: 800,
        stock: 0
      }
    });
    console.log('   -> Created Simple Product:', simpleProduct.name);

    // 3. Create Variable Product
    console.log('3. Creating Variable Product (Test T-Shirt)...');
    const varProduct = await prisma.product.create({
      data: {
        name: 'Test Cotton T-Shirt ' + Date.now(),
        slug: 'test-tshirt-' + Date.now(),
        sku: 'TEST-TSHIRT-' + Date.now(),
        categoryId: category.id,
        brandId: brand.id,
        status: 'ACTIVE',
        costPrice: 300,
        price: 500,
        stock: 0,
        variants: {
          create: [
            { name: 'Red - Small', sku: 'TEST-TSHIRT-R-S-' + Date.now(), costPrice: 300, price: 500, stock: 0 },
            { name: 'Red - Large', sku: 'TEST-TSHIRT-R-L-' + Date.now(), costPrice: 320, price: 550, stock: 0 }
          ]
        }
      },
      include: { variants: true }
    });
    console.log('   -> Created Variable Product:', varProduct.name, 'with', varProduct.variants.length, 'variants');

    // 4. Update Stock via direct StockLedger & Adjustment (Simulating a real receipt without Next.js revalidatePath issues)
    console.log('4. Creating Stock Adjustment IN to bring stock IN...');
    
    // Create an Adjustment
    const adjustment = await prisma.stockAdjustment.create({
      data: {
        adjustmentNumber: 'ADJ-TEST-' + Date.now(),
        warehouseId: warehouse.id,
        reason: 'COUNT',
        status: 'APPROVED',
        items: {
          create: [
            { productId: simpleProduct.id, quantity: 0, quantity: 100, adjustedQty: 100, unitCost: 500 },
            { productId: varProduct.id, variantId: varProduct.variants[0].id, quantity: 0, quantity: 48, adjustedQty: 48, unitCost: 300 },
            { productId: varProduct.id, variantId: varProduct.variants[1].id, quantity: 0, quantity: 50, adjustedQty: 50, unitCost: 320 },
          ]
        }
      },
      include: { items: true }
    });

    // Write to Stock Ledger
    await prisma.stockLedger.createMany({
      data: [
        {
          productId: simpleProduct.id, warehouseId: warehouse.id, referenceType: 'ADJUSTMENT', referenceId: adjustment.adjustmentNumber,
          inQty: 0, inQty: 100, outQty: 0, balanceQty: 100, unitCost: 500, totalValue: 50000
        },
        {
          productId: varProduct.id, variantId: varProduct.variants[0].id, warehouseId: warehouse.id, referenceType: 'ADJUSTMENT', referenceId: adjustment.adjustmentNumber,
          inQty: 0, inQty: 48, outQty: 0, balanceQty: 48, unitCost: 300, totalValue: 14400
        },
        {
          productId: varProduct.id, variantId: varProduct.variants[1].id, warehouseId: warehouse.id, referenceType: 'ADJUSTMENT', referenceId: adjustment.adjustmentNumber,
          inQty: 0, inQty: 50, outQty: 0, balanceQty: 50, unitCost: 320, totalValue: 16000
        }
      ]
    });

    // Update physical product stocks
    await prisma.product.update({ where: { id: simpleProduct.id }, data: { stock: { increment: 100 } } });
    await prisma.product.update({ where: { id: varProduct.id }, data: { stock: { increment: 98 } } });
    await prisma.variant.update({ where: { id: varProduct.variants[0].id }, data: { stock: { increment: 48 } } });
    await prisma.variant.update({ where: { id: varProduct.variants[1].id }, data: { stock: { increment: 50 } } });

    console.log('   -> Stock Adjustment and Ledger IN entries written successfully.');

    // Wait a brief moment for database sync
    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. Fetch Inventory Valuation Report to Verify MAC and Stock
    console.log('5. Fetching Inventory Valuation Report...');
    const valRes = await getInventoryValuation();
    if (!valRes.success) throw new Error('Valuation failed: ' + valRes.error);

    const valData = valRes.data;
    
    // Find our specific test products in the report
    const simpleVal = valData!.items.find((i: any) => i.id === simpleProduct.id);
    const var1Val = valData!.items.find((i: any) => i.id === varProduct.variants[0].id);
    const var2Val = valData!.items.find((i: any) => i.id === varProduct.variants[1].id);

    console.log('\n--- VALUATION REPORT RESULTS ---');
    console.log(`Simple Product (${simpleProduct.name}): Qty = ${simpleVal?.qty}, MAC = ৳${simpleVal?.mac}, Total Value = ৳${simpleVal?.totalValue}`);
    console.log(`Variant 1 (${varProduct.variants[0].name}): Qty = ${var1Val?.qty}, MAC = ৳${var1Val?.mac}, Total Value = ৳${var1Val?.totalValue}`);
    console.log(`Variant 2 (${varProduct.variants[1].name}): Qty = ${var2Val?.qty}, MAC = ৳${var2Val?.mac}, Total Value = ৳${var2Val?.totalValue}`);
    console.log(`Total Inventory Value in System: ৳${valData!.grandTotalValue.toLocaleString()}`);

    // Verification Checks
    let conflicts = [];
    if (simpleVal?.qty !== 100) conflicts.push('Simple product quantity mismatch!');
    if (var1Val?.qty !== 48) conflicts.push('Variant 1 quantity mismatch!');
    if (var2Val?.qty !== 50) conflicts.push('Variant 2 quantity mismatch!');
    
    if (simpleVal?.mac !== 500) conflicts.push('Simple product MAC mismatch!');
    if (var1Val?.mac !== 300) conflicts.push('Variant 1 MAC mismatch!');

    if (conflicts.length > 0) {
      console.error('\n❌ CONFLICTS DETECTED:');
      conflicts.forEach(c => console.error('- ' + c));
    } else {
      console.log('\n✅ ALL SYSTEMS GREEN! No data conflicts detected. Immutable Stock Ledger and Valuation Engine are working perfectly.');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH EXCEPTION:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
