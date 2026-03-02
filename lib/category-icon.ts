
import type { ElementType } from 'react';
import {
  Smartphone, Laptop, Tablet, Tv, Tv2, Monitor, Watch, Camera, Headphones, Speaker,
  Keyboard, Mouse, Printer, Cpu, HardDrive, HardDriveUpload, Server, Wifi, Bluetooth, Battery,
  BatteryCharging, BatteryFull, Gamepad2, Joystick, RadioTower, MemoryStick, CircuitBoard, Zap,
  // New electronics
  Headset, Phone, PlugZap, Plug, Power, Volume2, Radio, AudioLines,
  Lightbulb, LampDesk, LampFloor, Webcam, Video, Cable, Mic, MicVocal,
  ScanLine, Router, PcCase, Projector, Flashlight, ScreenShare, Cast,
  MonitorPlay, MonitorSmartphone, Cctv, Usb, Antenna, Signal, Nfc,
  // Shopping & Commerce
  ShoppingBag, ShoppingCart, Package, Tag, Gift, Truck, Barcode,
  // Fashion & Apparel
  Shirt, Crown, Gem, Glasses, Backpack, Umbrella,
  // Home & Living
  Home, Sofa, Bed, Bath, Lamp, UtensilsCrossed, Refrigerator, WashingMachine, AirVent,
  // Tools & Hardware
  Wrench, Hammer, Paintbrush, Scissors,
  // Sports & Outdoors
  Dumbbell, Trophy, Bike, Mountain, Tent,
  // Auto & Transport
  Car, Plane, Ship,
  // Books & Education
  BookOpen, GraduationCap, PenTool,
  // Music & Entertainment
  Music, Film, Disc,
  // Food & Health
  Coffee, Apple, Pill, Heart, Activity,
  // Beauty & Personal Care
  Sparkles, Flower2, Droplets,
  // Kids & Pets
  Baby, PawPrint,
  // General
  Globe, Star, Leaf, Sun, Snowflake, Box, LayoutGrid,
} from 'lucide-react';

/**
 * Explicit icon map -- replaces wildcard import (loads ~1.2 MB).
 * Tree-shaking now works correctly, reducing client-side JS bundle significantly.
 */
export const ICON_MAP: Record<string, ElementType> = {
  Smartphone, Laptop, Tablet, Tv, Tv2, Monitor, Watch, Camera, Headphones, Speaker,
  Keyboard, Mouse, Printer, Cpu, HardDrive, HardDriveUpload, Server, Wifi, Bluetooth, Battery,
  BatteryCharging, BatteryFull, Gamepad2, Joystick, RadioTower, MemoryStick, CircuitBoard, Zap,
  Headset, Phone, PlugZap, Plug, Power, Volume2, Radio, AudioLines,
  Lightbulb, LampDesk, LampFloor, Webcam, Video, Cable, Mic, MicVocal,
  ScanLine, Router, PcCase, Projector, Flashlight, ScreenShare, Cast,
  MonitorPlay, MonitorSmartphone, Cctv, Usb, Antenna, Signal, Nfc,
  ShoppingBag, ShoppingCart, Package, Tag, Gift, Truck, Barcode,
  Shirt, Crown, Gem, Glasses, Backpack, Umbrella,
  Home, Sofa, Bed, Bath, Lamp, UtensilsCrossed, Refrigerator, WashingMachine, AirVent,
  Wrench, Hammer, Paintbrush, Scissors,
  Dumbbell, Trophy, Bike, Mountain, Tent,
  Car, Plane, Ship,
  BookOpen, GraduationCap, PenTool,
  Music, Film, Disc,
  Coffee, Apple, Pill, Heart, Activity,
  Sparkles, Flower2, Droplets,
  Baby, PawPrint,
  Globe, Star, Leaf, Sun, Snowflake, Box, LayoutGrid,
};

/**
 * Utility for category icon detection and rendering.
 * Categories store either:
 *   - A lucide-react icon name (e.g., "Smartphone") — no slashes, no dots, no http
 *   - An image URL (http/https/data:/relative path)
 */

export function isLucideIcon(value: string | null | undefined): boolean {
  if (!value) return false;
  if (value.startsWith('http') || value.startsWith('/') || value.startsWith('data:')) return false;
  if (value.includes('.')) return false;
  return true;
}

/** Curated list of lucide-react icons for e-commerce categories */
export const CATEGORY_ICON_LIST = [
  // ── Tech & Electronics ─────────────────────────────────────────────────────
  { name: 'Smartphone',       label: 'Smartphone' },
  { name: 'Phone',            label: 'বাটন মোবাইল / Feature Phone' },
  { name: 'MonitorSmartphone',label: 'Mobile + Screen' },
  { name: 'Laptop',           label: 'Laptop' },
  { name: 'Tablet',           label: 'Tablet' },
  { name: 'Tv',               label: 'Television' },
  { name: 'Tv2',              label: 'Smart TV / Android TV' },
  { name: 'MonitorPlay',      label: 'TV Box / Media Player' },
  { name: 'Cast',             label: 'Cast / Streaming Box' },
  { name: 'Monitor',          label: 'Monitor' },
  { name: 'Watch',            label: 'Smart Watch' },
  { name: 'Projector',        label: 'Projector' },
  // ── Audio & Sound ───────────────────────────────────────────────────────────
  { name: 'Headphones',       label: 'Headphones (Wired)' },
  { name: 'Headset',          label: 'Bluetooth Headphone / Earphone' },
  { name: 'Mic',              label: 'Microphone' },
  { name: 'MicVocal',         label: 'Vocal Mic / Condenser' },
  { name: 'Speaker',          label: 'Speaker' },
  { name: 'Volume2',          label: 'Sound Box / Subwoofer' },
  { name: 'Radio',            label: 'Radio / Sound System' },
  { name: 'AudioLines',       label: 'Audio / Sound Wave' },
  // ── Camera & Video ──────────────────────────────────────────────────────────
  { name: 'Camera',           label: 'Camera' },
  { name: 'Webcam',           label: 'Webcam' },
  { name: 'Video',            label: 'Camcorder / Video Camera' },
  { name: 'Cctv',             label: 'CCTV / Security Camera' },
  // ── Power & Charging ────────────────────────────────────────────────────────
  { name: 'BatteryCharging',  label: 'চার্জার / Charger' },
  { name: 'PlugZap',          label: 'Power Adapter / Charger' },
  { name: 'Plug',             label: 'Power Plug' },
  { name: 'Power',            label: 'পাওয়ার সাপ্লাই / Power Supply' },
  { name: 'Battery',          label: 'Battery' },
  { name: 'BatteryFull',      label: 'Battery Full' },
  { name: 'Zap',              label: 'Electricity / Fast Charge' },
  // ── Lighting ────────────────────────────────────────────────────────────────
  { name: 'Lightbulb',        label: 'লাইট / Light Bulb' },
  { name: 'LampDesk',         label: 'Desk Lamp' },
  { name: 'LampFloor',        label: 'Floor Lamp' },
  { name: 'Flashlight',       label: 'Flashlight / Torch' },
  // ── Computer & Peripherals ──────────────────────────────────────────────────
  { name: 'Keyboard',         label: 'Keyboard' },
  { name: 'Mouse',            label: 'Mouse' },
  { name: 'Printer',          label: 'Printer' },
  { name: 'ScanLine',         label: 'Scanner' },
  { name: 'PcCase',           label: 'Desktop PC / Cabinet' },
  { name: 'Cpu',              label: 'CPU / Processor' },
  { name: 'CircuitBoard',     label: 'Motherboard / Circuit' },
  { name: 'HardDrive',        label: 'Hard Drive (HDD)' },
  { name: 'HardDriveUpload',  label: 'SSD / Flash Drive' },
  { name: 'MemoryStick',      label: 'RAM / Memory' },
  { name: 'Usb',              label: 'USB / Interface' },
  { name: 'Cable',            label: 'Cable / Wire' },
  { name: 'ScreenShare',      label: 'Screen Share / Display' },
  // ── Networking & Connectivity ───────────────────────────────────────────────
  { name: 'Wifi',             label: 'WiFi / Wireless' },
  { name: 'Router',           label: 'Router / Modem' },
  { name: 'Bluetooth',        label: 'Bluetooth' },
  { name: 'Antenna',          label: 'Antenna / Signal Booster' },
  { name: 'Signal',           label: 'Network Signal' },
  { name: 'Nfc',              label: 'NFC' },
  { name: 'RadioTower',       label: 'Tower / Broadcast' },
  { name: 'Server',           label: 'Server / Data Center' },
  // ── Gaming ──────────────────────────────────────────────────────────────────
  { name: 'Gamepad2',         label: 'Gaming Controller' },
  { name: 'Joystick',         label: 'Joystick' },
  // ── Shopping & Commerce ─────────────────────────────────────────────────────
  { name: 'ShoppingBag',      label: 'Shopping Bag' },
  { name: 'ShoppingCart',     label: 'Shopping Cart' },
  { name: 'Package',          label: 'Package / Box' },
  { name: 'Tag',              label: 'Tag / Label' },
  { name: 'Gift',             label: 'Gift' },
  { name: 'Truck',            label: 'Delivery' },
  { name: 'Barcode',          label: 'Barcode' },
  // ── Fashion & Apparel ───────────────────────────────────────────────────────
  { name: 'Shirt',            label: 'Clothing / Shirt' },
  { name: 'Crown',            label: 'Premium / Crown' },
  { name: 'Gem',              label: 'Jewelry / Gem' },
  { name: 'Glasses',          label: 'Eyewear / Glasses' },
  { name: 'Backpack',         label: 'Backpack / Bag' },
  { name: 'Umbrella',         label: 'Umbrella' },
  // ── Home & Living ───────────────────────────────────────────────────────────
  { name: 'Home',             label: 'Home' },
  { name: 'Sofa',             label: 'Furniture / Sofa' },
  { name: 'Bed',              label: 'Bedroom' },
  { name: 'Bath',             label: 'Bathroom' },
  { name: 'Lamp',             label: 'Lamp' },
  { name: 'UtensilsCrossed',  label: 'Kitchen' },
  { name: 'Refrigerator',     label: 'Refrigerator / Fridge' },
  { name: 'WashingMachine',   label: 'Washing Machine' },
  { name: 'AirVent',          label: 'AC / Air Conditioner' },
  // ── Tools & Hardware ────────────────────────────────────────────────────────
  { name: 'Wrench',           label: 'Tools / Wrench' },
  { name: 'Hammer',           label: 'Hammer' },
  { name: 'Paintbrush',       label: 'Painting / Art' },
  { name: 'Scissors',         label: 'Scissors' },
  // ── Sports & Outdoors ───────────────────────────────────────────────────────
  { name: 'Dumbbell',         label: 'Gym / Fitness' },
  { name: 'Trophy',           label: 'Trophy / Awards' },
  { name: 'Bike',             label: 'Cycling' },
  { name: 'Mountain',         label: 'Outdoor / Mountain' },
  { name: 'Tent',             label: 'Camping' },
  // ── Auto & Transport ────────────────────────────────────────────────────────
  { name: 'Car',              label: 'Automotive / Car' },
  { name: 'Plane',            label: 'Travel / Plane' },
  { name: 'Ship',             label: 'Marine' },
  // ── Books & Education ───────────────────────────────────────────────────────
  { name: 'BookOpen',         label: 'Books / Education' },
  { name: 'GraduationCap',    label: 'Education / Course' },
  { name: 'PenTool',          label: 'Stationery' },
  // ── Music & Entertainment ───────────────────────────────────────────────────
  { name: 'Music',            label: 'Music' },
  { name: 'Film',             label: 'Movies / Video' },
  { name: 'Disc',             label: 'CD / Disc' },
  // ── Food & Health ───────────────────────────────────────────────────────────
  { name: 'Coffee',           label: 'Coffee / Drinks' },
  { name: 'Apple',            label: 'Groceries / Food' },
  { name: 'Pill',             label: 'Pharmacy / Medicine' },
  { name: 'Heart',            label: 'Health / Wellness' },
  { name: 'Activity',         label: 'Fitness / Activity' },
  // ── Beauty & Personal Care ──────────────────────────────────────────────────
  { name: 'Sparkles',         label: 'Beauty / Cosmetics' },
  { name: 'Flower2',          label: 'Flowers / Nature' },
  { name: 'Droplets',         label: 'Skincare / Water' },
  // ── Kids & Pets ─────────────────────────────────────────────────────────────
  { name: 'Baby',             label: 'Baby / Kids' },
  { name: 'PawPrint',         label: 'Pets / Animals' },
  // ── General ─────────────────────────────────────────────────────────────────
  { name: 'Globe',            label: 'Global / International' },
  { name: 'Star',             label: 'Featured / Special' },
  { name: 'Leaf',             label: 'Eco / Nature' },
  { name: 'Sun',              label: 'Summer / Outdoor' },
  { name: 'Snowflake',        label: 'Winter / Cold' },
  { name: 'Box',              label: 'Accessories' },
  { name: 'LayoutGrid',       label: 'All Categories' },
];
