
import type { ElementType } from 'react';
import {
  Smartphone, Laptop, Tablet, Tv, Monitor, Watch, Camera, Headphones, Speaker,
  Keyboard, Mouse, Printer, Cpu, HardDrive, Server, Wifi, Bluetooth, Battery,
  Gamepad2, Joystick, RadioTower, MemoryStick, CircuitBoard, Zap,
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
} from 'lucide-react';

/**
 * Explicit icon map -- replaces wildcard import (loads ~1.2 MB).
 * Tree-shaking now works correctly, reducing client-side JS bundle significantly.
 */
export const ICON_MAP: Record<string, ElementType> = {
  Smartphone, Laptop, Tablet, Tv, Monitor, Watch, Camera, Headphones, Speaker,
  Keyboard, Mouse, Printer, Cpu, HardDrive, Server, Wifi, Bluetooth, Battery,
  Gamepad2, Joystick, RadioTower, MemoryStick, CircuitBoard, Zap,
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
  // Tech & Electronics
  { name: 'Smartphone',      label: 'Smartphone' },
  { name: 'Laptop',          label: 'Laptop' },
  { name: 'Tablet',          label: 'Tablet' },
  { name: 'Tv',              label: 'Television' },
  { name: 'Monitor',         label: 'Monitor' },
  { name: 'Watch',           label: 'Smart Watch' },
  { name: 'Camera',          label: 'Camera' },
  { name: 'Headphones',      label: 'Headphones' },
  { name: 'Speaker',         label: 'Speaker' },
  { name: 'Keyboard',        label: 'Keyboard' },
  { name: 'Mouse',           label: 'Mouse' },
  { name: 'Printer',         label: 'Printer' },
  { name: 'Cpu',             label: 'CPU / Processor' },
  { name: 'HardDrive',       label: 'Hard Drive' },
  { name: 'Server',          label: 'Server' },
  { name: 'Wifi',            label: 'WiFi / Networking' },
  { name: 'Bluetooth',       label: 'Bluetooth' },
  { name: 'Battery',         label: 'Battery' },
  { name: 'Usb',             label: 'USB' },
  { name: 'Gamepad2',        label: 'Gaming' },
  { name: 'Joystick',        label: 'Joystick' },
  { name: 'RadioTower',      label: 'Radio / Signal' },
  { name: 'MemoryStick',     label: 'Memory / Storage' },
  { name: 'CircuitBoard',    label: 'Circuit Board' },
  // Shopping & Commerce
  { name: 'ShoppingBag',     label: 'Shopping Bag' },
  { name: 'ShoppingCart',    label: 'Shopping Cart' },
  { name: 'Package',         label: 'Package / Box' },
  { name: 'Tag',             label: 'Tag / Label' },
  { name: 'Gift',            label: 'Gift' },
  { name: 'Truck',           label: 'Delivery' },
  { name: 'Barcode',         label: 'Barcode' },
  // Fashion & Apparel
  { name: 'Shirt',           label: 'Clothing / Shirt' },
  { name: 'Crown',           label: 'Premium / Crown' },
  { name: 'Gem',             label: 'Jewelry / Gem' },
  { name: 'Glasses',         label: 'Eyewear / Glasses' },
  { name: 'footprints',      label: 'Footwear' },
  { name: 'Backpack',        label: 'Backpack / Bag' },
  { name: 'Umbrella',        label: 'Umbrella' },
  // Home & Living
  { name: 'Home',            label: 'Home' },
  { name: 'Sofa',            label: 'Furniture / Sofa' },
  { name: 'Bed',             label: 'Bedroom' },
  { name: 'Bath',            label: 'Bathroom' },
  { name: 'Lamp',            label: 'Lamp / Lighting' },
  { name: 'UtensilsCrossed', label: 'Kitchen' },
  { name: 'Refrigerator',    label: 'Refrigerator' },
  { name: 'WashingMachine',  label: 'Washing Machine' },
  { name: 'AirVent',         label: 'Air Conditioner' },
  // Tools & Hardware
  { name: 'Wrench',          label: 'Tools / Wrench' },
  { name: 'Hammer',          label: 'Hammer' },
  { name: 'Paintbrush',      label: 'Painting / Art' },
  { name: 'Scissors',        label: 'Scissors' },
  // Sports & Outdoors
  { name: 'Dumbbell',        label: 'Gym / Fitness' },
  { name: 'Trophy',          label: 'Trophy / Awards' },
  { name: 'Bike',            label: 'Cycling' },
  { name: 'Mountain',        label: 'Outdoor / Mountain' },
  { name: 'Tent',            label: 'Camping' },
  { name: 'Zap',             label: 'Energy / Power' },
  // Auto & Transport
  { name: 'Car',             label: 'Automotive / Car' },
  { name: 'Plane',           label: 'Travel / Plane' },
  { name: 'Ship',            label: 'Marine' },
  // Books & Education
  { name: 'BookOpen',        label: 'Books / Education' },
  { name: 'GraduationCap',   label: 'Education' },
  { name: 'PenTool',         label: 'Stationery' },
  // Music & Entertainment
  { name: 'Music',           label: 'Music' },
  { name: 'Film',            label: 'Movies / Video' },
  { name: 'Disc',            label: 'CD / Disc' },
  // Food & Health
  { name: 'Coffee',          label: 'Coffee / Drinks' },
  { name: 'UtensilsCrossed', label: 'Food' },
  { name: 'Apple',           label: 'Groceries' },
  { name: 'Pill',            label: 'Pharmacy / Medicine' },
  { name: 'Heart',           label: 'Health / Wellness' },
  { name: 'Activity',        label: 'Fitness / Activity' },
  // Beauty & Personal Care
  { name: 'Sparkles',        label: 'Beauty / Cosmetics' },
  { name: 'Flower2',         label: 'Flowers / Nature' },
  { name: 'Droplets',        label: 'Skincare / Water' },
  // Kids & Pets
  { name: 'Baby',            label: 'Baby / Kids' },
  { name: 'PawPrint',        label: 'Pets / Animals' },
  { name: 'Toy',             label: 'Toys' },
  // General
  { name: 'Globe',           label: 'Global / International' },
  { name: 'Star',            label: 'Featured / Special' },
  { name: 'Leaf',            label: 'Eco / Nature' },
  { name: 'Sun',             label: 'Summer / Outdoor' },
  { name: 'Snowflake',       label: 'Winter / Cold' },
  { name: 'Box',             label: 'Accessories' },
  { name: 'LayoutGrid',      label: 'All Categories' },
];
