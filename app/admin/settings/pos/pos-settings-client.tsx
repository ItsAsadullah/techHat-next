'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Save, MonitorSpeaker, Receipt, Wallet, Tag, PackageSearch,
  ScanBarcode, Printer, CreditCard, Layers, Settings2,
} from 'lucide-react';
import { savePOSConfig } from '@/lib/actions/settings-actions';
import { type POSConfig } from '@/lib/settings-types';

interface Props {
  initial: POSConfig;
}

type ToggleKey = {
  [K in keyof POSConfig]: POSConfig[K] extends boolean ? K : never;
}[keyof POSConfig];

export function POSSettingsClient({ initial }: Props) {
  const [cfg, setCfg] = useState<POSConfig>(initial);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof POSConfig>(k: K, v: POSConfig[K]) =>
    setCfg((p) => ({ ...p, [k]: v }));

  const toggle = (k: ToggleKey) => setCfg((p) => ({ ...p, [k]: !p[k] }));

  const handleSave = async () => {
    setSaving(true);
    const res = await savePOSConfig(cfg);
    setSaving(false);
    if (res.success) toast.success('POS settings saved');
    else toast.error(`Failed to save: ${res.error}`);
  };

  const SwitchRow = ({
    label, desc, field,
  }: { label: string; desc: string; field: ToggleKey }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <Switch checked={cfg[field] as boolean} onCheckedChange={() => toggle(field)} />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-blue-600" />
            POS Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure point of sale system behavior</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      {/* ── Hardware & Scanner ─────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ScanBarcode className="h-5 w-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Hardware &amp; Scanner</h2>
        </div>
        <div className="divide-y">
          <SwitchRow
            label="Enable Barcode Scanner"
            desc="Auto-focus barcode input on POS load; trigger search on scan"
            field="pos_enable_barcode_scanner"
          />
          <SwitchRow
            label="Sound Effects"
            desc="Play beep when a product is scanned or added"
            field="pos_sound_effects"
          />
          <div className="py-3">
            <Label className="text-sm font-medium">Receipt Paper Width</Label>
            <p className="text-xs text-gray-500 mb-2">Select thermal printer paper width</p>
            <Select
              value={cfg.pos_receipt_width}
              onValueChange={(v) => set('pos_receipt_width', v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58">58 mm (compact)</SelectItem>
                <SelectItem value="80">80 mm (standard)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ── Payment ───────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="h-5 w-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Payment</h2>
        </div>
        <div className="divide-y">
          <div className="py-3">
            <Label className="text-sm font-medium">Default Payment Method</Label>
            <p className="text-xs text-gray-500 mb-2">Pre-selected method when opening the payment dialog</p>
            <Select
              value={cfg.pos_default_payment_method}
              onValueChange={(v) => set('pos_default_payment_method', v)}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="BKASH">bKash</SelectItem>
                <SelectItem value="NAGAD">Nagad</SelectItem>
                <SelectItem value="ROCKET">Rocket</SelectItem>
                <SelectItem value="BANK">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SwitchRow
            label="Enable Due / Credit System"
            desc="Allow customers to purchase on credit and carry a balance"
            field="pos_enable_due_system"
          />
          <SwitchRow
            label="Enable Mixed Payments"
            desc="Split a single sale across multiple payment methods"
            field="pos_enable_mixed_payment"
          />
        </div>
      </Card>

      {/* ── Receipt ───────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Printer className="h-5 w-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Receipt</h2>
        </div>
        <div className="space-y-4">
          <SwitchRow
            label="Auto-Print Receipt"
            desc="Automatically send to printer after each sale"
            field="pos_auto_print_receipt"
          />
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Label>Currency Symbol</Label>
              <Input
                value={cfg.pos_currency_symbol}
                onChange={(e) => set('pos_currency_symbol', e.target.value)}
                className="mt-1 max-w-xs"
              />
            </div>
          </div>
          <div>
            <Label>Receipt Header</Label>
            <Input
              value={cfg.pos_receipt_header}
              onChange={(e) => set('pos_receipt_header', e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Shown at the top of every receipt</p>
          </div>
          <div>
            <Label>Receipt Footer</Label>
            <Textarea
              value={cfg.pos_receipt_footer}
              onChange={(e) => set('pos_receipt_footer', e.target.value)}
              rows={2}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Shown at the bottom — thank you message, return policy, etc.</p>
          </div>
        </div>
      </Card>

      {/* ── Tax & Rounding ────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Tax &amp; Rounding</h2>
        </div>
        <div className="divide-y">
          <SwitchRow
            label="Enable Tax Calculation"
            desc="Apply tax on top of item prices in POS"
            field="pos_enable_tax"
          />
          {cfg.pos_enable_tax && (
            <div className="py-3">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                value={cfg.pos_tax_rate}
                onChange={(e) => set('pos_tax_rate', e.target.value)}
                min="0"
                max="100"
                step="0.01"
                className="mt-1 max-w-xs"
              />
            </div>
          )}
          <SwitchRow
            label="Round Off Totals"
            desc="Round grand total to nearest whole number"
            field="pos_round_off_totals"
          />
        </div>
      </Card>

      {/* ── Discounts ─────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-5 w-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Discounts</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Maximum Discount (%)</Label>
            <Input
              type="number"
              value={cfg.pos_max_discount}
              onChange={(e) => set('pos_max_discount', e.target.value)}
              min="0"
              max="100"
              className="mt-1 max-w-xs"
            />
            <p className="text-xs text-gray-500 mt-1">Cashiers cannot apply discounts above this limit</p>
          </div>
          <SwitchRow
            label="Require Authorization for Discounts"
            desc="Manager PIN required when discount exceeds the limit"
            field="pos_require_discount_auth"
          />
        </div>
      </Card>

      {/* ── Inventory ─────────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <PackageSearch className="h-5 w-5 text-gray-600" />
          <h2 className="text-base font-semibold text-gray-900">Inventory</h2>
        </div>
        <div className="divide-y">
          <div className="py-3">
            <Label>Low Stock Warning Threshold</Label>
            <p className="text-xs text-gray-500 mb-2">Show warning badge when stock falls below this value</p>
            <Input
              type="number"
              value={cfg.pos_low_stock_threshold}
              onChange={(e) => set('pos_low_stock_threshold', e.target.value)}
              min="0"
              className="max-w-xs"
            />
          </div>
          <SwitchRow
            label="Allow Negative Stock"
            desc="Let cashiers sell products even when stock reaches zero"
            field="pos_allow_negative_stock"
          />
          <SwitchRow
            label="Enable Customer Database"
            desc="Search and link customers to POS sales"
            field="pos_enable_customer_db"
          />
        </div>
      </Card>

      {/* Bottom save */}
      <div className="flex justify-end pb-10">
        <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
          <Save className="h-5 w-5" />
          {saving ? 'Saving…' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
