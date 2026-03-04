'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, Plus, Trash2, Edit3, Home, Briefcase, CheckCircle2, X } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  address: string;
  district: string;
  division: string;
  isDefault: boolean;
}

const STORAGE_KEY = 'techhat_addresses';
const ADDRESS_TYPES = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'other', label: 'Other', icon: MapPin },
];

function AddressForm({ initial, onSave, onCancel }: {
  initial?: Address | null;
  onSave: (a: Address) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Address, 'id' | 'isDefault'>>({
    label: initial?.label || '',
    type: initial?.type || 'home',
    name: initial?.name || '',
    phone: initial?.phone || '',
    address: initial?.address || '',
    district: initial?.district || '',
    division: initial?.division || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address || !form.division || !form.district) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSave({ ...form, id: initial?.id || Date.now().toString(), isDefault: initial?.isDefault || false } as Address);
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Address Type</label>
        <div className="flex gap-2">
          {ADDRESS_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: t.value as Address['type'] }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                  form.type === t.value
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name *</label>
          <input value={form.name} onChange={set('name')} placeholder="Recipient name"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone *</label>
          <input value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" type="tel"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Street Address *</label>
        <textarea value={form.address} onChange={set('address')} rows={2} placeholder="House, Road, Area…"
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Division *</label>
          <input value={form.division} onChange={set('division')} placeholder="e.g. Dhaka"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">District *</label>
          <input value={form.district} onChange={set('district')} placeholder="e.g. Dhaka"
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">Label (optional)</label>
        <input value={form.label} onChange={set('label')} placeholder="e.g. Mom's house"
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all" />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit"
          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-200 transition-all">
          {initial ? 'Update Address' : 'Save Address'}
        </button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setAddresses(JSON.parse(stored));
  }, []);

  const saveAll = (list: Address[]) => {
    setAddresses(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleSave = (addr: Address) => {
    let list: Address[];
    if (editing) {
      list = addresses.map(a => a.id === addr.id ? addr : a);
      toast.success('Address updated');
    } else {
      list = [...addresses, addr];
      toast.success('Address saved');
    }
    saveAll(list);
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    saveAll(addresses.filter(a => a.id !== id));
    toast.success('Address removed');
  };

  const handleSetDefault = (id: string) => {
    saveAll(addresses.map(a => ({ ...a, isDefault: a.id === id })));
    toast.success('Default address updated');
  };

  const startEdit = (addr: Address) => {
    setEditing(addr);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const getTypeIcon = (type: string) => {
    const t = ADDRESS_TYPES.find(x => x.value === type);
    return t ? t.icon : MapPin;
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Delivery Addresses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-blue-200 p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">{editing ? 'Edit Address' : 'New Address'}</h2>
              <button onClick={cancelForm} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <AddressForm initial={editing} onSave={handleSave} onCancel={cancelForm} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Addresses List */}
      {addresses.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
          <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-500">No saved addresses</p>
          <p className="text-sm text-gray-400 mt-1">Add a delivery address for faster checkout.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {addresses.map(addr => {
              const TypeIcon = getTypeIcon(addr.type);
              return (
                <motion.div
                  key={addr.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className={`bg-white rounded-2xl shadow-sm border p-5 transition-all ${
                    addr.isDefault ? 'border-blue-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      addr.isDefault ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <TypeIcon className={`w-5 h-5 ${addr.isDefault ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-800 capitalize">{addr.label || addr.type}</p>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                            <CheckCircle2 className="w-3 h-3" /> Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700">{addr.name} · {addr.phone}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{addr.address}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{addr.district}, {addr.division}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(addr)} className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(addr.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Set as default
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
