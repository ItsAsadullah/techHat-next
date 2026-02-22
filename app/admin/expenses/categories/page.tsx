"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Pencil, Trash2, Tag, Palette, RefreshCw, Layers, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  type ExpenseCategoryInput,
} from "@/lib/actions/expense-actions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  _count?: { expenses: number };
}

// ─── Default Categories (seed helpers) ───────────────────────────────────────

const DEFAULT_CATEGORIES: ExpenseCategoryInput[] = [
  { name: "Office Supplies", slug: "office-supplies", icon: "📎", color: "#6366f1", description: "Stationery, printing, and office materials", isActive: true },
  { name: "Utilities", slug: "utilities", icon: "💡", color: "#f59e0b", description: "Electricity, water, gas, and internet bills", isActive: true },
  { name: "Rent", slug: "rent", icon: "🏢", color: "#8b5cf6", description: "Shop or office rent payments", isActive: true },
  { name: "Salary", slug: "salary", icon: "💰", color: "#10b981", description: "Staff salaries and wages", isActive: true },
  { name: "Transport", slug: "transport", icon: "🚗", color: "#3b82f6", description: "Fuel, vehicle maintenance, and travel", isActive: true },
  { name: "Marketing", slug: "marketing", icon: "📣", color: "#ef4444", description: "Advertising, promotions, and marketing materials", isActive: true },
  { name: "Maintenance", slug: "maintenance", icon: "🔧", color: "#64748b", description: "Equipment and facility maintenance", isActive: true },
  { name: "Food & Entertainment", slug: "food-entertainment", icon: "🍽️", color: "#f97316", description: "Meals, refreshments, and entertaining clients", isActive: true },
  { name: "Miscellaneous", slug: "miscellaneous", icon: "📌", color: "#94a3b8", description: "Other uncategorized expenses", isActive: true },
];

const COLOR_PRESETS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#10b981", "#14b8a6",
  "#3b82f6", "#06b6d4", "#64748b", "#94a3b8",
];

const ICON_PRESETS = [
  "💰", "🏢", "🚗", "📎", "💡", "🔧", "📣", "🍽️",
  "📌", "💻", "📦", "🎁", "🛒", "📱", "🏥", "✈️",
];

const emptyForm = (): ExpenseCategoryInput => ({
  name: "",
  slug: "",
  description: "",
  icon: "📌",
  color: "#6366f1",
  isActive: true,
});

const toSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpenseCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseCategoryInput>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // ── load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getExpenseCategories() as any;
    setCategories((res?.data ?? []) as Category[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── handlers ─────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      icon: cat.icon ?? "📌",
      color: cat.color ?? "#6366f1",
      isActive: cat.isActive,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("নাম আবশ্যক।"); return; }
    setSaving(true);
    setFormError("");
    const slug = form.slug || toSlug(form.name);
    try {
      let res: any;
      if (editingId) {
        res = await updateExpenseCategory(editingId, { ...form, slug });
      } else {
        res = await createExpenseCategory({ ...form, slug });
      }
      if (!res?.success) {
        setFormError(res?.error || "সংরক্ষণ ব্যর্থ হয়েছে।");
        setSaving(false);
        return;
      }
      setModalOpen(false);
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await deleteExpenseCategory(deleteId) as any;
    if (!res?.success) {
      alert(res?.error || "মোছা ব্যর্থ হয়েছে।");
    } else {
      load();
    }
    setDeleteId(null);
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    const existingSlugs = new Set(categories.map((c) => c.slug));
    for (const cat of DEFAULT_CATEGORIES) {
      if (!existingSlugs.has(cat.slug ?? "")) {
        await createExpenseCategory(cat).catch(() => {}); // skip existing
      }
    }
    setSeeding(false);
    load();
  };

  const filtered = categories.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const deleteTarget = categories.find((c) => c.id === deleteId);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push("/admin/expenses")}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Expenses
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="h-6 w-6 text-indigo-600" /> Expense Categories
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {categories.length} categor{categories.length !== 1 ? "ies" : "y"} configured
            </p>
          </div>
          <div className="flex gap-2">
            {categories.length === 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                <Layers className="h-4 w-4 mr-1" />
                {seeding ? "Seeding..." : "Seed Defaults"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button size="sm" onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-1" /> Add Category
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search categories..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Categories grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gray-100" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-20 text-center">
            <Tag className="h-12 w-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500 font-medium">No categories yet</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Add your first category or seed the default set.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDefaults}
                disabled={seeding}
                className="text-indigo-600 border-indigo-200"
              >
                <Layers className="h-4 w-4 mr-1" />
                {seeding ? "Seeding..." : "Seed Defaults"}
              </Button>
              <Button size="sm" onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-1" /> Add Category
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow relative group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: (cat.color ?? "#6366f1") + "20" }}
                  >
                    {cat.icon ?? "📌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-gray-900 truncate">{cat.name}</h3>
                      {!cat.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-gray-500 line-clamp-2">{cat.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="h-3 w-3 rounded-full border border-white shadow-sm"
                        style={{ backgroundColor: cat.color ?? "#6366f1" }}
                      />
                      <span className="text-xs text-gray-400 font-mono">{cat.color ?? "—"}</span>
                      {cat._count !== undefined && (
                        <span className="ml-auto text-xs text-gray-400">
                          {cat._count.expenses} expense{cat._count.expenses !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions - appear on hover */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(cat)}
                    className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm text-amber-600 hover:bg-amber-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(cat.id)}
                    className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add more defaults if some exist but not all */}
        {categories.length > 0 && categories.length < DEFAULT_CATEGORIES.length && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs"
            >
              <Layers className="h-3.5 w-3.5 mr-1" />
              {seeding ? "Adding..." : "Add missing defaults"}
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-indigo-600" />
              {editingId ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div>
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Office Supplies"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm({ ...form, name, slug: editingId ? form.slug : toSlug(name) });
                }}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 resize-none"
                rows={2}
              />
            </div>

            {/* Icon picker */}
            <div>
              <Label>Icon</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border border-gray-200"
                  style={{ backgroundColor: (form.color ?? "#6366f1") + "20" }}
                >
                  {form.icon ?? "📌"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_PRESETS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setForm({ ...form, icon: ic })}
                      className={`h-8 w-8 rounded-lg text-sm flex items-center justify-center border transition-all ${
                        form.icon === ic
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                placeholder="Or enter any emoji"
                value={form.icon ?? ""}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="mt-2 w-28 text-center"
                maxLength={4}
              />
            </div>

            {/* Color picker */}
            <div>
              <Label className="flex items-center gap-1"><Palette className="h-3.5 w-3.5" /> Color</Label>
              <div className="mt-1.5 flex flex-wrap gap-2 items-center">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${
                      form.color === c ? "border-gray-800 scale-110" : "border-white shadow-sm"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={form.color ?? "#6366f1"}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-7 w-7 rounded-full cursor-pointer border border-gray-200"
                  title="Custom color"
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving ? "Saving..." : editingId ? "Update" : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?._count?.expenses && deleteTarget._count.expenses > 0 ? (
                <>
                  <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> has {deleteTarget._count.expenses} expense
                  {deleteTarget._count.expenses !== 1 ? "s" : ""}. You must reassign or delete those expenses first.
                </>
              ) : (
                <>
                  &ldquo;{deleteTarget?.name}&rdquo; will be permanently deleted.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {(!deleteTarget?._count?.expenses || deleteTarget._count.expenses === 0) && (
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
