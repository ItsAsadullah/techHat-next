'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Package, Tag, MessageCircle, Star, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const NOTIF_SETTINGS = [
  {
    category: 'Orders',
    icon: Package,
    color: 'text-blue-600 bg-blue-50',
    items: [
      { key: 'order_placed', label: 'Order Placed', desc: 'When your order is successfully placed' },
      { key: 'order_shipped', label: 'Order Shipped', desc: 'When your order is out for delivery' },
      { key: 'order_delivered', label: 'Order Delivered', desc: 'When your order is delivered' },
      { key: 'order_cancelled', label: 'Order Cancelled', desc: 'If your order is cancelled' },
    ],
  },
  {
    category: 'Promotions',
    icon: Tag,
    color: 'text-orange-600 bg-orange-50',
    items: [
      { key: 'flash_sale', label: 'Flash Sales', desc: 'Limited-time deals and flash sales' },
      { key: 'new_arrivals', label: 'New Arrivals', desc: 'New products in your favorite categories' },
      { key: 'price_drop', label: 'Price Drops', desc: 'When wishlist items go on sale' },
    ],
  },
  {
    category: 'Account',
    icon: MessageCircle,
    color: 'text-purple-600 bg-purple-50',
    items: [
      { key: 'review_req', label: 'Review Requests', desc: 'Prompt to review delivered products' },
      { key: 'security', label: 'Security Alerts', desc: 'Login and password change alerts' },
    ],
  },
];

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try {
      const s = localStorage.getItem('techhat_notif_prefs');
      return s ? JSON.parse(s) : { order_placed: true, order_shipped: true, order_delivered: true, order_cancelled: true, security: true };
    } catch { return { order_placed: true, order_shipped: true, order_delivered: true, order_cancelled: true, security: true }; }
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = () => {
    localStorage.setItem('techhat_notif_prefs', JSON.stringify(prefs));
    setSaved(true);
    toast.success('Notification preferences saved!');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Notifications</h1>
            <p className="text-sm text-gray-500">Choose what alerts you want to receive</p>
          </div>
        </div>
      </div>

      {NOTIF_SETTINGS.map((group, gi) => {
        const Icon = group.icon;
        return (
          <motion.div
            key={group.category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.06 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-5 border-b border-gray-50">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${group.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h2 className="font-semibold text-gray-800">{group.category}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {group.items.map(item => (
                <div key={item.key} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggle(item.key)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      prefs[item.key] ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      prefs[item.key] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all max-w-2xl ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700'
        }`}
      >
        {saved ? <><CheckCircle2 className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Preferences</>}
      </button>
    </div>
  );
}
