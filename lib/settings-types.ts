// Shared types and constants for settings — NOT a server action file

export interface POSConfig {
  pos_enable_tax: boolean;
  pos_tax_rate: string;
  pos_currency_symbol: string;
  pos_receipt_header: string;
  pos_receipt_footer: string;
  pos_enable_due_system: boolean;
  pos_enable_mixed_payment: boolean;
  pos_auto_print_receipt: boolean;
  pos_enable_barcode_scanner: boolean;
  pos_round_off_totals: boolean;
  pos_low_stock_threshold: string;
  pos_max_discount: string;
  pos_require_discount_auth: boolean;
  pos_default_payment_method: string;
  pos_receipt_width: string;
  pos_enable_customer_db: boolean;
  pos_allow_negative_stock: boolean;
  pos_sound_effects: boolean;
}

export const DEFAULT_POS: POSConfig = {
  pos_enable_tax: false,
  pos_tax_rate: '0',
  pos_currency_symbol: '৳',
  pos_receipt_header: 'TechHat',
  pos_receipt_footer: 'Thank you for shopping!',
  pos_enable_due_system: true,
  pos_enable_mixed_payment: true,
  pos_auto_print_receipt: false,
  pos_enable_barcode_scanner: true,
  pos_round_off_totals: false,
  pos_low_stock_threshold: '5',
  pos_max_discount: '50',
  pos_require_discount_auth: false,
  pos_default_payment_method: 'CASH',
  pos_receipt_width: '80',
  pos_enable_customer_db: true,
  pos_allow_negative_stock: false,
  pos_sound_effects: true,
};
