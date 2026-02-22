'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  Search,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Users,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  BarChart3,
  PieChart,
  Receipt,
  Tag,
  Clock,
  FileText,
  Printer,
  Download,
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  CircleDollarSign,
  HandCoins,
  ArrowUpDown,
  MoreHorizontal,
  Briefcase,
  Settings,
  Hash,
  ChevronDown,
  Eye,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════ Types ═══════════════

interface ExpenseCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  _count: { expenses: number };
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  note: string | null;
  attachment: string | null;
  reference: string | null;
  paymentMethod: string;
  paidTo: string | null;
  isRecurring: boolean;
  categoryId: string;
  category: { id: string; name: string; color: string | null; icon: string | null };
  createdAt: string;
}

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string | null;
  joiningDate: string;
  baseSalary: number;
  isActive: boolean;
  address: string | null;
  nidNumber: string | null;
  emergencyContact: string | null;
  _count: { salaries: number };
}

interface StaffSalary {
  id: string;
  staffId: string;
  month: number;
  year: number;
  basicSalary: number;
  overtime: number;
  bonus: number;
  deduction: number;
  advance: number;
  netSalary: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string | null;
  paymentDate: string | null;
  status: string;
  note: string | null;
  staff: StaffMember;
}

interface SalaryDueItem {
  id: string;
  staffName: string;
  month: number;
  year: number;
  netSalary: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
}

interface ExpenseStats {
  totalAllTime: number;
  totalThisMonth: number;
  totalLastMonth: number;
  totalToday: number;
  totalThisYear: number;
  expenseCountThisMonth: number;
  expenseCountToday: number;
  monthlyChange: number;
  categoryBreakdown: { categoryId: string; name: string; color: string; icon: string; total: number; count: number }[];
  monthlyTrend: { month: number; year: number; total: number; count: number }[];
  recentExpenses: Expense[];
  salaryThisMonth: number;
  salaryPaidThisMonth: number;
  salaryDueTotal: number;
  salaryDueBreakdown: SalaryDueItem[];
}

type Tab = 'overview' | 'expenses' | 'salary' | 'categories' | 'reports';

// ═══════════════ Constants ═══════════════

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'নগদ', icon: Banknote, color: 'text-green-600' },
  { value: 'CARD', label: 'কার্ড', icon: CreditCard, color: 'text-blue-600' },
  { value: 'MOBILE_BANKING', label: 'মোবাইল ব্যাংকিং', icon: Smartphone, color: 'text-purple-600' },
  { value: 'BANK_TRANSFER', label: 'ব্যাংক ট্রান্সফার', icon: Building2, color: 'text-indigo-600' },
];

const MONTH_NAMES_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const DEFAULT_CATEGORIES = [
  { name: 'দোকান ভাড়া', icon: '🏠', color: '#EF4444' },
  { name: 'বিদ্যুৎ বিল', icon: '⚡', color: '#F59E0B' },
  { name: 'পানি বিল', icon: '💧', color: '#3B82F6' },
  { name: 'ইন্টারনেট বিল', icon: '🌐', color: '#8B5CF6' },
  { name: 'পরিবহন', icon: '🚗', color: '#10B981' },
  { name: 'মেরামত ও রক্ষণাবেক্ষণ', icon: '🔧', color: '#F97316' },
  { name: 'অফিস সাপ্লাই', icon: '📦', color: '#06B6D4' },
  { name: 'মার্কেটিং', icon: '📢', color: '#EC4899' },
  { name: 'খাবার ও আপ্যায়ন', icon: '🍽️', color: '#84CC16' },
  { name: 'অন্যান্য', icon: '📌', color: '#6B7280' },
];

// ═══════════════ Helpers ═══════════════

function formatCurrency(amount: number): string {
  return '৳' + amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHODS.find(m => m.value === method)?.label || method;
}

function getPaymentMethodIcon(method: string) {
  return PAYMENT_METHODS.find(m => m.value === method)?.icon || Banknote;
}

// ═══════════════ Main Component ═══════════════

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ExpenseStats | null>(null);

  // Expense state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expensePagination, setExpensePagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('');
  const [expensePaymentFilter, setExpensePaymentFilter] = useState('');
  const [expenseDateFrom, setExpenseDateFrom] = useState('');
  const [expenseDateTo, setExpenseDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Categories state
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  // Staff state
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [salaries, setSalaries] = useState<StaffSalary[]>([]);
  const [salaryMonth, setSalaryMonth] = useState(new Date().getMonth() + 1);
  const [salaryYear, setSalaryYear] = useState(new Date().getFullYear());
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showPaySalary, setShowPaySalary] = useState<StaffSalary | null>(null);
  const [showEditSalary, setShowEditSalary] = useState<StaffSalary | null>(null);
  const [showDeleteSalary, setShowDeleteSalary] = useState<StaffSalary | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  // ═══════════════ Data Fetching ═══════════════

  const fetchStats = useCallback(async () => {
    try {
      const { getExpenseStats } = await import('@/lib/actions/expense-actions');
      const result = await getExpenseStats();
      if (result.success) setStats(result.data as any);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { getExpenseCategories } = await import('@/lib/actions/expense-actions');
      const result = await getExpenseCategories();
      if (result.success) setCategories(result.data as any);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchExpenses = useCallback(async (page = 1) => {
    try {
      const { getExpenses } = await import('@/lib/actions/expense-actions');
      const result = await getExpenses({
        page,
        limit: 20,
        search: expenseSearch || undefined,
        categoryId: expenseCategoryFilter || undefined,
        paymentMethod: expensePaymentFilter || undefined,
        dateFrom: expenseDateFrom || undefined,
        dateTo: expenseDateTo || undefined,
      });
      if (result.success) {
        setExpenses(result.data as any);
        setExpensePagination(result.pagination as any);
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    }
  }, [expenseSearch, expenseCategoryFilter, expensePaymentFilter, expenseDateFrom, expenseDateTo]);

  const fetchStaff = useCallback(async () => {
    try {
      const { getStaffMembers } = await import('@/lib/actions/expense-actions');
      const result = await getStaffMembers();
      if (result.success) setStaffMembers(result.data as any);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  }, []);

  const fetchSalaries = useCallback(async () => {
    try {
      const { getSalaries } = await import('@/lib/actions/expense-actions');
      const result = await getSalaries(salaryMonth, salaryYear);
      if (result.success) setSalaries(result.data as any);
    } catch (err) {
      console.error('Failed to fetch salaries:', err);
    }
  }, [salaryMonth, salaryYear]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchCategories()]);
      setLoading(false);
    };
    init();
  }, [fetchStats, fetchCategories]);

  useEffect(() => {
    if (activeTab === 'expenses') fetchExpenses();
  }, [activeTab, fetchExpenses]);

  useEffect(() => {
    if (activeTab === 'salary') {
      fetchStaff();
      fetchSalaries();
    }
  }, [activeTab, fetchStaff, fetchSalaries]);

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchCategories()]);
    if (activeTab === 'expenses') await fetchExpenses();
    if (activeTab === 'salary') { await fetchStaff(); await fetchSalaries(); }
    setLoading(false);
  };

  // ═══════════════ Actions ═══════════════

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('এই খরচটি মুছে ফেলতে চান?')) return;
    setActionLoading(true);
    try {
      const { deleteExpense } = await import('@/lib/actions/expense-actions');
      const result = await deleteExpense(id);
      if (result.success) {
        await fetchExpenses(expensePagination.page);
        await fetchStats();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('এই ক্যাটাগরি মুছে ফেলতে চান?')) return;
    setActionLoading(true);
    try {
      const { deleteExpenseCategory } = await import('@/lib/actions/expense-actions');
      const result = await deleteExpenseCategory(id);
      if (result.success) {
        await fetchCategories();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('এই স্টাফকে মুছে ফেলতে চান? তার সকল বেতন রেকর্ডও মুছে যাবে।')) return;
    setActionLoading(true);
    try {
      const { deleteStaff } = await import('@/lib/actions/expense-actions');
      const result = await deleteStaff(id);
      if (result.success) {
        await fetchStaff();
        await fetchSalaries();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateSalaries = async () => {
    setActionLoading(true);
    try {
      const { generateMonthlySalaries } = await import('@/lib/actions/expense-actions');
      const result = await generateMonthlySalaries(salaryMonth, salaryYear);
      if (result.success) {
        await fetchSalaries();
        await fetchStats();
        alert(result.message);
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaySalary = async (salaryId: string, amount: number, method: string) => {
    setActionLoading(true);
    try {
      const { paySalary } = await import('@/lib/actions/expense-actions');
      const result = await paySalary(salaryId, amount, method);
      if (result.success) {
        await fetchSalaries();
        await fetchStats();
        setShowPaySalary(null);
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSalary = async (
    salaryId: string,
    data: { overtime: number; bonus: number; deduction: number; advance: number; note?: string }
  ) => {
    setActionLoading(true);
    try {
      const { updateSalary } = await import('@/lib/actions/expense-actions');
      const result = await updateSalary(salaryId, data);
      if (result.success) {
        await fetchSalaries();
        await fetchStats();
        setShowEditSalary(null);
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSalary = async (salaryId: string) => {
    setActionLoading(true);
    try {
      const { deleteSalary } = await import('@/lib/actions/expense-actions');
      const result = await deleteSalary(salaryId);
      if (result.success) {
        await fetchSalaries();
        await fetchStats();
        setShowDeleteSalary(null);
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedCategories = async () => {
    setActionLoading(true);
    try {
      const { createExpenseCategory } = await import('@/lib/actions/expense-actions');
      for (const cat of DEFAULT_CATEGORIES) {
        await createExpenseCategory(cat).catch(() => {}); // skip if already exists
      }
      await fetchCategories();
    } finally {
      setActionLoading(false);
    }
  };

  // ═══════════════ TABS CONFIG ═══════════════

  const tabs: { id: Tab; label: string; icon: typeof Wallet }[] = [
    { id: 'overview', label: 'সারসংক্ষেপ', icon: BarChart3 },
    { id: 'expenses', label: 'খরচ সমূহ', icon: Receipt },
    { id: 'salary', label: 'স্টাফ বেতন', icon: Users },
    { id: 'categories', label: 'ক্যাটাগরি', icon: Tag },
    { id: 'reports', label: 'রিপোর্ট', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ═══════════════ RENDER ═══════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-500 text-sm mt-1">দোকানের সকল খরচ ও বেতনের হিসাব</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'expenses' && (
            <button
              onClick={() => { setEditingExpense(null); setShowAddExpense(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              নতুন খরচ যোগ করুন
            </button>
          )}
          {activeTab === 'salary' && (
            <button
              onClick={() => { setEditingStaff(null); setShowAddStaff(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              নতুন স্টাফ
            </button>
          )}
          {activeTab === 'categories' && (
            <button
              onClick={() => { setEditingCategory(null); setShowAddCategory(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              নতুন ক্যাটাগরি
            </button>
          )}
          <button onClick={refreshAll} className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-200 p-1.5 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              stats={stats}
              onTabChange={setActiveTab}
              onGoToSalary={(month, year) => {
                setSalaryMonth(month);
                setSalaryYear(year);
                setActiveTab('salary');
              }}
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={expenses}
              categories={categories}
              pagination={expensePagination}
              search={expenseSearch}
              onSearchChange={setExpenseSearch}
              categoryFilter={expenseCategoryFilter}
              onCategoryFilterChange={setExpenseCategoryFilter}
              paymentFilter={expensePaymentFilter}
              onPaymentFilterChange={setExpensePaymentFilter}
              dateFrom={expenseDateFrom}
              dateTo={expenseDateTo}
              onDateFromChange={setExpenseDateFrom}
              onDateToChange={setExpenseDateTo}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              onPageChange={(p) => fetchExpenses(p)}
              onDelete={handleDeleteExpense}
              onEdit={(expense) => { setEditingExpense(expense); setShowAddExpense(true); }}
              onSearch={() => fetchExpenses(1)}
              actionLoading={actionLoading}
            />
          )}
          {activeTab === 'salary' && (
            <SalaryTab
              staffMembers={staffMembers}
              salaries={salaries}
              month={salaryMonth}
              year={salaryYear}
              onMonthChange={setSalaryMonth}
              onYearChange={setSalaryYear}
              onGenerateSalaries={handleGenerateSalaries}
              onPaySalary={(s) => setShowPaySalary(s)}
              onEditSalary={(s) => setShowEditSalary(s)}
              onDeleteSalary={(s) => setShowDeleteSalary(s)}
              onEditStaff={(s) => { setEditingStaff(s); setShowAddStaff(true); }}
              onDeleteStaff={handleDeleteStaff}
              actionLoading={actionLoading}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab
              categories={categories}
              onEdit={(c) => { setEditingCategory(c); setShowAddCategory(true); }}
              onDelete={handleDeleteCategory}
              onSeedDefaults={handleSeedCategories}
              actionLoading={actionLoading}
            />
          )}
          {activeTab === 'reports' && <ReportsTab />}
        </motion.div>
      </AnimatePresence>

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Add/Edit Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <ExpenseFormModal
            expense={editingExpense}
            categories={categories}
            onClose={() => { setShowAddExpense(false); setEditingExpense(null); }}
            onSaved={() => {
              setShowAddExpense(false);
              setEditingExpense(null);
              fetchExpenses(expensePagination.page);
              fetchStats();
            }}
          />
        )}
      </AnimatePresence>

      {/* Add/Edit Category Modal */}
      <AnimatePresence>
        {showAddCategory && (
          <CategoryFormModal
            category={editingCategory}
            onClose={() => { setShowAddCategory(false); setEditingCategory(null); }}
            onSaved={() => {
              setShowAddCategory(false);
              setEditingCategory(null);
              fetchCategories();
            }}
          />
        )}
      </AnimatePresence>

      {/* Add/Edit Staff Modal */}
      <AnimatePresence>
        {showAddStaff && (
          <StaffFormModal
            staff={editingStaff}
            onClose={() => { setShowAddStaff(false); setEditingStaff(null); }}
            onSaved={() => {
              setShowAddStaff(false);
              setEditingStaff(null);
              fetchStaff();
              fetchSalaries();
            }}
          />
        )}
      </AnimatePresence>

      {/* Pay Salary Modal */}
      <AnimatePresence>
        {showPaySalary && (
          <PaySalaryModal
            salary={showPaySalary}
            onClose={() => setShowPaySalary(null)}
            onPay={handlePaySalary}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      {/* Edit Salary Modal */}
      <AnimatePresence>
        {showEditSalary && (
          <EditSalaryModal
            salary={showEditSalary}
            onClose={() => setShowEditSalary(null)}
            onSave={handleEditSalary}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      {/* Delete Salary Confirm */}
      <AnimatePresence>
        {showDeleteSalary && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteSalary(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">বেতন রেকর্ড মুছুন</h3>
                  <p className="text-sm text-gray-500">{showDeleteSalary.staff?.name} — {MONTH_NAMES_BN[showDeleteSalary.month - 1]} {showDeleteSalary.year}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">এই বেতন রেকর্ডটি স্থায়ীভাবে মুছে ফেলা হবে। আপনি কি নিশ্চিত?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteSalary(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  বাতিল
                </button>
                <button
                  onClick={() => handleDeleteSalary(showDeleteSalary.id)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'মুছছে...' : 'মুছুন'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════

function OverviewTab({ stats, onTabChange, onGoToSalary }: {
  stats: ExpenseStats | null;
  onTabChange: (tab: Tab) => void;
  onGoToSalary: (month: number, year: number) => void;
}) {
  if (!stats) return <div className="text-center py-12 text-gray-500">ডেটা লোড হচ্ছে...</div>;

  const statCards = [
    {
      label: 'এই মাসের খরচ',
      value: formatCurrency(stats.totalThisMonth),
      change: stats.monthlyChange,
      icon: Wallet,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: 'আজকের খরচ',
      value: formatCurrency(stats.totalToday),
      sub: `${stats.expenseCountToday}টি এন্ট্রি`,
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: 'বকেয়া বেতন',
      value: formatCurrency(stats.salaryDueTotal),
      sub: stats.salaryDueBreakdown.length > 0 ? `${stats.salaryDueBreakdown.length}জন স্টাফের বকেয়া আছে — বিস্তারিত দেখুন ↓` : 'সকল বেতন পরিশোধিত',
      icon: Users,
      iconBg: stats.salaryDueTotal > 0 ? 'bg-red-100' : 'bg-green-100',
      iconColor: stats.salaryDueTotal > 0 ? 'text-red-600' : 'text-green-600',
      onClick: stats.salaryDueTotal > 0 ? () => onTabChange('salary') : undefined,
    },
    {
      label: 'বার্ষিক খরচ',
      value: formatCurrency(stats.totalThisYear),
      sub: new Date().getFullYear().toString(),
      icon: BarChart3,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      onClick: undefined as (() => void) | undefined,
    },
  ];

  const maxCategoryTotal = Math.max(...(stats.categoryBreakdown.map(c => c.total) || [1]), 1);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            onClick={card.onClick}
            className={cn(
              "bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow",
              card.onClick && "cursor-pointer hover:border-red-300 hover:bg-red-50/30"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                {(card as any).change !== undefined && (card as any).change !== 0 && (
                  <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", (card as any).change > 0 ? "text-red-500" : "text-green-500")}>
                    {(card as any).change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs((card as any).change)}% গত মাসের তুলনায়
                  </div>
                )}
                {card.sub && <p className={cn("text-xs mt-1", card.onClick ? 'text-red-500 font-medium' : 'text-gray-400')}>{card.sub}</p>}
              </div>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", card.iconBg)}>
                <card.icon className={cn("w-6 h-6", card.iconColor)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            ক্যাটাগরি অনুযায়ী খরচ (এই মাস)
          </h3>
          {stats.categoryBreakdown.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">এই মাসে কোনো খরচ নেই</p>
          ) : (
            <div className="space-y-3">
              {stats.categoryBreakdown.map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{cat.icon || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{cat.name}</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(cat.total / maxCategoryTotal) * 100}%`,
                          backgroundColor: cat.color || '#6B7280',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            মাসিক খরচের ট্রেন্ড
          </h3>
          {stats.monthlyTrend.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">পর্যাপ্ত ডেটা নেই</p>
          ) : (
            <div className="space-y-3">
              {stats.monthlyTrend.map((m, i) => {
                const maxTotal = Math.max(...stats.monthlyTrend.map(t => t.total), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16">{MONTH_NAMES_BN[m.month - 1]?.slice(0, 3)}</span>
                    <div className="flex-1">
                      <div className="w-full h-6 bg-gray-50 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${Math.max((m.total / maxTotal) * 100, 8)}%` }}
                        >
                          <span className="text-[10px] text-white font-medium whitespace-nowrap">
                            {formatCurrency(m.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 w-10 text-right">{m.count}টি</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Salary Summary + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-blue-600" />
            এই মাসের বেতন সারসংক্ষেপ
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-lg font-bold text-blue-700">{formatCurrency(stats.salaryThisMonth)}</p>
              <p className="text-xs text-blue-600 mt-1">মোট বেতন</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-lg font-bold text-green-700">{formatCurrency(stats.salaryPaidThisMonth)}</p>
              <p className="text-xs text-green-600 mt-1">পরিশোধিত</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-lg font-bold text-red-700">{formatCurrency(stats.salaryDueTotal)}</p>
              <p className="text-xs text-red-600 mt-1">বকেয়া</p>
            </div>
          </div>

          {/* Per-staff due breakdown */}
          {stats.salaryDueBreakdown.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">বকেয়া বিস্তারিত</p>
              <div className="space-y-2">
                {stats.salaryDueBreakdown.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.staffName}</p>
                      <p className="text-xs text-gray-500">{MONTH_NAMES_BN[item.month - 1]} {item.year} · নেট: {formatCurrency(item.netSalary)} · পরিশোধ: {formatCurrency(item.paidAmount)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-red-700">{formatCurrency(item.dueAmount)}</p>
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        item.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      )}>
                        {item.status === 'PARTIAL' ? 'আংশিক' : 'বকেয়া'}
                      </span>
                    </div>
                    <button
                      onClick={() => onGoToSalary(item.month, item.year)}
                      className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      পরিশোধ →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700 font-medium">সকল বেতন পরিশোধিত — কোনো বকেয়া নেই</p>
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            সাম্প্রতিক খরচ
          </h3>
          {stats.recentExpenses.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">কোনো খরচ নেই</p>
          ) : (
            <div className="space-y-3">
              {stats.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <span className="text-lg">{expense.category?.icon || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{expense.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(expense.date)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// EXPENSES TAB
// ═══════════════════════════════════════════════════════

interface ExpensesTabProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (v: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onSearch: () => void;
  actionLoading: boolean;
}

function ExpensesTab(props: ExpensesTabProps) {
  const { expenses, categories, pagination, search, onSearchChange, categoryFilter, onCategoryFilterChange, paymentFilter, onPaymentFilterChange, dateFrom, dateTo, onDateFromChange, onDateToChange, showFilters, onToggleFilters, onPageChange, onDelete, onEdit, onSearch, actionLoading } = props;

  const totalOnPage = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="খরচ খুঁজুন (শিরোনাম, নোট, রেফারেন্স)..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <button
            onClick={onToggleFilters}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors",
              showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4" />
            ফিল্টার
          </button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-gray-100 mt-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ক্যাটাগরি</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => { onCategoryFilterChange(e.target.value); onSearch(); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">সকল ক্যাটাগরি</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">পেমেন্ট মেথড</label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => { onPaymentFilterChange(e.target.value); onSearch(); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">সকল পেমেন্ট</option>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">তারিখ থেকে</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { onDateFromChange(e.target.value); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">তারিখ পর্যন্ত</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { onDateToChange(e.target.value); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    onCategoryFilterChange('');
                    onPaymentFilterChange('');
                    onDateFromChange('');
                    onDateToChange('');
                    onSearch();
                  }}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  ফিল্টার রিসেট করুন
                </button>
                <button onClick={onSearch} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  খুঁজুন
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">কোনো খরচ পাওয়া যায়নি</p>
            <p className="text-gray-400 text-sm mt-1">নতুন খরচ যোগ করুন</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">তারিখ</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">শিরোনাম</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">ক্যাটাগরি</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">পেমেন্ট</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">প্রাপক</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">পরিমাণ</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const PayIcon = getPaymentMethodIcon(expense.paymentMethod);
                    return (
                      <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(expense.date)}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                          {expense.reference && (
                            <p className="text-xs text-gray-400 mt-0.5">Ref: {expense.reference}</p>
                          )}
                          {expense.note && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{expense.note}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${expense.category?.color || '#6B7280'}15`,
                              color: expense.category?.color || '#6B7280',
                            }}
                          >
                            <span>{expense.category?.icon || '📌'}</span>
                            {expense.category?.name}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                            <PayIcon className="w-3.5 h-3.5" />
                            {getPaymentMethodLabel(expense.paymentMethod)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {expense.paidTo || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEdit(expense)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="এডিট করুন"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(expense.id)}
                              disabled={actionLoading}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-gray-700">
                      পৃষ্ঠার মোট ({expenses.length}টি)
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-blue-700">
                      {formatCurrency(totalOnPage)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  মোট {pagination.total}টির মধ্যে {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} দেখাচ্ছে
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                          pageNum === pagination.page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SALARY TAB
// ═══════════════════════════════════════════════════════

interface SalaryTabProps {
  staffMembers: StaffMember[];
  salaries: StaffSalary[];
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
  onGenerateSalaries: () => void;
  onPaySalary: (s: StaffSalary) => void;
  onEditSalary: (s: StaffSalary) => void;
  onDeleteSalary: (s: StaffSalary) => void;
  onEditStaff: (s: StaffMember) => void;
  onDeleteStaff: (id: string) => void;
  actionLoading: boolean;
}

function SalaryTab(props: SalaryTabProps) {
  const { staffMembers, salaries, month, year, onMonthChange, onYearChange, onGenerateSalaries, onPaySalary, onEditSalary, onDeleteSalary, onEditStaff, onDeleteStaff, actionLoading } = props;
  const [view, setView] = useState<'salary' | 'staff'>('salary');

  const totalNet = salaries.reduce((s, sal) => s + sal.netSalary, 0);
  const totalPaid = salaries.reduce((s, sal) => s + sal.paidAmount, 0);
  const totalDue = salaries.reduce((s, sal) => s + sal.dueAmount, 0);

  const salaryStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'বকেয়া', color: 'text-amber-700', bg: 'bg-amber-50' },
    PARTIAL: { label: 'আংশিক', color: 'text-blue-700', bg: 'bg-blue-50' },
    PAID: { label: 'পরিশোধিত', color: 'text-green-700', bg: 'bg-green-50' },
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('salary')}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors", view === 'salary' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50")}
            >
              <HandCoins className="w-4 h-4 inline mr-1.5" />
              বেতন শীট
            </button>
            <button
              onClick={() => setView('staff')}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors", view === 'staff' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50")}
            >
              <Users className="w-4 h-4 inline mr-1.5" />
              স্টাফ তালিকা ({staffMembers.length})
            </button>
          </div>

          {view === 'salary' && (
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {MONTH_NAMES_BN.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select
                value={year}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={onGenerateSalaries}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleDollarSign className="w-4 h-4" />}
                বেতন তৈরি করুন
              </button>
            </div>
          )}
        </div>
      </div>

      {view === 'salary' ? (
        <>
          {/* Salary Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">মোট বেতন</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalNet)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">পরিশোধিত</p>
              <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">বকেয়া</p>
              <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalDue)}</p>
            </div>
          </div>

          {/* Salary Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {salaries.length === 0 ? (
              <div className="text-center py-16">
                <HandCoins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{MONTH_NAMES_BN[month - 1]} {year} মাসের বেতন তৈরি হয়নি</p>
                <p className="text-gray-400 text-sm mt-1">&quot;বেতন তৈরি করুন&quot; বাটনে ক্লিক করুন</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">স্টাফ</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">পদবি</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">বেসিক</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">বোনাস/ওভারটাইম</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">কর্তন/অগ্রিম</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">নেট বেতন</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">পরিশোধিত</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">বকেয়া</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">স্ট্যাটাস</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map((salary) => {
                      const statusConf = salaryStatusConfig[salary.status] || salaryStatusConfig.PENDING;
                      return (
                        <tr key={salary.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                                {salary.staff?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{salary.staff?.name}</p>
                                <p className="text-xs text-gray-400">{salary.staff?.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-600">{salary.staff?.role || '—'}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-700 text-right">{formatCurrency(salary.basicSalary)}</td>
                          <td className="px-5 py-3.5 text-sm text-green-600 text-right">
                            {salary.bonus + salary.overtime > 0 ? `+${formatCurrency(salary.bonus + salary.overtime)}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-red-600 text-right">
                            {salary.deduction + salary.advance > 0 ? `-${formatCurrency(salary.deduction + salary.advance)}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-bold text-gray-900 text-right">{formatCurrency(salary.netSalary)}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-green-700 text-right">{formatCurrency(salary.paidAmount)}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-red-700 text-right">
                            {salary.dueAmount > 0 ? formatCurrency(salary.dueAmount) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium", statusConf.bg, statusConf.color)}>
                              {statusConf.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onEditSalary(salary)}
                                disabled={actionLoading}
                                title="বোনাস/ওভারটাইম/কর্তন সম্পাদনা"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                সম্পাদনা
                              </button>
                              <button
                                onClick={() => onDeleteSalary(salary)}
                                disabled={actionLoading}
                                title="বেতন রেকর্ড মুছুন"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                মুছুন
                              </button>
                              {salary.status !== 'PAID' ? (
                                <button
                                  onClick={() => onPaySalary(salary)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  <Banknote className="w-3.5 h-3.5" />
                                  পরিশোধ
                                </button>
                              ) : (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1 px-2">
                                  <Check className="w-3.5 h-3.5" /> সম্পন্ন
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                      <td colSpan={5} className="px-5 py-3 text-sm text-gray-700">মোট</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-900">{formatCurrency(totalNet)}</td>
                      <td className="px-5 py-3 text-sm text-right text-green-700">{formatCurrency(totalPaid)}</td>
                      <td className="px-5 py-3 text-sm text-right text-red-700">{formatCurrency(totalDue)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Staff List */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {staffMembers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">কোনো স্টাফ যোগ করা হয়নি</p>
              <p className="text-gray-400 text-sm mt-1">নতুন স্টাফ যোগ করুন</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">নাম</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">ফোন</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">পদবি</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">যোগদানের তারিখ</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">বেসিক বেতন</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">স্ট্যাটাস</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map((staff) => (
                    <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                            {staff.email && <p className="text-xs text-gray-400">{staff.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{staff.phone}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{staff.role || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(staff.joiningDate)}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900 text-right">{formatCurrency(staff.baseSalary)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          "inline-flex px-2.5 py-1 rounded-full text-xs font-medium",
                          staff.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {staff.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditStaff(staff)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteStaff(staff.id)}
                            disabled={actionLoading}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CATEGORIES TAB
// ═══════════════════════════════════════════════════════

function CategoriesTab({ categories, onEdit, onDelete, onSeedDefaults, actionLoading }: {
  categories: ExpenseCategory[];
  onEdit: (c: ExpenseCategory) => void;
  onDelete: (id: string) => void;
  onSeedDefaults: () => void;
  actionLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      {categories.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-800 mb-1">কোনো ক্যাটাগরি নেই</h3>
          <p className="text-amber-600 text-sm mb-4">প্রথমে খরচের ক্যাটাগরি তৈরি করুন অথবা ডিফল্ট ক্যাটাগরি যোগ করুন</p>
          <button
            onClick={onSeedDefaults}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            ডিফল্ট ক্যাটাগরি যোগ করুন
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${cat.color || '#6B7280'}15` }}
                >
                  {cat.icon || '📌'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{cat._count.expenses}টি খরচ</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(cat)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(cat.id)}
                  disabled={actionLoading}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#6B7280' }} />
              <span className="text-xs text-gray-400">{cat.slug}</span>
              {!cat.isActive && (
                <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">নিষ্ক্রিয়</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// REPORTS TAB
// ═══════════════════════════════════════════════════════

function ReportsTab() {
  const now = new Date();

  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');

  // Weekly: track Monday of selected week
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff); d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selYearOnly, setSelYearOnly] = useState(now.getFullYear());
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(now); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [customTo, setCustomTo] = useState(() => now.toISOString().split('T')[0]);

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const getRange = useCallback(() => {
    if (periodType === 'weekly') {
      const e = new Date(weekStart); e.setDate(e.getDate() + 6);
      return { dateFrom: weekStart.toISOString().split('T')[0], dateTo: e.toISOString().split('T')[0], month: undefined, year: undefined };
    }
    if (periodType === 'monthly') {
      const first = new Date(selYear, selMonth - 1, 1);
      const last = new Date(selYear, selMonth, 0);
      return { dateFrom: first.toISOString().split('T')[0], dateTo: last.toISOString().split('T')[0], month: selMonth, year: selYear };
    }
    if (periodType === 'yearly') {
      return { dateFrom: `${selYearOnly}-01-01`, dateTo: `${selYearOnly}-12-31`, month: undefined, year: selYearOnly };
    }
    return { dateFrom: customFrom, dateTo: customTo, month: undefined, year: undefined };
  }, [periodType, weekStart, selMonth, selYear, selYearOnly, customFrom, customTo]);

  const periodLabel = useMemo(() => {
    const r = getRange();
    if (periodType === 'weekly') {
      const e = new Date(weekStart); e.setDate(e.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    }
    if (periodType === 'monthly') return `${MONTH_NAMES_BN[selMonth - 1]} ${selYear}`;
    if (periodType === 'yearly') return `${selYearOnly} সাল`;
    return `${r.dateFrom} থেকে ${r.dateTo}`;
  }, [periodType, weekStart, selMonth, selYear, selYearOnly, customFrom, customTo, getRange]);

  const fetchData = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const { getReport } = await import('@/lib/actions/expense-actions');
      const range = getRange();
      const result = await getReport({ mode: periodType, ...range });
      if ((result as any).success) setReportData((result as any).data);
      else setFetchError((result as any).error || 'সমত্যা হয়েছে');
    } catch (err: any) {
      setFetchError(err.message);
    } finally { setLoading(false); }
  }, [periodType, getRange]);

  useEffect(() => { fetchData(); }, []);

  const shiftWeek = (dir: number) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + dir * 7); setWeekStart(d);
  };

  const handlePrint = () => {
    if (!reportData) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>TechHat - খরচ রিপোর্ট - ${periodLabel}</title>
      <style>
        body{font-family:'Segoe UI',sans-serif;padding:30px;color:#1a1a1a}
        h1{text-align:center;color:#1e40af;margin-bottom:5px}
        h2{text-align:center;color:#6b7280;font-weight:400;margin-top:0}
        .cards{display:flex;gap:16px;margin:24px 0}
        .card{flex:1;background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:10px;text-align:center}
        .card .val{font-size:22px;font-weight:700;color:#1e40af}
        .card .lbl{font-size:12px;color:#6b7280;margin-top:4px}
        h3{color:#1e40af;border-bottom:2px solid #1e40af;padding-bottom:6px;margin-top:28px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th{background:#1e40af;color:#fff;padding:9px 12px;text-align:left}
        td{padding:8px 12px;border-bottom:1px solid #e2e8f0}
        tr:nth-child(even){background:#f8fafc}
        .tr{text-align:right} .ft{font-weight:700;background:#eff6ff!important}
        .footer{text-align:center;color:#9ca3af;font-size:11px;margin-top:40px}
        @media print{body{padding:10px}}
      </style></head><body>
      <h1>TechHat — খরচ রিপোর্ট</h1>
      <h2>${periodLabel}</h2>
      <div class="cards">
        <div class="card"><div class="val">৳${reportData.totalExpense?.toLocaleString()}</div><div class="lbl">মোট খরচ</div></div>
        <div class="card"><div class="val">৳${reportData.totalSalary?.toLocaleString()}</div><div class="lbl">মোট বেতন</div></div>
        <div class="card"><div class="val">৳${reportData.grandTotal?.toLocaleString()}</div><div class="lbl">সর্বমোট</div></div>
      </div>
      ${reportData.expenses?.length > 0 ? `<h3>খরচের বিস্তারিত তালিকা</h3>
      <table><thead><tr><th>#</th><th>শিরোনাম</th><th>ক্যাটাগরি</th><th>তারিখ</th><th>পেমেন্ট</th><th class="tr">পরিমাণ</th></tr></thead>
      <tbody>${reportData.expenses.map((e: any, i: number) =>
        `<tr><td>${i+1}</td><td>${e.title}</td><td>${e.category?.name||'-'}</td><td>${new Date(e.date).toLocaleDateString('en-GB')}</td><td>${getPaymentMethodLabel(e.paymentMethod)}</td><td class="tr">৳${e.amount?.toLocaleString()}</td></tr>`
      ).join('')}
      <tr class="ft"><td colspan="5">মোট খরচ</td><td class="tr">৳${reportData.totalExpense?.toLocaleString()}</td></tr>
      </tbody></table>` : ''}
      ${reportData.salaries?.length > 0 ? `<h3>স্টাফ বেতন</h3>
      <table><thead><tr><th>নাম</th><th>পদবি</th><th>বেসিক</th><th>নেট</th><th>পরিশোধ</th><th>বকেয়া</th><th>অবস্থা</th></tr></thead>
      <tbody>${reportData.salaries.map((s: any) =>
        `<tr><td>${s.staff?.name}</td><td>${s.staff?.role||'-'}</td><td>৳${s.basicSalary?.toLocaleString()}</td><td>৳${s.netSalary?.toLocaleString()}</td><td>৳${s.paidAmount?.toLocaleString()}</td><td>৳${s.dueAmount?.toLocaleString()}</td><td>${s.status==='PAID'?'পরিশোধিত':s.status==='PARTIAL'?'আংশিক':'বকেয়া'}</td></tr>`
      ).join('')}</tbody></table>` : ''}
      <div class="footer">প্রিন্ট: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')} | TechHat Admin</div>
    </body></html>`);
    win.document.close(); win.focus(); setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const PERIOD_TYPES = [
    { key: 'weekly', label: 'সাপ্তাহিক' },
    { key: 'monthly', label: 'মাসিক' },
    { key: 'yearly', label: 'বাৎসরিক' },
    { key: 'custom', label: 'কাস্টম' },
  ] as const;

  const DAYS_BN = ['সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি', 'রবি'];

  const maxTrend = reportData ? Math.max(...(reportData.dailyTrend || []).map((d: any) => d.total), 1) : 1;
  const maxYearlySalary = reportData ? Math.max(...(reportData.yearlySalaryByMonth || []).map((m: any) => m.netSalary), ...((reportData.dailyTrend || []).map((d: any) => d.total)), 1) : 1;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        {/* Period type selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {PERIOD_TYPES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setPeriodType(key); setReportData(null); }}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  periodType === key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {reportData && (
              <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                <Printer className="w-4 h-4" />প্রিন্ট
              </button>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              {loading ? 'রিপোর্ট শেষ লোড...' : 'রিপোর্হ দেখুন'}
            </button>
          </div>
        </div>

        {/* Period sub-controls */}
        <div className="flex flex-wrap items-center gap-3">
          {periodType === 'weekly' && (
            <div className="flex items-center gap-2">
              <button onClick={() => shiftWeek(-1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-semibold text-gray-700 min-w-[180px] text-center">{periodLabel}</span>
              <button onClick={() => shiftWeek(1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
          {periodType === 'monthly' && (
            <div className="flex items-center gap-2">
              <button onClick={() => { const d = new Date(selYear, selMonth - 2, 1); setSelMonth(d.getMonth()+1); setSelYear(d.getFullYear()); }} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
              <select value={selMonth} onChange={e => setSelMonth(Number(e.target.value))} className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                {MONTH_NAMES_BN.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
              <select value={selYear} onChange={e => setSelYear(Number(e.target.value))} className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                {Array.from({length:5},(_,i)=>now.getFullYear()-2+i).map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={() => { const d = new Date(selYear, selMonth, 1); setSelMonth(d.getMonth()+1); setSelYear(d.getFullYear()); }} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
          {periodType === 'yearly' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setSelYearOnly(y => y - 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
              <select value={selYearOnly} onChange={e => setSelYearOnly(Number(e.target.value))} className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none">
                {Array.from({length:6},(_,i)=>now.getFullYear()-3+i).map(y=><option key={y} value={y}>{y}</option>)}
              </select>
              <button onClick={() => setSelYearOnly(y => y + 1)} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
          {periodType === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 font-medium">শুরু</label>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="flex items-center gap-1.5">
                <label className="text-xs text-gray-500 font-medium">শেষ</label>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              </div>
            </div>
          )}
          {reportData && periodType !== 'custom' && (
            <span className="ml-auto text-xs text-gray-400">{reportData.expenses?.length || 0}টি এন্ট্রি</span>
          )}
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">সমত্যা: {fetchError}</div>
      )}

      {!reportData && !loading && !fetchError && (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">পিরিয়ড নির্বাচন করে “রিপোর্ট দেখুন” তে ক্লিক করুন</p>
        </div>
      )}

      {reportData && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Receipt className="w-5 h-5 text-blue-600" /></div>
                <p className="text-sm text-gray-500">মোট খরচ</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalExpense)}</p>
              <p className="text-xs text-gray-400 mt-1">{reportData.expenses?.length || 0}টি এন্ট্রি &middot; {periodLabel}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div>
                <p className="text-sm text-gray-500">মোট বেতন</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalSalary)}</p>
              {reportData.salaries?.length > 0 && <p className="text-xs text-gray-400 mt-1">{reportData.salaries.length}জন স্টাফ &middot; বকেয়া: {formatCurrency(reportData.totalSalaryDue)}</p>}
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><CircleDollarSign className="w-5 h-5 text-white" /></div>
                <p className="text-sm text-blue-100">সর্বমোট ব্যয়</p>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(reportData.grandTotal)}</p>
              <p className="text-xs text-blue-200 mt-1">{periodLabel}</p>
            </div>
          </div>

          {/* Trend Chart */}
          {reportData.dailyTrend?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                {periodType === 'weekly' ? 'দৈনিক খরচ হিস্টোগ্রাম' : periodType === 'monthly' ? 'দিন অনুযায়ী খরচ' : 'প্রতিদিনের খরচ'}
              </h3>
              {periodType === 'weekly' ? (
                <div className="flex items-end gap-2 h-36">
                  {Array.from({length:7},(_,i)=>{
                    const d = new Date(weekStart); d.setDate(d.getDate()+i);
                    const dayStr = d.toISOString().split('T')[0];
                    const entry = reportData.dailyTrend.find((t: any) => t.day === dayStr);
                    const h = entry ? Math.max((entry.total/maxTrend)*100,3) : 0;
                    const isToday = dayStr === now.toISOString().split('T')[0];
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        {entry && <span className="text-[10px] text-gray-500">{formatCurrency(entry.total)}</span>}
                        <div className="w-full flex items-end" style={{height:'96px'}}>
                          <div
                            className={cn('w-full rounded-t-lg transition-all',isToday?'bg-blue-600':'bg-blue-400')}
                            style={{height: entry ? `${h}%` : '3px', minHeight: entry ? undefined : '3px'}}
                          />
                        </div>
                        <span className={cn('text-xs font-medium',isToday?'text-blue-600':'text-gray-500')}>{DAYS_BN[i]}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {reportData.dailyTrend.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{new Date(d.day+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</span>
                      <div className="flex-1 h-5 bg-gray-50 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-end pr-2"
                          style={{width:`${Math.max((d.total/maxTrend)*100,4)}%`}}
                        >
                          <span className="text-[10px] text-white font-medium whitespace-nowrap">{formatCurrency(d.total)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 w-8 text-right">{d.count}টি</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Yearly: salary by month chart */}
          {periodType === 'yearly' && reportData.yearlySalaryByMonth?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-purple-600" />
                মাসিক বেতন বিতরণ ({selYearOnly})
              </h3>
              <div className="space-y-2">
                {reportData.yearlySalaryByMonth.map((m: any) => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0">{MONTH_NAMES_BN[m.month-1]?.slice(0,4)}</span>
                    <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-end pr-2"
                        style={{width:`${Math.max((m.netSalary/maxYearlySalary)*100,4)}%`}}>
                        <span className="text-[10px] text-white font-medium">{formatCurrency(m.netSalary)}</span>
                      </div>
                    </div>
                    {m.due > 0 && <span className="text-[10px] text-red-600 font-medium w-20 text-right">বক: {formatCurrency(m.due)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Breakdown */}
            {reportData.categoryBreakdown?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />ক্যাটাগরি অনুযায়ী বিভাজন
                </h3>
                <div className="space-y-3">
                  {reportData.categoryBreakdown.map((cat: any, i: number) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{cat.icon || '📌'}</span>
                          <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                          <span className="text-xs text-gray-400">{cat.count}টি</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">{cat.percent}%</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.total)}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{width:`${cat.percent}%`, backgroundColor: cat.color||'#6B7280'}} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            {reportData.paymentBreakdown?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />পেমেন্ট পদ্ধতি
                </h3>
                <div className="space-y-3">
                  {reportData.paymentBreakdown.map((pm: any, i: number) => {
                    const PMIcon = getPaymentMethodIcon(pm.method);
                    const pct = reportData.totalExpense > 0 ? Math.round((pm.total/reportData.totalExpense)*100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <PMIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{getPaymentMethodLabel(pm.method)}</span>
                            <span className="text-xs text-gray-400">{pm.count}টি</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">{pct}%</span>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(pm.total)}</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{width:`${pct}%`}} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Monthly: Salary Detail Table */}
          {reportData.salaries?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">স্টাফ বেতন বিস্তারিত</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">নাম</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">পদবি</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">বেসিক</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">নেট</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">পরিশোধ</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">বকেয়া</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500">অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.salaries.map((s: any) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{s.staff?.name}</td>
                        <td className="px-5 py-3 text-xs text-gray-500">{s.staff?.role||'—'}</td>
                        <td className="px-5 py-3 text-sm text-right text-gray-700">{formatCurrency(s.basicSalary)}</td>
                        <td className="px-5 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(s.netSalary)}</td>
                        <td className="px-5 py-3 text-sm text-right text-green-700">{formatCurrency(s.paidAmount)}</td>
                        <td className="px-5 py-3 text-sm text-right text-red-600">{formatCurrency(s.dueAmount)}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={cn('inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                            s.status==='PAID'?'bg-green-100 text-green-700':s.status==='PARTIAL'?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'
                          )}>{s.status==='PAID'?'পরিশোধিত':s.status==='PARTIAL'?'আংশিক':'বকেয়া'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                      <td colSpan={3} className="px-5 py-3 text-sm text-gray-700">মোট</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-900">{formatCurrency(reportData.totalSalary)}</td>
                      <td className="px-5 py-3 text-sm text-right text-green-700">{formatCurrency(reportData.totalSalaryPaid)}</td>
                      <td className="px-5 py-3 text-sm text-right text-red-600">{formatCurrency(reportData.totalSalaryDue)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Expense Table */}
          {reportData.expenses?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">খরচের বিস্তারিত তালিকা</h3>
                </div>
                <span className="text-xs text-gray-400">{reportData.expenses.length}টি রেকর্ড</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">তারিখ</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">শিরোনাম</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">ক্যাটাগরি</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">পেমেন্ট</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.expenses.map((e: any, i: number) => (
                      <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-5 py-2.5 text-sm text-gray-400">{i+1}</td>
                        <td className="px-5 py-2.5 text-sm text-gray-500">{formatDate(e.date)}</td>
                        <td className="px-5 py-2.5 text-sm text-gray-900 font-medium">{e.title}</td>
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span>{e.category?.icon||'📌'}</span>
                            <span className="text-sm text-gray-600">{e.category?.name||'—'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 text-sm text-gray-600">{getPaymentMethodLabel(e.paymentMethod)}</td>
                        <td className="px-5 py-2.5 text-sm font-bold text-gray-900 text-right">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-gray-700">মোট খরচ</td>
                      <td className="px-5 py-3 text-sm font-bold text-blue-700 text-right">{formatCurrency(reportData.totalExpense)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {reportData.expenses?.length === 0 && reportData.salaries?.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{periodLabel} এ কোনো ডেটা নেই</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════

// ── Expense Form Modal ──
function ExpenseFormModal({ expense, categories, onClose, onSaved }: {
  expense: Expense | null;
  categories: ExpenseCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!expense;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: expense?.title || '',
    amount: expense?.amount?.toString() || '',
    categoryId: expense?.categoryId || '',
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    paymentMethod: expense?.paymentMethod || 'CASH',
    paidTo: expense?.paidTo || '',
    reference: expense?.reference || '',
    note: expense?.note || '',
    isRecurring: expense?.isRecurring || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.categoryId) {
      alert('শিরোনাম, পরিমাণ ও ক্যাটাগরি আবশ্যক');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        const { updateExpense } = await import('@/lib/actions/expense-actions');
        const result = await updateExpense(expense!.id, {
          ...form,
          amount: parseFloat(form.amount),
        });
        if (!result.success) { alert(result.error); return; }
      } else {
        const { createExpense } = await import('@/lib/actions/expense-actions');
        const result = await createExpense({
          ...form,
          amount: parseFloat(form.amount),
        });
        if (!result.success) { alert(result.error); return; }
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'খরচ সম্পাদনা করুন' : 'নতুন খরচ যোগ করুন'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">খরচের শিরোনাম *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="যেমন: দোকান ভাড়া"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">পরিমাণ (৳) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">তারিখ</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ক্যাটাগরি *</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              required
            >
              <option value="">ক্যাটাগরি নির্বাচন করুন</option>
              {categories.filter(c => c.isActive).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">পেমেন্ট মেথড</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: pm.value })}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-all",
                    form.paymentMethod === pm.value
                      ? "border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <pm.icon className="w-4 h-4" />
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Paid To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">প্রাপক</label>
              <input
                type="text"
                value={form.paidTo}
                onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                placeholder="কাকে দেওয়া হয়েছে"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">রেফারেন্স নং</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="রসিদ/রেফারেন্স নং"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">নোট</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              placeholder="অতিরিক্ত মন্তব্য..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">এটি একটি পুনরাবৃত্তিমূলক খরচ (মাসিক)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Category Form Modal ──
function CategoryFormModal({ category, onClose, onSaved }: {
  category: ExpenseCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!category;
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: category?.name || '',
    icon: category?.icon || '📌',
    color: category?.color || '#6B7280',
  });

  const EMOJI_OPTIONS = ['📌', '🏠', '⚡', '💧', '🌐', '🚗', '🔧', '📦', '📢', '🍽️', '💰', '🏪', '📱', '🖥️', '👔', '🎯', '📊', '🔒', '🧹', '📝'];
  const COLOR_OPTIONS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#84CC16', '#6B7280'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('ক্যাটাগরির নাম আবশ্যক'); return; }
    setFormError('');
    setLoading(true);
    try {
      if (isEdit) {
        const { updateExpenseCategory } = await import('@/lib/actions/expense-actions');
        const result = await updateExpenseCategory(category!.id, form);
        if (!result.success) { setFormError(result.error || 'সমস্যা হয়েছে'); setLoading(false); return; }
      } else {
        const { createExpenseCategory } = await import('@/lib/actions/expense-actions');
        const result = await createExpenseCategory(form);
        if (!result.success) { setFormError(result.error || 'সমস্যা হয়েছে'); setLoading(false); return; }
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ক্যাটাগরির নাম *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormError(''); }}
              placeholder="যেমন: দোকান ভাড়া"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">আইকন</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={cn(
                    "w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all",
                    form.icon === emoji ? "border-blue-400 bg-blue-50 ring-2 ring-blue-500/20" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">রং</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    form.color === color ? "ring-2 ring-offset-2 ring-blue-500 border-white" : "border-gray-200"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${form.color}20` }}>
              {form.icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{form.name || 'ক্যাটাগরির নাম'}</span>
            <div className="w-3 h-3 rounded-full ml-auto" style={{ backgroundColor: form.color }} />
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{formError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              বাতিল
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'আপডেট' : 'সংরক্ষণ'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Staff Form Modal ──
function StaffFormModal({ staff, onClose, onSaved }: {
  staff: StaffMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!staff;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: staff?.name || '',
    phone: staff?.phone || '',
    email: staff?.email || '',
    role: staff?.role || '',
    baseSalary: staff?.baseSalary?.toString() || '',
    joiningDate: staff?.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    address: staff?.address || '',
    nidNumber: staff?.nidNumber || '',
    emergencyContact: staff?.emergencyContact || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { alert('নাম ও ফোন নম্বর আবশ্যক'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        const { updateStaff } = await import('@/lib/actions/expense-actions');
        const result = await updateStaff(staff!.id, {
          ...form,
          baseSalary: parseFloat(form.baseSalary) || 0,
        });
        if (!result.success) { alert(result.error); return; }
      } else {
        const { createStaff } = await import('@/lib/actions/expense-actions');
        const result = await createStaff({
          ...form,
          baseSalary: parseFloat(form.baseSalary) || 0,
        });
        if (!result.success) { alert(result.error); return; }
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'স্টাফ সম্পাদনা' : 'নতুন স্টাফ যোগ করুন'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">নাম *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="সম্পূর্ণ নাম"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ফোন নম্বর *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ইমেইল</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">পদবি</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                <option value="">পদবি নির্বাচন করুন</option>
                <option value="Manager">ম্যানেজার</option>
                <option value="Salesman">সেলসম্যান</option>
                <option value="Cashier">ক্যাশিয়ার</option>
                <option value="Technician">টেকনিশিয়ান</option>
                <option value="Helper">হেল্পার</option>
                <option value="Delivery">ডেলিভারি</option>
                <option value="Security">সিকিউরিটি</option>
                <option value="Cleaner">ক্লিনার</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">বেসিক বেতন (৳)</label>
              <input
                type="number"
                value={form.baseSalary}
                onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">যোগদানের তারিখ</label>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ঠিকানা</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              placeholder="স্থায়ী ঠিকানা"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NID নম্বর</label>
              <input
                type="text"
                value={form.nidNumber}
                onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
                placeholder="জাতীয় পরিচয়পত্র নং"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">জরুরি যোগাযোগ</label>
              <input
                type="tel"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              বাতিল
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'আপডেট' : 'সংরক্ষণ'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Pay Salary Modal ──
function PaySalaryModal({ salary, onClose, onPay, loading }: {
  salary: StaffSalary;
  onClose: () => void;
  onPay: (id: string, amount: number, method: string) => void;
  loading: boolean;
}) {
  const [amount, setAmount] = useState(salary.dueAmount.toString());
  const [method, setMethod] = useState('CASH');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">বেতন পরিশোধ</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Staff Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-lg font-bold">
              {salary.staff?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{salary.staff?.name}</p>
              <p className="text-sm text-gray-500">{salary.staff?.role || 'Staff'} | {MONTH_NAMES_BN[salary.month - 1]} {salary.year}</p>
            </div>
          </div>

          {/* Salary Details */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-sm font-bold text-blue-700">{formatCurrency(salary.netSalary)}</p>
              <p className="text-xs text-blue-600">নেট বেতন</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <p className="text-sm font-bold text-green-700">{formatCurrency(salary.paidAmount)}</p>
              <p className="text-xs text-green-600">পরিশোধিত</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <p className="text-sm font-bold text-red-700">{formatCurrency(salary.dueAmount)}</p>
              <p className="text-xs text-red-600">বকেয়া</p>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">পরিশোধের পরিমাণ (৳)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={salary.dueAmount}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => setAmount(salary.dueAmount.toString())} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                সম্পূর্ণ
              </button>
              <button type="button" onClick={() => setAmount((salary.dueAmount / 2).toString())} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                অর্ধেক
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">পেমেন্ট মেথড</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setMethod(pm.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-all",
                    method === pm.value ? "border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <pm.icon className="w-4 h-4" />
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              বাতিল
            </button>
            <button
              onClick={() => {
                const a = parseFloat(amount);
                if (!a || a <= 0) { alert('সঠিক পরিমাণ দিন'); return; }
                onPay(salary.id, a, method);
              }}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
              পরিশোধ করুন
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Edit Salary Modal ──
function EditSalaryModal({ salary, onClose, onSave, loading }: {
  salary: StaffSalary;
  onClose: () => void;
  onSave: (id: string, data: { overtime: number; bonus: number; deduction: number; advance: number; note?: string }) => void;
  loading: boolean;
}) {
  const [overtime, setOvertime] = useState(salary.overtime.toString());
  const [bonus, setBonus] = useState(salary.bonus.toString());
  const [deduction, setDeduction] = useState(salary.deduction.toString());
  const [advance, setAdvance] = useState(salary.advance.toString());
  const [note, setNote] = useState(salary.note || '');

  const ovt = parseFloat(overtime) || 0;
  const bon = parseFloat(bonus) || 0;
  const ded = parseFloat(deduction) || 0;
  const adv = parseFloat(advance) || 0;
  const netSalary = salary.basicSalary + ovt + bon - ded - adv;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">বেতন সম্পাদনা</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Staff info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
              {salary.staff?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{salary.staff?.name}</p>
              <p className="text-xs text-gray-500">{MONTH_NAMES_BN[salary.month - 1]} {salary.year} | বেসিক: {formatCurrency(salary.basicSalary)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-500">নেট বেতন</p>
              <p className={cn("text-lg font-bold", netSalary >= 0 ? "text-gray-900" : "text-red-600")}>
                {formatCurrency(Math.max(0, netSalary))}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ওভারটাইম (৳)</label>
              <input
                type="number"
                min="0"
                value={overtime}
                onChange={(e) => setOvertime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">বোনাস (৳)</label>
              <input
                type="number"
                min="0"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <span className="text-red-500">−</span> কর্তন (৳)
              </label>
              <input
                type="number"
                min="0"
                value={deduction}
                onChange={(e) => setDeduction(e.target.value)}
                className="w-full px-3 py-2 border border-red-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <span className="text-orange-500">−</span> অগ্রিম (৳)
              </label>
              <input
                type="number"
                min="0"
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
                className="w-full px-3 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                placeholder="0"
              />
            </div>
          </div>

          {/* Calculation summary */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>বেসিক বেতন</span><span className="font-medium">{formatCurrency(salary.basicSalary)}</span>
            </div>
            {ovt > 0 && <div className="flex justify-between text-green-600"><span>+ ওভারটাইম</span><span>+{formatCurrency(ovt)}</span></div>}
            {bon > 0 && <div className="flex justify-between text-green-600"><span>+ বোনাস</span><span>+{formatCurrency(bon)}</span></div>}
            {ded > 0 && <div className="flex justify-between text-red-500"><span>− কর্তন</span><span>−{formatCurrency(ded)}</span></div>}
            {adv > 0 && <div className="flex justify-between text-orange-500"><span>− অগ্রিম</span><span>−{formatCurrency(adv)}</span></div>}
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1">
              <span>নেট বেতন</span><span>{formatCurrency(Math.max(0, netSalary))}</span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">মন্তব্য (ঐচ্ছিক)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="যেমন: অতিরিক্ত কাজের বোনাস"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              বাতিল
            </button>
            <button
              onClick={() => onSave(salary.id, { overtime: ovt, bonus: bon, deduction: ded, advance: adv, note })}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
