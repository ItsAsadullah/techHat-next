'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Search, Plus, Trash2, Edit3, UserPlus, RefreshCw, BarChart3, Receipt, Users, Tag, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { ExpenseCategory, Expense, StaffMember, StaffSalary, ExpenseStats, Tab } from '@/components/admin/expenses/types';
import { DEFAULT_CATEGORIES } from '@/components/admin/expenses/constants';

// Tabs
import { OverviewTab } from '@/components/admin/expenses/overview-tab';
import { ExpensesTab } from '@/components/admin/expenses/expenses-tab';
import { SalaryTab } from '@/components/admin/expenses/salary-tab';
import { CategoriesTab } from '@/components/admin/expenses/categories-tab';
import { ReportsTab } from '@/components/admin/expenses/reports-tab';

// Modals
import { 
  ExpenseFormModal, CategoryFormModal, StaffFormModal, PaySalaryModal, EditSalaryModal 
} from '@/components/admin/expenses/modals';

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
    { id: 'overview', label: 'সারসংক্ষেপ', icon: BarChart3 as any },
    { id: 'expenses', label: 'খরচ সমূহ', icon: Receipt as any },
    { id: 'salary', label: 'স্টাফ বেতন', icon: Users as any },
    { id: 'categories', label: 'ক্যাটাগরি', icon: Tag as any },
    { id: 'reports', label: 'রিপোর্ট', icon: FileText as any },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
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
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
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
              onGoToSalary={(month: number, year: number) => {
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
              onPageChange={(p: number) => fetchExpenses(p)}
              onDelete={handleDeleteExpense}
              onEdit={(expense: Expense) => { setEditingExpense(expense); setShowAddExpense(true); }}
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
              onPaySalary={(s: StaffSalary) => setShowPaySalary(s)}
              onEditSalary={(s: StaffSalary) => setShowEditSalary(s)}
              onDeleteSalary={(s: StaffSalary) => setShowDeleteSalary(s)}
              onEditStaff={(s: StaffMember) => { setEditingStaff(s); setShowAddStaff(true); }}
              onDeleteStaff={handleDeleteStaff}
              actionLoading={actionLoading}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesTab
              categories={categories}
              onEdit={(c: ExpenseCategory) => { setEditingCategory(c); setShowAddCategory(true); }}
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowDeleteSalary(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
              onClick={(e: any) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">বেতন রেকর্ড মুছুন</h3>
                  <p className="text-sm text-gray-500">{showDeleteSalary.staff?.name}</p>
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
