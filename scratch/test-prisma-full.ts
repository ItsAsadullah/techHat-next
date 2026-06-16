import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.product.update({
      where: { id: "1b402157-be8b-4afc-a2c8-36c4e78fb36e" },
      data: {
        name: "Test Variable Product",
        categoryId: "b6838022-5a47-4fb8-b5c1-428b2a67ef59",
        brandId: null,
        productVariantType: "variable",
        price: 2000,
        offerPrice: null,
        onlinePrice: null,
        wholesalePrice: null,
        taxClass: null,
        trackInventory: true,
        trackSerials: false,
        trackExpiry: false,
        trackBatch: false,
        trackWarranty: false,
        minStock: 5,
        reorderPoint: 10,
        description: "",
        shortDesc: null,
        isFlashSale: false,
        isFeatured: false,
        isBestSeller: false,
        unit: "pc",
        warrantyMonths: 0,
        warrantyType: null,
        videoUrl: null,
        model: null,
        sku: "SKU-VAR-1781448478806",
        barcode: null,
        attributes: [
          { id: "0c8ly7mud", name: "", values: [] },
          { id: "c5my2vy9k", name: "", values: [] }
        ],
        status: "DRAFT",
      } as any
    });
    console.log("Success");
  } catch (err: any) {
    console.error(err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
