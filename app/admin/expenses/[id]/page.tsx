"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Pencil, Trash2, CheckCircle, XCircle, Clock,
  Calendar, Wallet, Tag, User, FileText, Paperclip,
  RefreshCw, ReceiptText, Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getExpenseById,
  updateExpense,
  updateExpenseStatus,
  deleteExpense,
  getExpenseCategories,
  getStaffMembers,
  type ExpenseInput,
} from "@/lib/actions/expense-actions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  paymentMethod: string;
  paidTo: string | null;
  reference: string | null;
  note: string | null;
  attachment: string | null;
  status: string;
  addedBy: string | null;
  isRecurring: boolean;
  categoryId: string;
  staffId: string | null;
  category: { id: string; name: string; color: string | null; icon: string | null } | null;
  staff: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface Staff {
  id: string;
  name: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "MOBILE_BANKING", label: "Mobile Banking" },
  { value: "CHECK", label: "Check" },
  { value: "OTHER", label: "Other" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="h-4 w-4" />,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-800 border-green-200",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="h-4 w-4" />,
  },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(n);

const fmtFull = (d: string) =>
  new Date(d).toLocaleDateString("en-BD", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<ExpenseInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);

  // ── load ─────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    try {
      const result = await getExpenseById(id);
      if (!result.success || !result.data) { setNotFound(true); return; }
      setExpense(result.data as unknown as Expense);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    Promise.all([getExpenseCategories(), getStaffMembers()]).then(([cats, st]) => {
      setCategories(((cats as any).success ? (cats as any).data : []) as Category[]);
      setStaff(((st as any).success ? (st as any).data : []) as Staff[]);
    });
  }, [id]);

  // ── handlers ─────────────────────────────────────────────────────────────

  const openEdit = () => {
    if (!expense) return;
    setForm({
      title: expense.title,
      amount: expense.amount,
      categoryId: expense.categoryId,
      date: expense.date?.split("T")[0] ?? "",
      paymentMethod: expense.paymentMethod,
      paidTo: expense.paidTo ?? "",
      reference: expense.reference ?? "",
      note: expense.note ?? "",
      attachment: expense.attachment ?? "",
      status: expense.status,
      addedBy: expense.addedBy ?? "",
      staffId: expense.staffId ?? "",
      isRecurring: expense.isRecurring,
    });
    setFormError("");
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form) return;
    if (!form.title.trim()) { setFormError("Title is required."); return; }
    if (!form.amount || form.amount <= 0) { setFormError("Amount must be greater than 0."); return; }
    if (!form.categoryId) { setFormError("Please select a category."); return; }
    setSaving(true);
    setFormError("");
    try {
      await updateExpense(id, form);
      setEditOpen(false);
      load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setStatusChanging(true);
    await updateExpenseStatus(id, status as "PENDING" | "APPROVED" | "REJECTED");
    setStatusChanging(false);
    load();
  };

  const handleDelete = async () => {
    await deleteExpense(id);
    router.push("/admin/expenses");
  };

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (notFound || !expense) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <FileText className="h-14 w-14 text-gray-300" />
        <p className="text-gray-500">Expense not found.</p>
        <Button variant="outline" onClick={() => router.push("/admin/expenses")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Expenses
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[expense.status] ?? STATUS_CONFIG.PENDING;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/admin/expenses")}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Expenses
          </button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          {/* Top section */}
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusCfg.className}`}
                >
                  {statusCfg.icon} {statusCfg.label}
                </span>
                {expense.isRecurring && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                    Recurring
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{expense.title}</h1>
              {expense.paidTo && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> {expense.paidTo}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">{fmt(expense.amount)}</div>
              <div className="text-sm text-gray-500 mt-1">{fmtFull(expense.date)}</div>
            </div>
          </div>

          {/* Details grid */}
          <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-3 gap-6">
            <DetailItem
              icon={<Tag className="h-4 w-4" />}
              label="Category"
              value={
                expense.category ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: expense.category.color ? expense.category.color + "20" : "#f3f4f6",
                      color: expense.category.color ?? "#374151",
                    }}
                  >
                    {expense.category.icon} {expense.category.name}
                  </span>
                ) : "—"
              }
            />
            <DetailItem
              icon={<Wallet className="h-4 w-4" />}
              label="Payment Method"
              value={PAYMENT_METHODS.find((m) => m.value === expense.paymentMethod)?.label ?? expense.paymentMethod}
            />
            <DetailItem
              icon={<Calendar className="h-4 w-4" />}
              label="Date"
              value={fmtFull(expense.date)}
            />
            {expense.reference && (
              <DetailItem
                icon={<ReceiptText className="h-4 w-4" />}
                label="Reference #"
                value={expense.reference}
              />
            )}
            {expense.staff && (
              <DetailItem
                icon={<User className="h-4 w-4" />}
                label="Related Staff"
                value={expense.staff.name}
              />
            )}
            {expense.addedBy && (
              <DetailItem
                icon={<User className="h-4 w-4" />}
                label="Added By"
                value={expense.addedBy}
              />
            )}
          </div>

          {/* Notes */}
          {expense.note && (
            <div className="px-6 py-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Notes
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{expense.note}</p>
            </div>
          )}

          {/* Attachment */}
          {expense.attachment && (
            <div className="px-6 py-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" /> Attachment
              </p>
              {expense.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="rounded-xl overflow-hidden border border-gray-200 max-w-md">
                  <img
                    src={expense.attachment}
                    alt="Attachment"
                    className="w-full object-contain max-h-80"
                  />
                </div>
              ) : (
                <a
                  href={expense.attachment}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  View attachment
                </a>
              )}
            </div>
          )}

          {/* Footer meta */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/60 flex flex-wrap gap-4 text-xs text-gray-400">
            <span>Created: {fmtDateTime(expense.createdAt)}</span>
            <span>Updated: {fmtDateTime(expense.updatedAt)}</span>
          </div>
        </div>

        {/* Status Action Card */}
        {expense.status === "PENDING" && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-800">This expense is pending approval</p>
              <p className="text-sm text-gray-500">Review and approve or reject this expense.</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleStatusChange("APPROVED")}
                disabled={statusChanging}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button
                onClick={() => handleStatusChange("REJECTED")}
                disabled={statusChanging}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {form && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Expense</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              <div className="md:col-span-2">
                <Label>Title <span className="text-red-500">*</span></Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Amount (BDT) <span className="text-red-500">*</span></Label>
                <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="mt-1" />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vendor / Paid To</Label>
                <Input value={form.paidTo ?? ""} onChange={(e) => setForm({ ...form, paidTo: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Reference No.</Label>
                <Input value={form.reference ?? ""} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status ?? "APPROVED"} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Related Staff</Label>
                <Select value={form.staffId ?? "NONE"} onValueChange={(v) => setForm({ ...form, staffId: v === "NONE" ? "" : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Added By</Label>
                <Input value={form.addedBy ?? ""} onChange={(e) => setForm({ ...form, addedBy: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Attachment URL</Label>
                <Input value={form.attachment ?? ""} onChange={(e) => setForm({ ...form, attachment: e.target.value })} className="mt-1" />
              </div>
              <div className="flex items-center gap-2 pt-4">
                <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="rounded" />
                <Label htmlFor="recurring" className="cursor-pointer">Recurring expense</Label>
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Textarea value={form.note ?? ""} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-1 resize-none" rows={3} />
              </div>
            </div>
            {formError && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {saving ? "Saving..." : "Update Expense"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{expense.title}&rdquo; will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Detail Item ──────────────────────────────────────────────────────────────

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 flex items-center gap-1 mb-1">
        {icon} {label}
      </p>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}
