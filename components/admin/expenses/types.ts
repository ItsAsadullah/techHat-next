export interface ExpenseCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  _count: { expenses: number };
}

export interface Expense {
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

export interface StaffMember {
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

export interface StaffSalary {
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

export interface SalaryDueItem {
  id: string;
  staffName: string;
  month: number;
  year: number;
  netSalary: number;
  paidAmount: number;
  dueAmount: number;
  status: string;
}

export interface ExpenseStats {
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



export type Tab = 'overview' | 'expenses' | 'salary' | 'categories' | 'reports';