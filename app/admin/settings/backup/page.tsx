'use client';

import { useState, useRef } from 'react';
import {
  Database, Download, Upload, Trash2, AlertTriangle,
  CheckCircle2, Loader2, FileJson, ShieldAlert,
  RefreshCw, Info, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// Delete targets config
// ─────────────────────────────────────────────
const DELETE_TARGETS = [
  {
    key: 'orders',
    label: 'Sales & Orders',
    desc: 'All POS/online orders, payments, returns, due records',
    color: 'text-blue-600 bg-blue-50',
    count: null as number | null,
    warning: 'Customer purchase history will be erased',
  },
  {
    key: 'expenses',
    label: 'Expenses',
    desc: 'All recorded expenses and their details',
    color: 'text-orange-600 bg-orange-50',
    count: null,
    warning: 'All expense records will be permanently removed',
  },
  {
    key: 'customers',
    label: 'POS Customers',
    desc: 'Customer profiles, due balances, contact info',
    color: 'text-green-600 bg-green-50',
    count: null,
    warning: 'All customer profiles will be removed',
  },
  {
    key: 'vendors',
    label: 'Vendors & Purchases',
    desc: 'Suppliers, purchase invoices, vendor payments',
    color: 'text-violet-600 bg-violet-50',
    count: null,
    warning: 'All supplier and purchase records will be erased',
  },
  {
    key: 'stockHistory',
    label: 'Stock History',
    desc: 'Stock movement logs (products remain intact)',
    color: 'text-cyan-600 bg-cyan-50',
    count: null,
    warning: 'Stock movement history will be cleared',
  },
  {
    key: 'products',
    label: 'Products & Inventory',
    desc: 'All products, variants, specifications, stock data',
    color: 'text-red-600 bg-red-50',
    count: null,
    warning: 'All product listings and inventory will be REMOVED',
  },
  {
    key: 'staff',
    label: 'Staff & Salaries',
    desc: 'Staff members and salary records',
    color: 'text-pink-600 bg-pink-50',
    count: null,
    warning: 'All staff records will be permanently deleted',
  },
  {
    key: 'reviews',
    label: 'Reviews',
    desc: 'All product reviews and ratings',
    color: 'text-yellow-600 bg-yellow-50',
    count: null,
    warning: 'All customer reviews will be deleted',
  },
];

type Phase = 'idle' | 'loading' | 'success' | 'error';

export default function BackupPage() {
  // Backup state
  const [backupPhase, setBackupPhase] = useState<Phase>('idle');

  // Restore state
  const [restorePhase, setRestorePhase] = useState<Phase>('idle');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [deletePhase, setDeletePhase] = useState<Phase>('idle');
  const [deleteResult, setDeleteResult] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [nukeModal, setNukeModal] = useState(false);
  const [nukeText, setNukeText] = useState('');

  // ── Backup ───────────────────────────────────
  async function handleBackup() {
    setBackupPhase('loading');
    try {
      const res = await fetch('/api/admin/backup');
      if (!res.ok) throw new Error('Backup failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `techhat-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupPhase('success');
      toast.success('Backup downloaded successfully');
      setTimeout(() => setBackupPhase('idle'), 3000);
    } catch (e: any) {
      setBackupPhase('error');
      toast.error('Backup failed: ' + e.message);
      setTimeout(() => setBackupPhase('idle'), 3000);
    }
  }

  // ── Restore ──────────────────────────────────
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      toast.error('Please select a valid .json backup file');
      return;
    }
    setRestoreFile(file);
    setRestoreResult(null);
    setRestorePhase('idle');
  }

  async function handleRestore() {
    if (!restoreFile) return;
    setRestorePhase('loading');
    try {
      const text = await restoreFile.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/admin/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Restore failed');
      setRestoreResult(result);
      setRestorePhase('success');
      toast.success(`Restored successfully — ${result.totalInserted} records imported`);
    } catch (e: any) {
      setRestorePhase('error');
      toast.error('Restore failed: ' + e.message);
    }
  }

  // ── Delete ───────────────────────────────────
  function toggleTarget(key: string) {
    setSelectedTargets((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }

  async function executeDelete(targets: string[]) {
    setDeletePhase('loading');
    setConfirmModal(false);
    setNukeModal(false);
    try {
      const res = await fetch('/api/admin/backup/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets }),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Delete failed');
      setDeleteResult(result);
      setDeletePhase('success');
      setSelectedTargets(new Set());
      toast.success('Selected data deleted successfully');
    } catch (e: any) {
      setDeletePhase('error');
      toast.error('Delete failed: ' + e.message);
    }
  }

  function handleDeleteSelected() {
    if (selectedTargets.size === 0) { toast.error('No categories selected'); return; }
    setConfirmText('');
    setConfirmModal(true);
  }

  function handleNuke() {
    setNukeText('');
    setNukeModal(true);
  }

  const selectedLabels = DELETE_TARGETS
    .filter((t) => selectedTargets.has(t.key))
    .map((t) => t.label);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-xl">
          <Database className="w-5 h-5 text-slate-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Data Backup & Restore</h2>
          <p className="text-sm text-gray-500">Export, import, and manage all business data</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">
          Backup exports all data (products, orders, expenses, customers, vendors, staff, settings) as a single JSON file.
          Restoring will <strong>add</strong> records without deleting existing ones. Use the delete section to clear data before restoring if needed.
        </p>
      </div>

      {/* ── BACKUP SECTION ── */}
      <section className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-200">
          <Download className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-800">Create Backup</h3>
          <span className="ml-auto text-xs text-gray-400">Download a full JSON export</span>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700 font-medium">Full database export</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Products · Orders · Expenses · Customers · Vendors · Staff · Reviews · Settings
            </p>
          </div>
          <Button
            onClick={handleBackup}
            disabled={backupPhase === 'loading'}
            className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl gap-2 min-w-[160px]"
          >
            {backupPhase === 'loading' ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Exporting...</>
            ) : backupPhase === 'success' ? (
              <><CheckCircle2 className="w-4 h-4" />Downloaded!</>
            ) : (
              <><Download className="w-4 h-4" />Download Backup</>
            )}
          </Button>
        </div>
      </section>

      {/* ── RESTORE SECTION ── */}
      <section className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-200">
          <Upload className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-800">Restore from Backup</h3>
          <span className="ml-auto text-xs text-gray-400">Upload a .json backup file</span>
        </div>
        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition group"
          >
            <FileJson className="w-8 h-8 text-gray-300 group-hover:text-blue-400 mx-auto mb-2 transition" />
            {restoreFile ? (
              <div>
                <p className="text-sm font-semibold text-gray-800">{restoreFile.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{(restoreFile.size / 1024).toFixed(1)} KB · Click to change</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-500">Click to select backup file</p>
                <p className="text-xs text-gray-400 mt-1">Accepts .json files only</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />

          {/* Restore result */}
          {restoreResult && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Restore Successful</span>
                <span className="ml-auto text-sm font-bold text-green-700">{restoreResult.totalInserted} records imported</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {Object.entries(restoreResult.results ?? {}).map(([key, val]: [string, any]) => (
                  val.inserted > 0 && (
                    <div key={key} className="text-xs bg-white border border-green-200 rounded-lg px-2 py-1 flex justify-between">
                      <span className="text-gray-600 capitalize">{key}</span>
                      <span className="font-bold text-green-700">+{val.inserted}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Existing records with the same ID will be skipped. New records will be added.
            </div>
            <Button
              onClick={handleRestore}
              disabled={!restoreFile || restorePhase === 'loading'}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 shrink-0"
            >
              {restorePhase === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Restoring...</>
              ) : (
                <><Upload className="w-4 h-4" />Restore Now</>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* ── DELETE SECTION ── */}
      <section className="border border-red-200 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border-b border-red-200">
          <Trash2 className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-semibold text-red-800">Delete Data</h3>
          <span className="ml-auto text-xs text-red-400">Permanent — cannot be undone</span>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">Select categories to permanently delete. We recommend downloading a backup first.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {DELETE_TARGETS.map((t) => (
              <label
                key={t.key}
                className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition ${
                  selectedTargets.has(t.key)
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedTargets.has(t.key)}
                  onChange={() => toggleTarget(t.key)}
                  className="w-4 h-4 accent-red-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${t.color}`}>{t.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{t.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Delete result */}
          {deleteResult && deletePhase === 'success' && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-700">Deletion complete</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(deleteResult.deleted ?? {}).map(([key, count]: [string, any]) => (
                  count > 0 && (
                    <span key={key} className="text-xs bg-red-100 text-red-700 border border-red-200 rounded-lg px-2 py-0.5 font-mono">
                      {key}: {count}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={handleDeleteSelected}
              disabled={selectedTargets.size === 0 || deletePhase === 'loading'}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl gap-2"
            >
              {deletePhase === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4" />Delete Selected ({selectedTargets.size})</>
              )}
            </Button>

            <div className="flex-1" />

            {/* Nuclear option */}
            <Button
              onClick={handleNuke}
              disabled={deletePhase === 'loading'}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Delete ALL Data
            </Button>
          </div>
        </div>
      </section>

      {/* ── Confirm delete selected modal ── */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setConfirmModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Confirm Deletion</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-500 mb-2">The following data will be permanently deleted:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLabels.map((l) => (
                    <span key={l} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-lg font-medium">{l}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full h-10 border border-gray-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setConfirmModal(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button
                  onClick={() => executeDelete(Array.from(selectedTargets))}
                  disabled={confirmText !== 'DELETE'}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                >
                  Delete Now
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Nuclear "delete ALL" modal ── */}
      <AnimatePresence>
        {nukeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setNukeModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border-2 border-red-200">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Delete ALL Data</h3>
                  <p className="text-xs text-red-600 font-medium">IRREVERSIBLE — Factory Reset</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-3 my-4">
                <p className="text-xs text-red-700 font-medium">
                  This will permanently delete <strong>ALL</strong> data including products, orders, expenses,
                  customers, vendors, staff, reviews, and categories. 
                  Settings will be preserved.
                </p>
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Type <strong>DELETE ALL DATA</strong> to confirm
                </label>
                <input
                  type="text"
                  value={nukeText}
                  onChange={(e) => setNukeText(e.target.value)}
                  placeholder="DELETE ALL DATA"
                  className="w-full h-10 border border-red-300 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setNukeModal(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button
                  onClick={() => executeDelete(['ALL'])}
                  disabled={nukeText !== 'DELETE ALL DATA'}
                  className="flex-1 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold"
                >
                  <ShieldAlert className="w-4 h-4 mr-1.5" />
                  Delete Everything
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
