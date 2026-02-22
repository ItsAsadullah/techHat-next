'use client';

import { useState } from 'react';
import { CreditCard, Save, Loader2, Smartphone, Building2, Banknote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  updatePaymentMethodSettings,
  type PaymentMethodSettings,
} from '@/lib/actions/invoice-settings-actions';

const METHODS = [
  { key: 'cash', label: 'Cash', icon: Banknote, desc: 'Accept cash payments at counter' },
  { key: 'card', label: 'Card / POS Machine', icon: CreditCard, desc: 'Debit & credit card via terminal' },
  { key: 'bkash', label: 'bKash', icon: Smartphone, desc: 'Mobile banking via bKash' },
  { key: 'nagad', label: 'Nagad', icon: Smartphone, desc: 'Mobile banking via Nagad' },
  { key: 'rocket', label: 'Rocket (DBBL)', icon: Smartphone, desc: 'Dutch-Bangla mobile banking' },
  { key: 'bank', label: 'Bank Transfer', icon: Building2, desc: 'Direct bank transfer / NPSB' },
];

export function PaymentSettingsClient({ initial }: { initial: PaymentMethodSettings }) {
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(initial.enabled);
  const [numbers, setNumbers] = useState<Record<string, string>>(initial.numbers);
  const [bankDetails, setBankDetails] = useState(initial.bankDetails);

  async function handleSave() {
    setSaving(true);
    const result = await updatePaymentMethodSettings({ enabled, numbers, bankDetails });
    setSaving(false);
    if (result.success) {
      toast.success('Payment settings saved to database');
    } else {
      toast.error('Save failed: ' + result.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-xl"><CreditCard className="w-5 h-5 text-green-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Payment Methods</h2>
            <p className="text-sm text-gray-500">Configure accepted payment channels — saved to database</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Method toggles */}
      <div className="space-y-3">
        {METHODS.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.desc}</p>
                </div>
              </div>
              <Switch
                checked={!!enabled[m.key]}
                onCheckedChange={(v) => setEnabled({ ...enabled, [m.key]: v })}
              />
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Mobile banking numbers */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Mobile Banking Merchant Numbers</h3>
        {(['bkash', 'nagad', 'rocket'] as const).map((key) =>
          enabled[key] ? (
            <div key={key} className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 capitalize">{key} Number</Label>
              <Input
                placeholder="01XXXXXXXXX"
                value={numbers[key] ?? ''}
                onChange={(e) => setNumbers({ ...numbers, [key]: e.target.value })}
                className="rounded-xl max-w-xs"
              />
            </div>
          ) : null
        )}
        {!enabled.bkash && !enabled.nagad && !enabled.rocket && (
          <p className="text-xs text-gray-400 italic">Enable a mobile banking method above to configure its number.</p>
        )}
      </div>

      {enabled.bank && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Bank Account Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                { label: 'Bank Name', key: 'name', placeholder: 'Dutch-Bangla Bank' },
                { label: 'Account Number', key: 'account', placeholder: '1234567890' },
                { label: 'Branch Name', key: 'branch', placeholder: 'Mohakhali Branch' },
                { label: 'Routing Number', key: 'routing', placeholder: '090272203' },
              ] as const).map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">{f.label}</Label>
                  <Input
                    placeholder={f.placeholder}
                    value={bankDetails[f.key] ?? ''}
                    onChange={(e) => setBankDetails({ ...bankDetails, [f.key]: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
