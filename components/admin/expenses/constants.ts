import { Banknote, CreditCard, Smartphone, Building2 } from 'lucide-react';

export const PAYMENT_METHODS = [
  { value: 'CASH', label: 'নগদ', icon: Banknote, color: 'text-green-600' },
  { value: 'CARD', label: 'কার্ড', icon: CreditCard, color: 'text-blue-600' },
  { value: 'MOBILE_BANKING', label: 'মোবাইল ব্যাংকিং', icon: Smartphone, color: 'text-purple-600' },
  { value: 'BANK_TRANSFER', label: 'ব্যাংক ট্রান্সফার', icon: Building2, color: 'text-indigo-600' },
];

export const MONTH_NAMES_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
export const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const DEFAULT_CATEGORIES = [
  { name: 'দোকান ভাড়া', icon: '🏠', color: '#EF4444' },
  { name: 'বিদ্যুৎ বিল', icon: '⚡', color: '#F59E0B' },
  { name: 'পানি বিল', icon: '💧', color: '#3B82F6' },
  { name: 'ইন্টারনেট বিল', icon: '🌐', color: '#8B5CF6' },
  { name: 'পরিবহন', icon: '🚗', color: '#10B981' },
  { name: 'মেরামত ও রক্ষণাবেক্ষণ', icon: '🔧', color: '#F97316' },
  { name: 'অফিস সাপ্লাই', icon: '📦', color: '#06B6D4' },
  { name: 'মার্কেটিং', icon: '📢', color: '#EC4899' },
  { name: 'খাবার ও আপ্যায়ন', icon: '🍽️', color: '#84CC16' },
  { name: 'অন্যান্য', icon: '📌', color: '#6B7280' },
];

export function formatCurrency(amount: number): string {
  return '৳' + amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHODS.find(m => m.value === method)?.label || method;
}

export function getPaymentMethodIcon(method: string) {
  return PAYMENT_METHODS.find(m => m.value === method)?.icon || Banknote;
}