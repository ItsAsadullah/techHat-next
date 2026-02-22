'use client';

import { useState, useEffect } from 'react';
import {
  Bell, Save, Loader2, ShoppingCart, Package, Users, Wallet,
  Mail, MessageSquare, Eye, EyeOff, CheckCircle2, Globe,
  Key, Smartphone, Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { upsertManySettings, getSettingsByCategory } from '@/lib/actions/settings-actions';

interface NotifGroup {
  key: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  options: { key: string; label: string }[];
}

const GROUPS: NotifGroup[] = [
  {
    key: 'orders', icon: ShoppingCart, title: 'Orders & Sales',
    desc: 'Notifications related to new orders and sales',
    options: [
      { key: 'newOrder', label: 'New order placed' },
      { key: 'orderStatus', label: 'Order status changed' },
      { key: 'orderCancelled', label: 'Order cancelled' },
      { key: 'orderReturn', label: 'Return / refund request' },
    ],
  },
  {
    key: 'stock', icon: Package, title: 'Stock Alerts',
    desc: 'Inventory and product stock notifications',
    options: [
      { key: 'lowStock', label: 'Low stock alert' },
      { key: 'outOfStock', label: 'Out of stock alert' },
      { key: 'stockAdded', label: 'New stock added' },
    ],
  },
  {
    key: 'customers', icon: Users, title: 'Customers',
    desc: 'Customer activity and due alerts',
    options: [
      { key: 'newCustomer', label: 'New customer registered' },
      { key: 'customerDue', label: 'Customer due exceeds limit' },
    ],
  },
  {
    key: 'finance', icon: Wallet, title: 'Finance & Expenses',
    desc: 'Payment and expense notifications',
    options: [
      { key: 'paymentReceived', label: 'Payment received' },
      { key: 'expenseAdded', label: 'New expense recorded' },
      { key: 'vendorDue', label: 'Vendor payment due' },
    ],
  },
];

const NOTIF_DEFAULTS: Record<string, boolean> = {
  newOrder: true, orderStatus: true, orderCancelled: true, orderReturn: false,
  lowStock: true, outOfStock: true, stockAdded: false,
  newCustomer: false, customerDue: true,
  paymentReceived: true, expenseAdded: false, vendorDue: true,
};

interface IntegrationField {
  key: string; label: string; placeholder: string; help: string;
  icon: React.ElementType; secret?: boolean; section: 'store' | 'email' | 'sms';
}

const INTEGRATION_FIELDS: IntegrationField[] = [
  { key: 'store_name',    label: 'Store Name',    placeholder: 'TechHat', help: 'Shown in email headers and SMS messages', icon: Store, section: 'store' },
  { key: 'store_email',   label: 'Sender Email',  placeholder: 'noreply@techhat.com.bd', help: 'Emails will be sent from this address', icon: Mail, section: 'store' },
  { key: 'app_url',       label: 'Website URL',   placeholder: 'https://techhat.com.bd', help: 'Used to build order tracking links in emails', icon: Globe, section: 'store' },
  { key: 'resend_api_key', label: 'Resend API Key', placeholder: 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxx', help: 'Get your free API key from resend.com — 3,000 emails/month free', icon: Key, secret: true, section: 'email' },
  { key: 'sms_api_key',   label: 'SMS API Key',   placeholder: 'Your SMS provider API key', help: 'Supports Twilio, Infobip, BulkSMS BD, etc.', icon: Key, secret: true, section: 'sms' },
  { key: 'sms_api_url',   label: 'SMS API URL',   placeholder: 'https://api.bulksmsbd.net/api/smsapi', help: 'The POST endpoint of your SMS provider', icon: Smartphone, section: 'sms' },
];

const INTEGRATION_DEFAULTS: Record<string, string> = {
  store_name: '', store_email: '', app_url: '', resend_api_key: '', sms_api_key: '', sms_api_url: '',
};

function SecretInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'} value={value}
        onChange={e => onChange(e.target.value)} placeholder={placeholder}
        autoComplete="off"
        className="w-full pr-10 pl-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 font-mono bg-gray-50 placeholder:font-sans placeholder:text-gray-400 transition"
      />
      <button type="button" onClick={() => setShow(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const [tab, setTab] = useState<'toggles' | 'integrations'>('toggles');
  const [toggles, setToggles] = useState<Record<string, boolean>>(NOTIF_DEFAULTS);
  const [savingToggles, setSavingToggles] = useState(false);
  const [integrations, setIntegrations] = useState<Record<string, string>>(INTEGRATION_DEFAULTS);
  const [savingIntegrations, setSavingIntegrations] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    getSettingsByCategory('notifications').then((rows: any[]) => {
      if (!rows?.length) return;
      const map: Record<string, boolean> = { ...NOTIF_DEFAULTS };
      rows.forEach((r: any) => { map[r.key.replace('notif_', '')] = r.value === 'true'; });
      setToggles(map);
    });
    getSettingsByCategory('integrations').then((rows: any[]) => {
      if (!rows?.length) return;
      const map: Record<string, string> = { ...INTEGRATION_DEFAULTS };
      rows.forEach((r: any) => { map[r.key.replace('integration_', '')] = r.value; });
      setIntegrations(map);
    });
  }, []);

  async function handleSaveToggles() {
    setSavingToggles(true);
    try {
      await upsertManySettings(Object.entries(toggles).map(([k, v]) => ({ key: `notif_${k}`, value: String(v), category: 'notifications', description: k })));
      toast.success('Notification settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSavingToggles(false); }
  }

  async function handleSaveIntegrations() {
    setSavingIntegrations(true);
    try {
      await upsertManySettings(Object.entries(integrations).map(([k, v]) => ({ key: `integration_${k}`, value: v, category: 'integrations', description: k })));
      toast.success('Integration settings saved');
    } catch { toast.error('Failed to save'); }
    finally { setSavingIntegrations(false); }
  }

  async function handleTestEmail() {
    if (!integrations.resend_api_key) { toast.error('Enter your Resend API key first'); return; }
    if (!integrations.store_email) { toast.error('Enter a sender email address first'); return; }
    setTestingEmail(true);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: integrations.resend_api_key, fromEmail: integrations.store_email, storeName: integrations.store_name || 'TechHat' }),
      });
      const data = await res.json();
      if (data.success) toast.success('Test email sent! Check your inbox.');
      else toast.error(data.error || 'Failed to send test email');
    } catch { toast.error('Connection error'); }
    finally { setTestingEmail(false); }
  }

  const intFields = (section: IntegrationField['section']) => INTEGRATION_FIELDS.filter(f => f.section === section);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-xl"><Bell className="w-5 h-5 text-yellow-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500">Manage alerts and email/SMS integrations</p>
          </div>
        </div>
        {tab === 'toggles'
          ? <Button onClick={handleSaveToggles} disabled={savingToggles} className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl gap-2">
              {savingToggles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </Button>
          : <Button onClick={handleSaveIntegrations} disabled={savingIntegrations} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2">
              {savingIntegrations ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </Button>
        }
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[{ id: 'toggles', label: 'Alert Toggles', icon: Bell }, { id: 'integrations', label: 'Email & SMS Setup', icon: Mail }].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Toggles */}
      {tab === 'toggles' && (
        <div className="space-y-6">
          {GROUPS.map((g, gi) => {
            const Icon = g.icon;
            return (
              <div key={g.key}>
                {gi > 0 && <Separator />}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-gray-600" /></div>
                    <div><p className="text-sm font-semibold text-gray-800">{g.title}</p><p className="text-xs text-gray-400">{g.desc}</p></div>
                  </div>
                  <div className="space-y-2 pl-9">
                    {g.options.map(opt => (
                      <div key={opt.key} className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                        <span className="text-sm text-gray-700">{opt.label}</span>
                        <Switch checked={!!toggles[opt.key]} onCheckedChange={() => setToggles(p => ({ ...p, [opt.key]: !p[opt.key] }))} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Integrations */}
      {tab === 'integrations' && (
        <div className="space-y-8">

          {/* Store Info */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center"><Store className="w-4 h-4 text-blue-600" /></div>
              <div><p className="text-sm font-bold text-gray-900">Store Information</p><p className="text-xs text-gray-400">Used in all outgoing emails and SMS messages</p></div>
            </div>
            <div className="space-y-4">
              {intFields('store').map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.key}>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider"><Icon className="w-3.5 h-3.5" /> {f.label}</label>
                    <input type="text" value={integrations[f.key] ?? ''} onChange={e => setIntegrations(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50 transition" />
                    <p className="text-xs text-gray-400 mt-1">{f.help}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Email */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center"><Mail className="w-4 h-4 text-green-600" /></div>
                <div><p className="text-sm font-bold text-gray-900">Email Notifications</p><p className="text-xs text-gray-400">Powered by Resend — free up to 3,000 emails/month</p></div>
              </div>
              <a href="https://resend.com/signup" target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-semibold">Get free API key →</a>
            </div>
            <div className="space-y-4">
              {intFields('email').map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.key}>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider"><Icon className="w-3.5 h-3.5" /> {f.label}</label>
                    {f.secret
                      ? <SecretInput value={integrations[f.key] ?? ''} onChange={v => setIntegrations(p => ({ ...p, [f.key]: v }))} placeholder={f.placeholder} />
                      : <input type="text" value={integrations[f.key] ?? ''} onChange={e => setIntegrations(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50 transition" />
                    }
                    <p className="text-xs text-gray-400 mt-1">{f.help}</p>
                  </div>
                );
              })}
            </div>
            <button onClick={handleTestEmail} disabled={testingEmail}
              className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-sm font-semibold rounded-xl transition-colors">
              {testingEmail ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><CheckCircle2 className="w-4 h-4" /> Send test email to {integrations.store_email || 'your email'}</>}
            </button>
          </section>

          <Separator />

          {/* SMS */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center"><MessageSquare className="w-4 h-4 text-purple-600" /></div>
              <div><p className="text-sm font-bold text-gray-900">SMS Notifications</p><p className="text-xs text-gray-400">Bangladesh: BulkSMS BD, Twilio, Infobip</p></div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { label: 'BulkSMS BD', url: 'https://api.bulksmsbd.net/api/smsapi' },
                { label: 'Twilio',     url: 'https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json' },
                { label: 'Infobip',    url: 'https://xxxxxxxxx.api.infobip.com/sms/2/text/advanced' },
              ].map(p => (
                <button key={p.label} type="button" onClick={() => setIntegrations(prev => ({ ...prev, sms_api_url: p.url }))}
                  className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors font-medium">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {intFields('sms').map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.key}>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider"><Icon className="w-3.5 h-3.5" /> {f.label}</label>
                    {f.secret
                      ? <SecretInput value={integrations[f.key] ?? ''} onChange={v => setIntegrations(p => ({ ...p, [f.key]: v }))} placeholder={f.placeholder} />
                      : <input type="text" value={integrations[f.key] ?? ''} onChange={e => setIntegrations(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-gray-50 transition" />
                    }
                    <p className="text-xs text-gray-400 mt-1">{f.help}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
            <p className="text-xs text-amber-800 font-medium">
              🔒 API keys are stored securely in your database — not in code or .env files. Changes take effect immediately without any server restart.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
