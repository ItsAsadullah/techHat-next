import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BRAND_LIST = [
  { name: 'Apple',    slug: 'apple',    isFeatured: true  },
  { name: 'Samsung',  slug: 'samsung',  isFeatured: true  },
  { name: 'Sony',     slug: 'sony',     isFeatured: true  },
  { name: 'Dell',     slug: 'dell',     isFeatured: true  },
  { name: 'HP',       slug: 'hp',       isFeatured: true  },
  { name: 'Lenovo',   slug: 'lenovo',   isFeatured: true  },
  { name: 'ASUS',     slug: 'asus',     isFeatured: true  },
  { name: 'Logitech', slug: 'logitech', isFeatured: false },
  { name: 'Razer',    slug: 'razer',    isFeatured: false },
  { name: 'Xiaomi',   slug: 'xiaomi',   isFeatured: true  },
  { name: 'OnePlus',  slug: 'oneplus',  isFeatured: false },
  { name: 'JBL',      slug: 'jbl',      isFeatured: false },
  { name: 'TP-Link',  slug: 'tp-link',  isFeatured: false },
  { name: 'Nikon',    slug: 'nikon',    isFeatured: false },
  { name: 'Canon',    slug: 'canon',    isFeatured: false },
  { name: 'Anker',    slug: 'anker',    isFeatured: false },
];

const PRODUCTS = [
  // ── Smartphones ──────────────────────────────────────────────────────────
  {
    name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra', brandSlug: 'samsung',
    specifications: { 'Display': '6.8" AMOLED 120Hz', 'Processor': 'Snapdragon 8 Gen 3', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '200MP+12MP+10MP+10MP', 'Battery': '5000mAh', 'OS': 'Android 14' },
  },
  {
    name: 'Apple iPhone 16 Pro Max', slug: 'apple-iphone-16-pro-max', brandSlug: 'apple',
    specifications: { 'Display': '6.9" Super Retina XDR ProMotion', 'Chip': 'A18 Pro', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '48MP + 12MP UW + 12MP 5x Telephoto', 'Battery': '4685mAh', 'OS': 'iOS 18' },
  },
  {
    name: 'Xiaomi Redmi Note 13 Pro 5G', slug: 'xiaomi-redmi-note-13-pro-5g', brandSlug: 'xiaomi',
    specifications: { 'Display': '6.67" 1.5K AMOLED 120Hz', 'Processor': 'Snapdragon 7s Gen 2', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '200MP+8MP+2MP', 'Battery': '5100mAh 67W', 'OS': 'MIUI 14' },
  },
  {
    name: 'OnePlus 12 5G', slug: 'oneplus-12-5g', brandSlug: 'oneplus',
    specifications: { 'Display': '6.82" ProXDR LTPO 120Hz', 'Processor': 'Snapdragon 8 Gen 3', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '50MP Hasselblad+48MP+64MP', 'Battery': '5400mAh 100W', 'OS': 'OxygenOS 14' },
  },
  {
    name: 'Samsung Galaxy A55 5G', slug: 'samsung-galaxy-a55-5g', brandSlug: 'samsung',
    specifications: { 'Display': '6.6" Super AMOLED FHD+ 120Hz', 'Processor': 'Exynos 1480', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '50MP OIS+12MP+5MP', 'Battery': '5000mAh 25W', 'Water Resistance': 'IP67' },
  },

  // ── Tablets ───────────────────────────────────────────────────────────────
  {
    name: 'Apple iPad Air M2 11"', slug: 'apple-ipad-air-m2-11', brandSlug: 'apple',
    specifications: { 'Display': '11" Liquid Retina', 'Chip': 'M2', 'Storage': '128GB', 'RAM': '8GB', 'Connectivity': 'Wi-Fi 6E', 'Battery': '28.65Wh', 'OS': 'iPadOS 17' },
  },
  {
    name: 'Samsung Galaxy Tab S9 FE', slug: 'samsung-galaxy-tab-s9-fe', brandSlug: 'samsung',
    specifications: { 'Display': '10.9" WUXGA 90Hz', 'Processor': 'Exynos 1380', 'RAM': '6GB', 'Storage': '128GB', 'Battery': '10090mAh', 'S Pen': 'Included', 'OS': 'Android 13' },
  },

  // ── Laptops ───────────────────────────────────────────────────────────────
  {
    name: 'Apple MacBook Air M3 13"', slug: 'apple-macbook-air-m3-13', brandSlug: 'apple',
    specifications: { 'Display': '13.6" Liquid Retina', 'Chip': 'M3', 'RAM': '8GB Unified Memory', 'Storage': '256GB SSD', 'Battery': 'Up to 18 hours', 'Weight': '1.24kg', 'OS': 'macOS Sonoma' },
  },
  {
    name: 'Dell XPS 15 (9530)', slug: 'dell-xps-15-9530', brandSlug: 'dell',
    specifications: { 'Display': '15.6" OLED 3.5K Touch', 'Processor': 'Intel i7-13700H', 'RAM': '16GB DDR5', 'Storage': '512GB NVMe SSD', 'GPU': 'NVIDIA RTX 4060 8GB', 'Battery': '86Whr', 'OS': 'Windows 11 Pro' },
  },
  {
    name: 'Lenovo IdeaPad Slim 5 14"', slug: 'lenovo-ideapad-slim-5-14', brandSlug: 'lenovo',
    specifications: { 'Display': '14" IPS FHD 300nits', 'Processor': 'AMD Ryzen 7 7730U', 'RAM': '16GB LPDDR4X', 'Storage': '512GB NVMe SSD', 'GPU': 'AMD Radeon 780M', 'Battery': '75Whr', 'OS': 'Windows 11 Home' },
  },
  {
    name: 'ASUS VivoBook 16X', slug: 'asus-vivobook-16x', brandSlug: 'asus',
    specifications: { 'Display': '16" OLED WUXGA 60Hz', 'Processor': 'Intel i5-13500H', 'RAM': '16GB DDR5', 'Storage': '1TB NVMe SSD', 'GPU': 'NVIDIA RTX 4050 6GB', 'Battery': '70Whr', 'OS': 'Windows 11 Home' },
  },

  // ── Gaming Laptops ────────────────────────────────────────────────────────
  {
    name: 'HP Victus 15 Gaming', slug: 'hp-victus-15-gaming', brandSlug: 'hp',
    specifications: { 'Display': '15.6" FHD 144Hz IPS', 'Processor': 'AMD Ryzen 5 7535HS', 'RAM': '16GB DDR5', 'Storage': '512GB SSD', 'GPU': 'NVIDIA RTX 4060 8GB', 'Battery': '70.9Whr', 'OS': 'Windows 11' },
  },
  {
    name: 'ASUS ROG Strix G16 (2024)', slug: 'asus-rog-strix-g16-2024', brandSlug: 'asus',
    specifications: { 'Display': '16" QHD+ 240Hz', 'Processor': 'Intel i9-14900HX', 'RAM': '32GB DDR5', 'Storage': '1TB NVMe SSD', 'GPU': 'NVIDIA RTX 4080 12GB', 'Battery': '90Whr', 'OS': 'Windows 11' },
  },

  // ── Headphones ────────────────────────────────────────────────────────────
  {
    name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5', brandSlug: 'sony',
    specifications: { 'Type': 'Over-Ear', 'ANC': 'Industry-leading', 'Battery': '30 hours', 'Codec': 'LDAC, AAC, SBC', 'Connectivity': 'Bluetooth 5.2', 'Weight': '250g' },
  },
  {
    name: 'Apple AirPods Pro (2nd Gen)', slug: 'apple-airpods-pro-2nd-gen', brandSlug: 'apple',
    specifications: { 'Type': 'In-Ear TWS', 'ANC': 'Adaptive ANC', 'Battery': '6h (30h with case)', 'Chip': 'Apple H2', 'Water Resistance': 'IPX4', 'Connectivity': 'Bluetooth 5.3' },
  },
  {
    name: 'Samsung Galaxy Buds3 Pro', slug: 'samsung-galaxy-buds3-pro', brandSlug: 'samsung',
    specifications: { 'Driver': '11mm woofer + 6.5mm tweeter', 'ANC': 'Intelligent ANC 2.0', 'Battery': '6h (30h with case)', 'Water Resistance': 'IPX7', 'Codec': 'SSC HiFi, AAC, SBC', 'Connectivity': 'Bluetooth 5.4' },
  },
  {
    name: 'JBL Xtreme 3', slug: 'jbl-xtreme-3', brandSlug: 'jbl',
    specifications: { 'Output Power': '100W', 'Battery': '15 hours', 'Water Resistance': 'IP67', 'Connectivity': 'Bluetooth 5.3', 'Weight': '1.96kg', 'PartyBoost': 'Yes' },
  },

  // ── Monitors ──────────────────────────────────────────────────────────────
  {
    name: 'Dell UltraSharp U2723QE 27" 4K', slug: 'dell-ultrasharp-u2723qe-27', brandSlug: 'dell',
    specifications: { 'Panel': '27" IPS Black 4K (3840x2160)', 'Refresh Rate': '60Hz', 'Color': '100% sRGB, 98% DCI-P3', 'Brightness': '400 nits', 'Ports': 'USB-C 90W, HDMI 2.0, DP 1.4' },
  },
  {
    name: 'Samsung Odyssey G5 27" Curved', slug: 'samsung-odyssey-g5-27', brandSlug: 'samsung',
    specifications: { 'Panel': '27" VA Curved 1440p', 'Refresh Rate': '165Hz', 'Response Time': '1ms MPRT', 'HDR': 'HDR10', 'AMD FreeSync': 'Premium', 'Ports': 'HDMI 2.0, DP 1.2' },
  },

  // ── Gaming Peripherals ────────────────────────────────────────────────────
  {
    name: 'Logitech G Pro X Superlight 2', slug: 'logitech-g-pro-x-superlight-2', brandSlug: 'logitech',
    specifications: { 'Weight': '60g', 'Sensor': 'HERO 2 25,600 DPI', 'Battery': '95 hours', 'Connectivity': 'LIGHTSPEED Wireless', 'Polling Rate': '2000Hz', 'Buttons': '5' },
  },
  {
    name: 'Razer BlackWidow V4 Pro', slug: 'razer-blackwidow-v4-pro', brandSlug: 'razer',
    specifications: { 'Switch': 'Razer Yellow (Linear)', 'Layout': 'Full-size with Numpad', 'Connectivity': 'HyperSpeed Wireless / USB-C', 'Battery': '200 hours', 'RGB': 'Razer Chroma Per-Key' },
  },

  // ── Keyboards & Mice ──────────────────────────────────────────────────────
  {
    name: 'Logitech MX Master 3S', slug: 'logitech-mx-master-3s', brandSlug: 'logitech',
    specifications: { 'DPI': '200-8000', 'Scroll': 'MagSpeed Electromagnetic', 'Battery': '70 days', 'Connectivity': 'Bluetooth 5.0, Logi Bolt', 'Multi-device': 'Up to 3', 'Weight': '141g' },
  },
  {
    name: 'Logitech MX Keys S', slug: 'logitech-mx-keys-s', brandSlug: 'logitech',
    specifications: { 'Type': 'Low-profile scissor', 'Backlighting': 'Smart per-key', 'Battery': '10 days (with backlight)', 'Connectivity': 'Bluetooth 5.0, Logi Bolt', 'Multi-device': 'Up to 3' },
  },

  // ── Cameras ───────────────────────────────────────────────────────────────
  {
    name: 'Sony Alpha A7 IV Mirrorless', slug: 'sony-alpha-a7-iv', brandSlug: 'sony',
    specifications: { 'Sensor': '33MP Full-Frame BSI CMOS', 'Video': '4K 60fps', 'AF': '759 Phase-detect', 'ISO': '100-51200', 'Stabilization': '5-axis IBIS', 'Mount': 'Sony E-mount' },
  },
  {
    name: 'Canon EOS R50 Mirrorless', slug: 'canon-eos-r50', brandSlug: 'canon',
    specifications: { 'Sensor': '24.2MP APS-C CMOS', 'Video': '4K 30fps, FHD 120fps', 'AF': 'Dual Pixel CMOS AF II', 'ISO': '100-32000', 'Display': '3" Vari-angle touch', 'Mount': 'Canon RF-S' },
  },
  {
    name: 'Nikon Z50 II Mirrorless', slug: 'nikon-z50-ii', brandSlug: 'nikon',
    specifications: { 'Sensor': '21MP APS-C CMOS', 'Video': '4K 60fps UHD', 'AF': '209 Phase-detect', 'ISO': '100-51200', 'Display': '3.2" Tilting touch + EVF', 'Mount': 'Nikon Z' },
  },

  // ── Smartwatches ──────────────────────────────────────────────────────────
  {
    name: 'Apple Watch Series 10', slug: 'apple-watch-series-10', brandSlug: 'apple',
    specifications: { 'Display': '46mm LTPO OLED Always-On', 'Health': 'ECG, Blood Oxygen, Sleep Apnea', 'Battery': '18 hours', 'Water': '50m', 'Connectivity': 'GPS + Cellular', 'OS': 'watchOS 11' },
  },
  {
    name: 'Samsung Galaxy Watch 7', slug: 'samsung-galaxy-watch-7', brandSlug: 'samsung',
    specifications: { 'Display': '44mm Super AMOLED Always-On', 'Health': 'BioActive Sensor, ECG', 'Battery': '40 hours', 'Water': '5ATM + IP68', 'Processor': 'Exynos W1000 3nm', 'OS': 'Wear OS 5' },
  },
  {
    name: 'Xiaomi Watch S3', slug: 'xiaomi-watch-s3', brandSlug: 'xiaomi',
    specifications: { 'Display': '1.43" AMOLED', 'Battery': '15 days', 'Sport Modes': '100+', 'Health': 'Heart Rate, SpO2, Sleep', 'Water': '5ATM', 'Connectivity': 'Bluetooth 5.2' },
  },

  // ── Networking ────────────────────────────────────────────────────────────
  {
    name: 'TP-Link Archer AXE75 WiFi 6E', slug: 'tp-link-archer-axe75', brandSlug: 'tp-link',
    specifications: { 'Standard': 'WiFi 6E (802.11ax)', 'Speed': 'AXE5400', 'Processor': '1.7GHz Tri-Core', 'Ports': '4x Gigabit LAN + 1x 2.5G WAN', 'USB': 'USB 3.0', 'Antenna': '6 External' },
  },
  {
    name: 'TP-Link Deco XE75 Mesh WiFi 6E', slug: 'tp-link-deco-xe75-2pack', brandSlug: 'tp-link',
    specifications: { 'Standard': 'WiFi 6E', 'Speed': 'AXE5400', 'Coverage': '4000 sq ft (2 units)', 'Backhaul': 'Dedicated 6GHz', 'Ports': '1x 2.5G + 1x Gigabit/unit', 'Management': 'Deco App' },
  },

  // ── Cables & Chargers ─────────────────────────────────────────────────────
  {
    name: 'Anker 65W GaN Wall Charger (2-port)', slug: 'anker-65w-gan-charger-2port', brandSlug: 'anker',
    specifications: { 'Power': '65W total (45W + 20W)', 'Ports': '2x USB-C', 'Technology': 'GaN II', 'Compatibility': 'MacBook, iPad, iPhone, Android' },
  },
  {
    name: 'Anker 240W USB-C to USB-C Cable 2m', slug: 'anker-240w-usbc-cable-2m', brandSlug: 'anker',
    specifications: { 'Power': '240W EPR', 'Data': '10Gbps', 'Length': '2 meters', 'Material': 'Nylon braided', 'Compatibility': 'Universal USB-C' },
  },

  // ── Bags & Cases ──────────────────────────────────────────────────────────
  {
    name: 'Tomtoc 360° Protective Laptop Sleeve 15.6"', slug: 'tomtoc-360-laptop-sleeve-156', brandSlug: 'anker', // Using anker as proxy
    specifications: { 'Size': 'Fits up to 15.6" laptops', 'Protection': '360° CornerArmor', 'Water Resistance': 'Yes', 'TSA Friendly': 'Yes', 'Material': 'Nylon exterior' },
  },
];

async function main() {
  console.log('🔄 Recovering Brands and Product Specs...');

  // 1. Recover Brands
  const brandMap: Record<string, string> = {};
  for (const b of BRAND_LIST) {
    let brand = await prisma.brand.findUnique({ where: { slug: b.slug } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: b.name, slug: b.slug, isFeatured: b.isFeatured },
      });
      console.log(`  ✅ Recovered Brand: ${b.name}`);
    }
    brandMap[b.slug] = brand.id;
  }

  // 2. Recover Product attributes (brandId and specifications)
  let updated = 0;
  for (const p of PRODUCTS) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      const brandId = brandMap[p.brandSlug];
      if (brandId) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            brandId: brandId,
            specifications: p.specifications as any,
          }
        });
        console.log(`  ✅ Recovered Specs & Brand for: ${existing.name}`);
        updated++;
      }
    }
  }

  console.log(`\n🎉 Recovery complete! Updated ${updated} products.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
