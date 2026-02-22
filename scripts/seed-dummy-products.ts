import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Category Tree ────────────────────────────────────────────────────────────
const CATEGORY_TREE = [
  {
    name: 'Smartphones & Tablets',
    slug: 'smartphones-tablets',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    children: [
      { name: 'Smartphones', slug: 'smartphones', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' },
      { name: 'Tablets', slug: 'tablets', image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400' },
    ],
  },
  {
    name: 'Laptops & Computers',
    slug: 'laptops-computers',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
    children: [
      { name: 'Laptops', slug: 'laptops', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400' },
      { name: 'Desktop PCs', slug: 'desktop-pcs', image: 'https://images.unsplash.com/photo-1593640408182-31c228f4c12e?w=400' },
    ],
  },
  {
    name: 'Audio & Headphones',
    slug: 'audio-headphones',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    children: [
      { name: 'Headphones', slug: 'headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
      { name: 'Earbuds & TWS', slug: 'earbuds-tws', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400' },
      { name: 'Speakers', slug: 'speakers', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400' },
    ],
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400',
    children: [
      { name: 'Gaming Peripherals', slug: 'gaming-peripherals', image: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400' },
      { name: 'Gaming Laptops', slug: 'gaming-laptops', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400' },
    ],
  },
  {
    name: 'Monitors & Displays',
    slug: 'monitors-displays',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
    children: [
      { name: 'Monitors', slug: 'monitors', image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400' },
    ],
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    image: 'https://images.unsplash.com/photo-1625772452859-1c03d884dcd7?w=400',
    children: [
      { name: 'Keyboards & Mice', slug: 'keyboards-mice', image: 'https://images.unsplash.com/photo-1608022702967-22b4ce023a52?w=400' },
      { name: 'Cables & Chargers', slug: 'cables-chargers', image: 'https://images.unsplash.com/photo-1625772452859-1c03d884dcd7?w=400' },
      { name: 'Bags & Cases', slug: 'bags-cases', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400' },
    ],
  },
  {
    name: 'Cameras & Photography',
    slug: 'cameras-photography',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
    children: [
      { name: 'Cameras', slug: 'cameras', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400' },
    ],
  },
  {
    name: 'Smartwatches & Wearables',
    slug: 'smartwatches-wearables',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    children: [
      { name: 'Smartwatches', slug: 'smartwatches', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
    ],
  },
  {
    name: 'Networking',
    slug: 'networking',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400',
    children: [
      { name: 'Routers & WiFi', slug: 'routers-wifi', image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400' },
    ],
  },
];

// ─── Brands ───────────────────────────────────────────────────────────────────
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

// ─── Products ─────────────────────────────────────────────────────────────────
type ProductSeed = {
  name: string; slug: string; categorySlug: string; brandSlug: string;
  price: number; offerPrice?: number; costPrice: number; stock: number;
  shortDesc: string; description: string; images: string[];
  isFeatured?: boolean; isFlashSale?: boolean; isBestSeller?: boolean;
  soldCount?: number; viewCount?: number; discountPercentage?: number;
  flashSaleEndTime?: Date; specifications?: Record<string, string>;
  warrantyMonths?: number; warrantyType?: string;
};

const d = (plusDays: number) => new Date(Date.now() + plusDays * 24 * 60 * 60 * 1000);

const PRODUCTS: ProductSeed[] = [
  // ── Smartphones ──────────────────────────────────────────────────────────
  {
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    categorySlug: 'smartphones',
    brandSlug: 'samsung',
    price: 179900, offerPrice: 164900, costPrice: 130000, stock: 15,
    isFeatured: true, isBestSeller: true, soldCount: 142, viewCount: 3820,
    shortDesc: 'AI-powered flagship with S Pen, 200MP camera & titanium frame.',
    description: 'The Samsung Galaxy S24 Ultra is the ultimate Galaxy experience. With a built-in S Pen, 6.8" Dynamic AMOLED 2X display, and 200MP main camera, this phone redefines what a smartphone can do.',
    images: ['https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=600'],
    specifications: { 'Display': '6.8" AMOLED 120Hz', 'Processor': 'Snapdragon 8 Gen 3', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '200MP+12MP+10MP+10MP', 'Battery': '5000mAh', 'OS': 'Android 14' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Apple iPhone 16 Pro Max',
    slug: 'apple-iphone-16-pro-max',
    categorySlug: 'smartphones',
    brandSlug: 'apple',
    price: 195000, offerPrice: 188000, costPrice: 148000, stock: 10,
    isFeatured: true, isBestSeller: true, soldCount: 98, viewCount: 4210,
    shortDesc: 'Titanium design, A18 Pro chip, 48MP Fusion camera system.',
    description: 'iPhone 16 Pro Max. Forged in titanium with an A18 Pro chip. ProMotion OLED display up to 120Hz with Always-On support. Advanced camera system with Photographic Styles.',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484428d2?w=600'],
    specifications: { 'Display': '6.9" Super Retina XDR ProMotion', 'Chip': 'A18 Pro', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '48MP + 12MP UW + 12MP 5x Telephoto', 'Battery': '4685mAh', 'OS': 'iOS 18' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Xiaomi Redmi Note 13 Pro 5G',
    slug: 'xiaomi-redmi-note-13-pro-5g',
    categorySlug: 'smartphones',
    brandSlug: 'xiaomi',
    price: 32999, offerPrice: 29999, costPrice: 22000, stock: 45,
    isBestSeller: true, isFlashSale: true, soldCount: 310, viewCount: 5640,
    discountPercentage: 9, flashSaleEndTime: d(3),
    shortDesc: '200MP camera, 120Hz 1.5K AMOLED, 67W fast charge.',
    description: 'Redmi Note 13 Pro brings 200MP photography to the mid-range. The 1.5K AMOLED display at 120Hz is strikingly bright, and 67W HyperCharge fills the 5100mAh battery in under 50 minutes.',
    images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'],
    specifications: { 'Display': '6.67" 1.5K AMOLED 120Hz', 'Processor': 'Snapdragon 7s Gen 2', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '200MP+8MP+2MP', 'Battery': '5100mAh 67W', 'OS': 'MIUI 14' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'OnePlus 12 5G',
    slug: 'oneplus-12-5g',
    categorySlug: 'smartphones',
    brandSlug: 'oneplus',
    price: 89999, offerPrice: 82999, costPrice: 65000, stock: 20,
    isFeatured: true, soldCount: 67, viewCount: 1890,
    shortDesc: 'Snapdragon 8 Gen 3, Hasselblad cameras, 100W SUPERVOOC charging.',
    description: 'OnePlus 12 combines blazing Snapdragon 8 Gen 3 with Hasselblad co-engineered cameras. The 6.82" ProXDR Display with LTPO 4.0 adapts from 1Hz to 120Hz for maximum efficiency.',
    images: ['https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600'],
    specifications: { 'Display': '6.82" ProXDR LTPO 120Hz', 'Processor': 'Snapdragon 8 Gen 3', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '50MP Hasselblad+48MP+64MP', 'Battery': '5400mAh 100W', 'OS': 'OxygenOS 14' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Samsung Galaxy A55 5G',
    slug: 'samsung-galaxy-a55-5g',
    categorySlug: 'smartphones',
    brandSlug: 'samsung',
    price: 44999, offerPrice: 41499, costPrice: 31000, stock: 38,
    isFeatured: false, isBestSeller: true, soldCount: 224, viewCount: 4880,
    shortDesc: '6.6" Super AMOLED, 50MP OIS camera, IP67, 5000mAh.',
    description: 'Galaxy A55 5G brings premium features to a mid-range price. IP67 water resistance, a 50MP OIS camera, and 6-year OS updates make it one of the best value Android phones available.',
    images: ['https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600'],
    specifications: { 'Display': '6.6" Super AMOLED FHD+ 120Hz', 'Processor': 'Exynos 1480', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '50MP OIS+12MP+5MP', 'Battery': '5000mAh 25W', 'Water Resistance': 'IP67' },
    warrantyMonths: 12, warrantyType: 'Official',
  },

  // ── Tablets ───────────────────────────────────────────────────────────────
  {
    name: 'Apple iPad Air M2 11"',
    slug: 'apple-ipad-air-m2-11',
    categorySlug: 'tablets',
    brandSlug: 'apple',
    price: 89000, offerPrice: 85000, costPrice: 65000, stock: 12,
    isFeatured: true, soldCount: 44, viewCount: 1200,
    shortDesc: 'M2 chip, Liquid Retina, Apple Pencil Pro support.',
    description: 'iPad Air with M2 chip is incredibly capable, thin, and light. Up to 45% faster than M1, it handles everything from creativity to productivity. Supports Apple Pencil Pro and the new Magic Keyboard.',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600'],
    specifications: { 'Display': '11" Liquid Retina', 'Chip': 'M2', 'Storage': '128GB', 'RAM': '8GB', 'Connectivity': 'Wi-Fi 6E', 'Battery': '28.65Wh', 'OS': 'iPadOS 17' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Samsung Galaxy Tab S9 FE',
    slug: 'samsung-galaxy-tab-s9-fe',
    categorySlug: 'tablets',
    brandSlug: 'samsung',
    price: 52999, offerPrice: 47999, costPrice: 36000, stock: 18,
    isBestSeller: true, soldCount: 88, viewCount: 2100,
    shortDesc: '10.9" WUXGA display, S Pen included, IP68 rated.',
    description: 'Galaxy Tab S9 FE brings the Galaxy S series experience at an accessible price. Enjoy 10.9" WUXGA display, IP68 protection, and the included S Pen for note-taking and creative work.',
    images: ['https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600'],
    specifications: { 'Display': '10.9" WUXGA 90Hz', 'Processor': 'Exynos 1380', 'RAM': '6GB', 'Storage': '128GB', 'Battery': '10090mAh', 'S Pen': 'Included', 'OS': 'Android 13' },
    warrantyMonths: 12, warrantyType: 'Official',
  },

  // ── Laptops ───────────────────────────────────────────────────────────────
  {
    name: 'Apple MacBook Air M3 13"',
    slug: 'apple-macbook-air-m3-13',
    categorySlug: 'laptops',
    brandSlug: 'apple',
    price: 155000, offerPrice: 148000, costPrice: 115000, stock: 8,
    isFeatured: true, isBestSeller: true, soldCount: 52, viewCount: 3100,
    shortDesc: 'M3 chip, 18-hour battery, fanless – thin & light perfection.',
    description: 'MacBook Air with M3 chip delivers staggering performance in a completely fan-free design. Up to 18 hours of battery life, a brilliant Liquid Retina display, and support for two external displays.',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
    specifications: { 'Display': '13.6" Liquid Retina', 'Chip': 'M3', 'RAM': '8GB Unified Memory', 'Storage': '256GB SSD', 'Battery': 'Up to 18 hours', 'Weight': '1.24kg', 'OS': 'macOS Sonoma' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Dell XPS 15 (9530)',
    slug: 'dell-xps-15-9530',
    categorySlug: 'laptops',
    brandSlug: 'dell',
    price: 175000, offerPrice: 162000, costPrice: 128000, stock: 6,
    isFeatured: true, soldCount: 28, viewCount: 1650,
    shortDesc: 'i7-13700H, RTX 4060, 15.6" 3.5K OLED touchscreen.',
    description: 'Dell XPS 15 is engineered for serious creators. The 15.6" 3.5K OLED touchscreen delivers exceptional color accuracy while the Intel Core i7 paired with RTX 4060 handles demanding creative workloads.',
    images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600'],
    specifications: { 'Display': '15.6" OLED 3.5K Touch', 'Processor': 'Intel i7-13700H', 'RAM': '16GB DDR5', 'Storage': '512GB NVMe SSD', 'GPU': 'NVIDIA RTX 4060 8GB', 'Battery': '86Whr', 'OS': 'Windows 11 Pro' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Lenovo IdeaPad Slim 5 14"',
    slug: 'lenovo-ideapad-slim-5-14',
    categorySlug: 'laptops',
    brandSlug: 'lenovo',
    price: 68000, offerPrice: 62000, costPrice: 46000, stock: 22,
    isBestSeller: true, soldCount: 176, viewCount: 4200,
    shortDesc: 'Ryzen 7, 16GB RAM, 512GB SSD – best everyday laptop value.',
    description: 'IdeaPad Slim 5 combines performance and portability. Powered by AMD Ryzen 7 7730U with 16GB RAM, this slim laptop handles multitasking and office work with ease. Bright 14" IPS at 300 nits.',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],
    specifications: { 'Display': '14" IPS FHD 300nits', 'Processor': 'AMD Ryzen 7 7730U', 'RAM': '16GB LPDDR4X', 'Storage': '512GB NVMe SSD', 'GPU': 'AMD Radeon 780M', 'Battery': '75Whr', 'OS': 'Windows 11 Home' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'ASUS VivoBook 16X',
    slug: 'asus-vivobook-16x',
    categorySlug: 'laptops',
    brandSlug: 'asus',
    price: 79000, offerPrice: 71999, costPrice: 54000, stock: 14,
    soldCount: 92, viewCount: 2450,
    shortDesc: '16" WUXGA OLED, Intel i5-13500H, RTX 4050, 1TB SSD.',
    description: 'VivoBook 16X stands out with a 16" OLED display with 100% DCI-P3 color — perfect for creative professionals. The Intel i5-13500H with RTX 4050 handles everyday tasks and light creative work smoothly.',
    images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],
    specifications: { 'Display': '16" OLED WUXGA 60Hz', 'Processor': 'Intel i5-13500H', 'RAM': '16GB DDR5', 'Storage': '1TB NVMe SSD', 'GPU': 'NVIDIA RTX 4050 6GB', 'Battery': '70Whr', 'OS': 'Windows 11 Home' },
    warrantyMonths: 12, warrantyType: 'Service',
  },

  // ── Gaming Laptops ────────────────────────────────────────────────────────
  {
    name: 'HP Victus 15 Gaming',
    slug: 'hp-victus-15-gaming',
    categorySlug: 'gaming-laptops',
    brandSlug: 'hp',
    price: 95000, offerPrice: 88000, costPrice: 68000, stock: 14,
    isFeatured: true, isFlashSale: true, soldCount: 93, viewCount: 2750,
    discountPercentage: 7, flashSaleEndTime: d(2),
    shortDesc: 'Ryzen 5 7535HS, RTX 4060, 144Hz IPS – budget gaming beast.',
    description: 'HP Victus 15 is affordable gaming performance. The AMD Ryzen 5 7535HS paired with NVIDIA RTX 4060 delivers smooth frame rates on popular titles. The 144Hz IPS display ensures fluid gameplay.',
    images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'],
    specifications: { 'Display': '15.6" FHD 144Hz IPS', 'Processor': 'AMD Ryzen 5 7535HS', 'RAM': '16GB DDR5', 'Storage': '512GB SSD', 'GPU': 'NVIDIA RTX 4060 8GB', 'Battery': '70.9Whr', 'OS': 'Windows 11' },
    warrantyMonths: 12, warrantyType: 'Service',
  },
  {
    name: 'ASUS ROG Strix G16 (2024)',
    slug: 'asus-rog-strix-g16-2024',
    categorySlug: 'gaming-laptops',
    brandSlug: 'asus',
    price: 185000, costPrice: 140000, stock: 5,
    isFeatured: true, soldCount: 22, viewCount: 1880,
    shortDesc: 'Intel i9-14900HX, RTX 4080, 240Hz QHD+ – ultimate gaming.',
    description: 'ROG Strix G16 is a no-compromise gaming laptop. Intel Core i9-14900HX and NVIDIA GeForce RTX 4080 deliver the highest frame rates, while the 16" QHD+ 240Hz display makes sure you see every frame.',
    images: ['https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600'],
    specifications: { 'Display': '16" QHD+ 240Hz', 'Processor': 'Intel i9-14900HX', 'RAM': '32GB DDR5', 'Storage': '1TB NVMe SSD', 'GPU': 'NVIDIA RTX 4080 12GB', 'Battery': '90Whr', 'OS': 'Windows 11' },
    warrantyMonths: 24, warrantyType: 'Service',
  },

  // ── Headphones ────────────────────────────────────────────────────────────
  {
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    categorySlug: 'headphones',
    brandSlug: 'sony',
    price: 42000, offerPrice: 37500, costPrice: 27000, stock: 30,
    isFeatured: true, isBestSeller: true, soldCount: 245, viewCount: 6200,
    shortDesc: 'Industry-leading ANC, 30-hour battery, multipoint connect.',
    description: 'Sony WH-1000XM5 sets the standard for noise cancellation. With 8 microphones and two processors, it delivers an unprecedented level of quiet. LDAC codec for hi-res audio over Bluetooth.',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
    specifications: { 'Type': 'Over-Ear', 'ANC': 'Industry-leading', 'Battery': '30 hours', 'Codec': 'LDAC, AAC, SBC', 'Connectivity': 'Bluetooth 5.2', 'Weight': '250g' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Apple AirPods Pro (2nd Gen)',
    slug: 'apple-airpods-pro-2nd-gen',
    categorySlug: 'earbuds-tws',
    brandSlug: 'apple',
    price: 34900, offerPrice: 31999, costPrice: 23000, stock: 35,
    isFeatured: true, isBestSeller: true, isFlashSale: true, soldCount: 320, viewCount: 7800,
    discountPercentage: 8, flashSaleEndTime: d(1),
    shortDesc: 'Adaptive ANC, H2 chip, 30h total battery, IPX4.',
    description: 'AirPods Pro (2nd gen) with H2 chip. Adaptive Audio seamlessly transitions between ANC and Transparency. Conversation Awareness lowers audio when you start speaking.',
    images: ['https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?w=600'],
    specifications: { 'Type': 'In-Ear TWS', 'ANC': 'Adaptive ANC', 'Battery': '6h (30h with case)', 'Chip': 'Apple H2', 'Water Resistance': 'IPX4', 'Connectivity': 'Bluetooth 5.3' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Samsung Galaxy Buds3 Pro',
    slug: 'samsung-galaxy-buds3-pro',
    categorySlug: 'earbuds-tws',
    brandSlug: 'samsung',
    price: 22999, offerPrice: 19999, costPrice: 14500, stock: 28,
    isBestSeller: true, soldCount: 178, viewCount: 3900,
    shortDesc: 'Blade-tip design, intelligent ANC, 360° audio, IPX7.',
    description: 'Galaxy Buds3 Pro features a revolutionary blade-tip design for ultimate comfort. The intelligent ANC system adapts to your surroundings, while 360 Audio provides an immersive surround sound experience.',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],
    specifications: { 'Driver': '11mm woofer + 6.5mm tweeter', 'ANC': 'Intelligent ANC 2.0', 'Battery': '6h (30h with case)', 'Water Resistance': 'IPX7', 'Codec': 'SSC HiFi, AAC, SBC', 'Connectivity': 'Bluetooth 5.4' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'JBL Xtreme 3',
    slug: 'jbl-xtreme-3',
    categorySlug: 'speakers',
    brandSlug: 'jbl',
    price: 22500, offerPrice: 19900, costPrice: 13500, stock: 40,
    isBestSeller: true, soldCount: 188, viewCount: 3400,
    shortDesc: 'IP67 waterproof, 15h battery, 100W, PartyBoost.',
    description: 'JBL Xtreme 3 delivers massive stereo sound with punchy bass in a rugged IP67 waterproof package. With 15 hours of playtime and a built-in powerbank, it is the ultimate outdoor speaker.',
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'],
    specifications: { 'Output Power': '100W', 'Battery': '15 hours', 'Water Resistance': 'IP67', 'Connectivity': 'Bluetooth 5.3', 'Weight': '1.96kg', 'PartyBoost': 'Yes' },
    warrantyMonths: 12, warrantyType: 'Service',
  },

  // ── Monitors ──────────────────────────────────────────────────────────────
  {
    name: 'Dell UltraSharp U2723QE 27" 4K',
    slug: 'dell-ultrasharp-u2723qe-27',
    categorySlug: 'monitors',
    brandSlug: 'dell',
    price: 72000, offerPrice: 65000, costPrice: 48000, stock: 10,
    isFeatured: true, soldCount: 36, viewCount: 1420,
    shortDesc: '27" 4K IPS Black, USB-C 90W, factory calibrated.',
    description: 'Dell UltraSharp U2723QE delivers stunning 4K clarity with IPS Black technology for deeper blacks. USB-C with 90W PD connects and charges your laptop through one cable.',
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600'],
    specifications: { 'Panel': '27" IPS Black 4K (3840x2160)', 'Refresh Rate': '60Hz', 'Color': '100% sRGB, 98% DCI-P3', 'Brightness': '400 nits', 'Ports': 'USB-C 90W, HDMI 2.0, DP 1.4' },
    warrantyMonths: 36, warrantyType: 'Official',
  },
  {
    name: 'Samsung Odyssey G5 27" Curved',
    slug: 'samsung-odyssey-g5-27',
    categorySlug: 'monitors',
    brandSlug: 'samsung',
    price: 42000, offerPrice: 37000, costPrice: 27000, stock: 18,
    isBestSeller: true, soldCount: 124, viewCount: 3640,
    shortDesc: '1440p 165Hz 1ms VA curved – immersive gaming display.',
    description: 'Samsung Odyssey G5 WQHD resolution gives 1.7x more pixels than Full HD. The 1000R curved screen and 165Hz refresh rate with 1ms response time eliminate blur and ghosting for smooth gameplay.',
    images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600'],
    specifications: { 'Panel': '27" VA Curved 1440p', 'Refresh Rate': '165Hz', 'Response Time': '1ms MPRT', 'HDR': 'HDR10', 'AMD FreeSync': 'Premium', 'Ports': 'HDMI 2.0, DP 1.2' },
    warrantyMonths: 36, warrantyType: 'Official',
  },

  // ── Gaming Peripherals ────────────────────────────────────────────────────
  {
    name: 'Logitech G Pro X Superlight 2',
    slug: 'logitech-g-pro-x-superlight-2',
    categorySlug: 'gaming-peripherals',
    brandSlug: 'logitech',
    price: 18500, offerPrice: 16500, costPrice: 11000, stock: 25,
    isFeatured: true, isBestSeller: true, soldCount: 210, viewCount: 5100,
    shortDesc: '60g ultra-light gaming mouse, HERO 2 25K sensor, 95h battery.',
    description: 'G Pro X Superlight 2 at just 60 grams is the lightest pro gaming mouse from Logitech. The HERO 2 sensor delivers 25,600 DPI with zero smoothing, filtering, or acceleration.',
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'],
    specifications: { 'Weight': '60g', 'Sensor': 'HERO 2 25,600 DPI', 'Battery': '95 hours', 'Connectivity': 'LIGHTSPEED Wireless', 'Polling Rate': '2000Hz', 'Buttons': '5' },
    warrantyMonths: 24, warrantyType: 'Official',
  },
  {
    name: 'Razer BlackWidow V4 Pro',
    slug: 'razer-blackwidow-v4-pro',
    categorySlug: 'gaming-peripherals',
    brandSlug: 'razer',
    price: 22000, offerPrice: 19000, costPrice: 13500, stock: 16,
    soldCount: 78, viewCount: 2200,
    shortDesc: 'Wireless mechanical keyboard, Razer Yellow switches, Command Dial.',
    description: 'BlackWidow V4 Pro is the ultimate wireless mechanical gaming keyboard. Razer Yellow linear switches provide smooth actuation. The Command Dial offers quick access to custom shortcuts.',
    images: ['https://images.unsplash.com/photo-1561414927-6d86591d0c4f?w=600'],
    specifications: { 'Switch': 'Razer Yellow (Linear)', 'Layout': 'Full-size with Numpad', 'Connectivity': 'HyperSpeed Wireless / USB-C', 'Battery': '200 hours', 'RGB': 'Razer Chroma Per-Key' },
    warrantyMonths: 24, warrantyType: 'Service',
  },

  // ── Keyboards & Mice ──────────────────────────────────────────────────────
  {
    name: 'Logitech MX Master 3S',
    slug: 'logitech-mx-master-3s',
    categorySlug: 'keyboards-mice',
    brandSlug: 'logitech',
    price: 12500, offerPrice: 10999, costPrice: 7500, stock: 35,
    isBestSeller: true, soldCount: 295, viewCount: 6800,
    shortDesc: '8K DPI, MagSpeed scroll, silent clicks, multi-device.',
    description: 'MX Master 3S elevates productivity. The 8000 DPI MagSpeed electromagnetic scroll wheel moves 1000 lines per second. Near-silent clicks reduce noise by 90% while maintaining crisp feel.',
    images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600'],
    specifications: { 'DPI': '200-8000', 'Scroll': 'MagSpeed Electromagnetic', 'Battery': '70 days', 'Connectivity': 'Bluetooth 5.0, Logi Bolt', 'Multi-device': 'Up to 3', 'Weight': '141g' },
    warrantyMonths: 24, warrantyType: 'Official',
  },
  {
    name: 'Logitech MX Keys S',
    slug: 'logitech-mx-keys-s',
    categorySlug: 'keyboards-mice',
    brandSlug: 'logitech',
    price: 13500, offerPrice: 11999, costPrice: 8200, stock: 28,
    soldCount: 145, viewCount: 3200,
    shortDesc: 'Backlit wireless keyboard, Smart Actions, multi-device.',
    description: 'MX Keys S is the ultimate productivity keyboard. Perfectly spherical key caps match your fingertips for fast, accurate typing. Backlit keys adjust to ambient light automatically.',
    images: ['https://images.unsplash.com/photo-1608022702967-22b4ce023a52?w=600'],
    specifications: { 'Type': 'Low-profile scissor', 'Backlighting': 'Smart per-key', 'Battery': '10 days (with backlight)', 'Connectivity': 'Bluetooth 5.0, Logi Bolt', 'Multi-device': 'Up to 3' },
    warrantyMonths: 24, warrantyType: 'Official',
  },

  // ── Cameras ───────────────────────────────────────────────────────────────
  {
    name: 'Sony Alpha A7 IV Mirrorless',
    slug: 'sony-alpha-a7-iv',
    categorySlug: 'cameras',
    brandSlug: 'sony',
    price: 299000, offerPrice: 279000, costPrice: 220000, stock: 4,
    isFeatured: true, soldCount: 12, viewCount: 2100,
    shortDesc: '33MP full-frame, 4K 60fps, real-time tracking AF.',
    description: 'Sony Alpha A7 IV is a full-frame mirrorless camera for professionals. The 33MP BSI CMOS sensor captures rich detail, and Real-time Tracking AF with AI locks on to subjects with incredible accuracy.',
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],
    specifications: { 'Sensor': '33MP Full-Frame BSI CMOS', 'Video': '4K 60fps', 'AF': '759 Phase-detect', 'ISO': '100-51200', 'Stabilization': '5-axis IBIS', 'Mount': 'Sony E-mount' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Canon EOS R50 Mirrorless',
    slug: 'canon-eos-r50',
    categorySlug: 'cameras',
    brandSlug: 'canon',
    price: 98000, offerPrice: 89999, costPrice: 68000, stock: 9,
    isBestSeller: true, soldCount: 48, viewCount: 1680,
    shortDesc: '24.2MP APS-C, 4K video, Dual Pixel AF II – best for creators.',
    description: 'Canon EOS R50 is a compact mirrorless camera for content creators. The 24.2MP APS-C sensor with Dual Pixel CMOS AF II delivers fast, accurate autofocus for both stills and 4K video.',
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],
    specifications: { 'Sensor': '24.2MP APS-C CMOS', 'Video': '4K 30fps, FHD 120fps', 'AF': 'Dual Pixel CMOS AF II', 'ISO': '100-32000', 'Display': '3" Vari-angle touch', 'Mount': 'Canon RF-S' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Nikon Z50 II Mirrorless',
    slug: 'nikon-z50-ii',
    categorySlug: 'cameras',
    brandSlug: 'nikon',
    price: 115000, offerPrice: 105000, costPrice: 80000, stock: 7,
    soldCount: 32, viewCount: 1100,
    shortDesc: '21MP APS-C, 4K 60fps, 209-point Phase AF, vlogging-friendly.',
    description: 'Nikon Z50 II is an advanced APS-C mirrorless camera with improved autofocus and video capabilities. The 21MP sensor with high-speed EXPEED 7 processor delivers excellent image quality in any lighting condition.',
    images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600'],
    specifications: { 'Sensor': '21MP APS-C CMOS', 'Video': '4K 60fps UHD', 'AF': '209 Phase-detect', 'ISO': '100-51200', 'Display': '3.2" Tilting touch + EVF', 'Mount': 'Nikon Z' },
    warrantyMonths: 12, warrantyType: 'Official',
  },

  // ── Smartwatches ──────────────────────────────────────────────────────────
  {
    name: 'Apple Watch Series 10',
    slug: 'apple-watch-series-10',
    categorySlug: 'smartwatches',
    brandSlug: 'apple',
    price: 62000, offerPrice: 57000, costPrice: 44000, stock: 20,
    isFeatured: true, isBestSeller: true, soldCount: 134, viewCount: 3900,
    shortDesc: 'Thinnest Apple Watch, sleep apnea detection, LTPO OLED.',
    description: 'Apple Watch Series 10 is the thinnest Apple Watch ever made. New sleep apnea detection adds another powerful health tool. The wide-angle Always-On Retina display is the largest Apple Watch display ever.',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    specifications: { 'Display': '46mm LTPO OLED Always-On', 'Health': 'ECG, Blood Oxygen, Sleep Apnea', 'Battery': '18 hours', 'Water': '50m', 'Connectivity': 'GPS + Cellular', 'OS': 'watchOS 11' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Samsung Galaxy Watch 7',
    slug: 'samsung-galaxy-watch-7',
    categorySlug: 'smartwatches',
    brandSlug: 'samsung',
    price: 35000, offerPrice: 30999, costPrice: 22000, stock: 25,
    isBestSeller: true, soldCount: 115, viewCount: 2640,
    shortDesc: 'BioActive sensor, Galaxy AI health insights, 3nm chip.',
    description: 'Galaxy Watch 7 packed with advanced AI-powered health monitoring. The BioActive Sensor tracks body composition, blood glucose trends, and advanced sleep insights to help you live better.',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    specifications: { 'Display': '44mm Super AMOLED Always-On', 'Health': 'BioActive Sensor, ECG', 'Battery': '40 hours', 'Water': '5ATM + IP68', 'Processor': 'Exynos W1000 3nm', 'OS': 'Wear OS 5' },
    warrantyMonths: 12, warrantyType: 'Official',
  },
  {
    name: 'Xiaomi Watch S3',
    slug: 'xiaomi-watch-s3',
    categorySlug: 'smartwatches',
    brandSlug: 'xiaomi',
    price: 14999, offerPrice: 12999, costPrice: 8500, stock: 40,
    isBestSeller: true, isFlashSale: true, soldCount: 280, viewCount: 5500,
    discountPercentage: 13, flashSaleEndTime: d(4),
    shortDesc: 'AMOLED, 15-day battery, 100+ sports modes – best budget smartwatch.',
    description: 'Xiaomi Watch S3 is a premium-looking smartwatch at an affordable price. The 1.43" AMOLED display is vibrant and crisp. With 15 days of battery life and 100+ sport modes, it is the ideal fitness companion.',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    specifications: { 'Display': '1.43" AMOLED', 'Battery': '15 days', 'Sport Modes': '100+', 'Health': 'Heart Rate, SpO2, Sleep', 'Water': '5ATM', 'Connectivity': 'Bluetooth 5.2' },
    warrantyMonths: 12, warrantyType: 'Official',
  },

  // ── Networking ────────────────────────────────────────────────────────────
  {
    name: 'TP-Link Archer AXE75 WiFi 6E',
    slug: 'tp-link-archer-axe75',
    categorySlug: 'routers-wifi',
    brandSlug: 'tp-link',
    price: 18500, offerPrice: 15999, costPrice: 10500, stock: 28,
    isBestSeller: true, soldCount: 162, viewCount: 2980,
    shortDesc: 'Tri-band WiFi 6E, AXE5400, 6GHz band for ultra-fast speeds.',
    description: 'Archer AXE75 opens the 6GHz band for ultra-high-speed connections. Tri-band AXE5400 with a 1.7GHz tri-core processor handles all connected devices without bottleneck.',
    images: ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600'],
    specifications: { 'Standard': 'WiFi 6E (802.11ax)', 'Speed': 'AXE5400', 'Processor': '1.7GHz Tri-Core', 'Ports': '4x Gigabit LAN + 1x 2.5G WAN', 'USB': 'USB 3.0', 'Antenna': '6 External' },
    warrantyMonths: 24, warrantyType: 'Service',
  },
  {
    name: 'TP-Link Deco XE75 Mesh WiFi 6E',
    slug: 'tp-link-deco-xe75-2pack',
    categorySlug: 'routers-wifi',
    brandSlug: 'tp-link',
    price: 22000, offerPrice: 18999, costPrice: 13000, stock: 20,
    soldCount: 88, viewCount: 1840,
    shortDesc: 'Whole-home Mesh WiFi 6E, AXE5400, covers 4000 sq ft (2-pack).',
    description: 'Deco XE75 eliminates WiFi dead zones with AXE5400 tri-band speeds. The 6GHz backhaul ensures stable connections between nodes. Covers up to 4000 sq ft with seamless roaming.',
    images: ['https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600'],
    specifications: { 'Standard': 'WiFi 6E', 'Speed': 'AXE5400', 'Coverage': '4000 sq ft (2 units)', 'Backhaul': 'Dedicated 6GHz', 'Ports': '1x 2.5G + 1x Gigabit/unit', 'Management': 'Deco App' },
    warrantyMonths: 24, warrantyType: 'Service',
  },

  // ── Cables & Chargers ─────────────────────────────────────────────────────
  {
    name: 'Anker 65W GaN Wall Charger (2-port)',
    slug: 'anker-65w-gan-charger-2port',
    categorySlug: 'cables-chargers',
    brandSlug: 'anker',
    price: 3500, offerPrice: 2999, costPrice: 1800, stock: 100,
    isBestSeller: true, isFlashSale: true, soldCount: 520, viewCount: 8600,
    discountPercentage: 14, flashSaleEndTime: d(5),
    shortDesc: 'Compact 65W GaN, charges laptop + phone simultaneously.',
    description: 'Anker 65W GaN Wall Charger delivers 65W through USB-C to charge your laptop at full speed, while simultaneously fast-charging a phone via the second port. 50% smaller than standard 65W chargers.',
    images: ['https://images.unsplash.com/photo-1625772452859-1c03d884dcd7?w=600'],
    specifications: { 'Power': '65W total (45W + 20W)', 'Ports': '2x USB-C', 'Technology': 'GaN II', 'Compatibility': 'MacBook, iPad, iPhone, Android' },
    warrantyMonths: 18, warrantyType: 'Service',
  },
  {
    name: 'Anker 240W USB-C to USB-C Cable 2m',
    slug: 'anker-240w-usbc-cable-2m',
    categorySlug: 'cables-chargers',
    brandSlug: 'anker',
    price: 1800, offerPrice: 1499, costPrice: 800, stock: 200,
    isBestSeller: true, soldCount: 680, viewCount: 9200,
    shortDesc: 'USB 2.0, 240W EPR, 10Gbps data transfer, nylon braided.',
    description: 'Anker 240W USB-C cable supports Extended Power Range (EPR) for charging up to 240W. Nylon braided for durability rated for 35,000 bends. 10Gbps data transfer speed.',
    images: ['https://images.unsplash.com/photo-1625772452859-1c03d884dcd7?w=600'],
    specifications: { 'Power': '240W EPR', 'Data': '10Gbps', 'Length': '2 meters', 'Material': 'Nylon braided', 'Compatibility': 'Universal USB-C' },
    warrantyMonths: 18, warrantyType: 'Service',
  },

  // ── Bags & Cases ──────────────────────────────────────────────────────────
  {
    name: 'Tomtoc 360° Protective Laptop Sleeve 15.6"',
    slug: 'tomtoc-360-laptop-sleeve-156',
    categorySlug: 'bags-cases',
    brandSlug: 'anker', // Using anker as proxy
    price: 3200, offerPrice: 2799, costPrice: 1600, stock: 60,
    soldCount: 198, viewCount: 2800,
    shortDesc: '360° protection, TSA-friendly, water-resistant, accessory pocket.',
    description: 'Tomtoc laptop sleeve with 360° military-grade protection for laptops up to 15.6". The CornerArmor technology absorbs corner shock. Water-resistant exterior with accessory organization inside.',
    images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'],
    specifications: { 'Size': 'Fits up to 15.6" laptops', 'Protection': '360° CornerArmor', 'Water Resistance': 'Yes', 'TSA Friendly': 'Yes', 'Material': 'Nylon exterior' },
    warrantyMonths: 12, warrantyType: 'Service',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 TechHat Dummy Product Seeder\n');

  // 1. Categories
  console.log('📁 Creating categories...');
  const categoryMap: Record<string, string> = {};

  for (const parent of CATEGORY_TREE) {
    let parentCat = await prisma.category.findUnique({ where: { slug: parent.slug } });
    if (!parentCat) {
      parentCat = await prisma.category.create({
        data: { name: parent.name, slug: parent.slug, image: parent.image, isActive: true, sortOrder: CATEGORY_TREE.indexOf(parent) },
      });
      console.log(`  ✅ [parent] ${parent.name}`);
    } else {
      console.log(`  ⏭  [parent] ${parent.name} (exists)`);
    }
    categoryMap[parent.slug] = parentCat.id;

    for (const child of parent.children ?? []) {
      let childCat = await prisma.category.findUnique({ where: { slug: child.slug } });
      if (!childCat) {
        childCat = await prisma.category.create({
          data: { name: child.name, slug: child.slug, image: child.image, parentId: parentCat.id, isActive: true, sortOrder: (parent.children ?? []).indexOf(child) },
        });
        console.log(`    ✅ ${child.name}`);
      } else {
        console.log(`    ⏭  ${child.name} (exists)`);
      }
      categoryMap[child.slug] = childCat.id;
    }
  }

  // 2. Brands
  console.log('\n🏷  Creating brands...');
  const brandMap: Record<string, string> = {};

  for (const b of BRAND_LIST) {
    let brand = await prisma.brand.findUnique({ where: { slug: b.slug } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: { name: b.name, slug: b.slug, isFeatured: b.isFeatured },
      });
      console.log(`  ✅ ${b.name}`);
    } else {
      console.log(`  ⏭  ${b.name} (exists)`);
    }
    brandMap[b.slug] = brand.id;
  }

  // 3. Products
  console.log('\n📦 Creating products...');
  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const categoryId = categoryMap[p.categorySlug];
    const brandId = brandMap[p.brandSlug];

    if (!categoryId || !brandId) {
      console.warn(`  ⚠️  Missing category/brand for "${p.name}" — skipped`);
      skipped++;
      continue;
    }

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`  ⏭  ${p.name} (exists)`);
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        categoryId,
        brandId,
        price: p.price,
        offerPrice: p.offerPrice ?? null,
        costPrice: p.costPrice,
        stock: p.stock,
        shortDesc: p.shortDesc,
        description: p.description,
        images: p.images,
        isFeatured: p.isFeatured ?? false,
        isActive: true,
        isFlashSale: p.isFlashSale ?? false,
        isBestSeller: p.isBestSeller ?? false,
        soldCount: p.soldCount ?? 0,
        viewCount: p.viewCount ?? 0,
        discountPercentage: p.discountPercentage ?? null,
        flashSaleEndTime: p.flashSaleEndTime ?? null,
        specifications: p.specifications ? p.specifications : undefined,
        warrantyMonths: p.warrantyMonths ?? 0,
        warrantyType: p.warrantyType ?? null,
        type: ProductType.PHYSICAL,
        productVariantType: 'simple',
      },
    });

    console.log(`  ✅ ${p.name}`);
    created++;
  }

  // Summary
  const [catCount, brandCount, prodCount] = await prisma.$transaction([
    prisma.category.count(),
    prisma.brand.count(),
    prisma.product.count(),
  ]);

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   Categories : ${catCount}`);
  console.log(`   Brands     : ${brandCount}`);
  console.log(`   Products   : ${prodCount} (${created} new, ${skipped} skipped)`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
