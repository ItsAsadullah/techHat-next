'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, UserPlus, Check, X, User, Phone, Loader2 } from 'lucide-react';
import { upsertPOSCustomer } from '@/lib/actions/pos-customer-actions';

export interface POSCustomerOption {
  id: string;
  name: string;
  phone: string;
}

interface Props {
  customers: POSCustomerOption[];
  selectedName: string;
  selectedPhone: string;
  onSelect: (name: string, phone: string) => void;
  onClear: () => void;
  onCustomerCreated?: () => void;
}

export function CustomerSearchCombobox({
  customers,
  selectedName,
  selectedPhone,
  onSelect,
  onClear,
  onCustomerCreated,
}: Props) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isSelected = !!selectedName.trim();

  const filtered = query.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.includes(query)
      )
    : customers.slice(0, 8);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCustomer = (c: POSCustomerOption) => {
    onSelect(c.name, c.phone);
    setQuery('');
    setShowDropdown(false);
    setAddMode(false);
  };

  const handleAddNew = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      await upsertPOSCustomer(newName.trim(), newPhone.trim());
      onSelect(newName.trim(), newPhone.trim());
      onCustomerCreated?.();
      setAddMode(false);
      setNewName('');
      setNewPhone('');
      setQuery('');
      setShowDropdown(false);
    } catch {
      setSaveError('সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  const openAddForm = () => {
    setShowDropdown(false);
    setAddMode(true);
    if (/^\d+$/.test(query.trim())) {
      setNewName('');
      setNewPhone(query.trim());
    } else {
      setNewName(query.trim());
      setNewPhone('');
    }
    setSaveError('');
  };

  const cancelAdd = () => {
    setAddMode(false);
    setNewName('');
    setNewPhone('');
    setSaveError('');
  };

  if (isSelected) {
    return (
      <div className="flex items-center gap-2 min-h-[38px] bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
        <User className="h-4 w-4 text-blue-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-blue-800 leading-tight truncate">{selectedName}</p>
          {selectedPhone && (
            <p className="text-[11px] text-blue-500 leading-tight">{selectedPhone}</p>
          )}
        </div>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); onClear(); setQuery(''); setAddMode(false); }}
          className="p-0.5 rounded hover:bg-blue-200 text-blue-400 hover:text-red-500 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (addMode) {
    return (
      <div className="border-2 border-blue-400 rounded-xl bg-blue-50 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            নতুন কাস্টমার যোগ করুন
          </p>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); cancelAdd(); }} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('pos-new-phone')?.focus();
              }
            }}
            placeholder="কাস্টমারের নাম *"
            className="w-full h-10 pl-8 pr-3 border border-blue-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <input
            id="pos-new-phone"
            type="tel"
            value={newPhone}
            onChange={(e) => { setNewPhone(e.target.value); setSaveError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNew(); } }}
            placeholder="মোবাইল নম্বর *"
            className="w-full h-10 pl-8 pr-3 border border-blue-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {saveError && <p className="text-xs text-red-600 font-medium">{saveError}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleAddNew}
            disabled={!newName.trim() || !newPhone.trim() || saving}
            className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> সেভ হচ্ছে...</>
            ) : (
              <><Check className="h-4 w-4" /> সেভ করুন</>
            )}
          </button>
          <button
            type="button"
            onClick={cancelAdd}
            className="px-4 h-10 bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg text-sm font-semibold transition-colors"
          >
            বাতিল
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
          className="w-full h-10 pl-9 pr-4 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999]">
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {query ? `"${query}" পাওয়া যায়নি` : 'কোনো কাস্টমার নেই'}
              </p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); selectCustomer(c); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-gray-100">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); openAddForm(); }}
              className="w-full flex items-center gap-2.5 px-3 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <UserPlus className="h-4 w-4 shrink-0" />
              নতুন কাস্টমার যোগ করুন
              {query ? <span className="text-blue-400 font-normal ml-1">"{query}"</span> : null}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
