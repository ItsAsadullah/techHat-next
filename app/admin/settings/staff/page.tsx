'use client';

import { useState, useEffect } from 'react';
import {
  Users, Plus, Trash2, Search, Loader2, Phone, Edit2, Save, User,
  ShieldCheck, Shield, BadgeCheck, UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────
type Role = 'Admin' | 'Manager' | 'Cashier' | 'Staff';

const ALL_PERMISSIONS: { key: string; label: string; desc: string }[] = [
  { key: 'manage_products',  label: 'Manage Products',   desc: 'Add, edit, delete products & inventory' },
  { key: 'manage_sales',     label: 'Manage Sales',       desc: 'Process POS sales and view order history' },
  { key: 'manage_expenses',  label: 'Manage Expenses',    desc: 'Record and review business expenses' },
  { key: 'manage_vendors',   label: 'Manage Vendors',     desc: 'Add and manage supplier accounts' },
  { key: 'manage_customers', label: 'Manage Customers',   desc: 'View and manage customer profiles' },
  { key: 'manage_staff',     label: 'Manage Staff',       desc: 'Add, remove, and configure staff members' },
  { key: 'manage_settings',  label: 'Manage Settings',    desc: 'Change system and POS configurations' },
  { key: 'view_reports',     label: 'View Reports',       desc: 'Access analytics dashboard and reports' },
];

const ROLE_DEFAULTS: Record<Role, string[]> = {
  Admin: ALL_PERMISSIONS.map((p) => p.key),
  Manager: ['manage_products', 'manage_sales', 'manage_expenses', 'manage_vendors', 'manage_customers', 'view_reports'],
  Cashier: ['manage_sales', 'manage_customers'],
  Staff: ['manage_sales'],
};

const ROLE_META: Record<Role, { color: string; icon: React.ElementType }> = {
  Admin:   { color: 'bg-red-100 text-red-700',    icon: ShieldCheck },
  Manager: { color: 'bg-orange-100 text-orange-700', icon: Shield },
  Cashier: { color: 'bg-blue-100 text-blue-700',  icon: BadgeCheck },
  Staff:   { color: 'bg-gray-100 text-gray-700',  icon: UserCog },
};

const ROLES: Role[] = ['Admin', 'Manager', 'Cashier', 'Staff'];

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  role?: string | null;
  permissions?: string | null;
  baseSalary: number;
  isActive: boolean;
  joiningDate: string;
  address?: string | null;
}

const EMPTY_FORM = {
  name: '', phone: '', email: '', role: 'Cashier' as Role,
  baseSalary: '', address: '', isActive: true,
  permissions: ROLE_DEFAULTS['Cashier'],
};

async function fetchStaff(): Promise<StaffMember[]> {
  const res = await fetch('/api/admin/staff');
  if (!res.ok) return [];
  return res.json();
}

export default function StaffSettingsPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    setLoading(true);
    try { setStaff(await fetchStaff()); } catch { setStaff([]); }
    setLoading(false);
  }

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(s: StaffMember) {
    setEditId(s.id);
    let perms: string[];
    try { perms = s.permissions ? JSON.parse(s.permissions) : ROLE_DEFAULTS[(s.role as Role) ?? 'Staff']; }
    catch { perms = ROLE_DEFAULTS[(s.role as Role) ?? 'Staff']; }
    setForm({
      name: s.name, phone: s.phone, email: s.email ?? '',
      role: (s.role as Role) ?? 'Cashier',
      baseSalary: s.baseSalary.toString(),
      address: s.address ?? '',
      isActive: s.isActive,
      permissions: perms,
    });
    setOpen(true);
  }

  function handleRoleChange(role: Role) {
    setForm((f) => ({ ...f, role, permissions: ROLE_DEFAULTS[role] }));
  }

  function togglePermission(key: string) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((p) => p !== key)
        : [...f.permissions, key],
    }));
  }

  async function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required'); return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name, phone: form.phone, email: form.email,
        role: form.role,
        permissions: JSON.stringify(form.permissions),
        baseSalary: parseFloat(form.baseSalary) || 0,
        address: form.address,
        isActive: form.isActive,
      };
      const url = editId ? `/api/admin/staff/${editId}` : '/api/admin/staff';
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(editId ? 'Staff updated' : 'Staff added');
      setOpen(false);
      loadStaff();
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this staff member?')) return;
    const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Removed'); loadStaff(); }
    else toast.error('Failed to delete');
  }

  const filtered = staff.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Staff Members</h2>
            <p className="text-sm text-gray-500">
              {staff.length} total · {staff.filter((s) => s.isActive).length} active
            </p>
          </div>
        </div>
        <Button onClick={openAdd} className="bg-purple-600 hover:bg-purple-700 rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => {
          const { color, icon: Icon } = ROLE_META[r];
          return (
            <span key={r} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${color}`}>
              <Icon className="w-3.5 h-3.5" />{r}
            </span>
          );
        })}
        <span className="text-xs text-gray-400 self-center ml-1">— role-based permission groups</span>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Search by name or phone…" className="pl-9 rounded-xl" value={search}
          onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">{search ? 'No staff found' : 'No staff members yet'}</p>
          {!search && (
            <Button variant="link" onClick={openAdd} className="text-purple-600 text-sm mt-1">
              Add your first staff
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const role = (s.role as Role) ?? 'Staff';
            const { color, icon: Icon } = ROLE_META[role] ?? ROLE_META['Staff'];
            let perms: string[] = [];
            try { perms = s.permissions ? JSON.parse(s.permissions) : []; } catch { perms = []; }
            return (
              <div key={s.id}
                className={`flex items-center justify-between p-4 border rounded-xl transition ${s.isActive ? 'border-gray-200 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
                        <Icon className="w-3 h-3" />{role}
                      </span>
                      {!s.isActive && <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Inactive</Badge>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{s.phone}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">৳{s.baseSalary.toLocaleString()}/mo</span>
                      {perms.length > 0 && (
                        <span className="text-xs text-gray-400">{perms.length} permission{perms.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}
                    className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Staff Member' : 'Add New Staff'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-1">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium">Full Name *</Label>
                <Input placeholder="John Doe" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Phone *</Label>
                <Input placeholder="01XXXXXXXXX" value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email</Label>
                <Input placeholder="staff@email.com" type="email" value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Base Salary (৳/month)</Label>
                <Input placeholder="0" type="number" value={form.baseSalary}
                  onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-sm font-medium">Address</Label>
                <Input placeholder="Street, City" value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="col-span-2 flex items-center justify-between px-1">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-gray-400">Can log in and access the system</p>
                </div>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
              </div>
            </div>

            <Separator />

            {/* Role Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => {
                  const { color, icon: Icon } = ROLE_META[r];
                  const active = form.role === r;
                  return (
                    <button key={r} type="button" onClick={() => handleRoleChange(r)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition ${active ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 hover:border-gray-300'}`}>
                      <Icon className="w-4 h-4" />
                      {r}
                      <span className={`ml-auto text-xs ${active ? 'text-gray-300' : 'text-gray-400'}`}>
                        {ROLE_DEFAULTS[r].length} perms
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Selecting a role sets default permissions below</p>
            </div>

            <Separator />

            {/* Permissions */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Permissions</Label>
              <div className="space-y-2">
                {ALL_PERMISSIONS.map((p) => (
                  <div key={p.key} className="flex items-start gap-3 py-1">
                    <Checkbox
                      id={p.key}
                      checked={form.permissions.includes(p.key)}
                      onCheckedChange={() => togglePermission(p.key)}
                      className="mt-0.5"
                    />
                    <label htmlFor={p.key} className="cursor-pointer">
                      <p className="text-sm font-medium text-gray-900">{p.label}</p>
                      <p className="text-xs text-gray-500">{p.desc}</p>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 rounded-xl gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId ? 'Save Changes' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}