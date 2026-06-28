'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, DollarSign, Activity, Wallet, FileText, CreditCard, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

interface FinanceDashboardClientProps {
  dashboardData: any;
  trendData: any[];
  expenseData: any[];
  recentTransactions: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function FinanceDashboardClient({
  dashboardData,
  trendData,
  expenseData,
  recentTransactions
}: FinanceDashboardClientProps) {
  
  if (!dashboardData) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg border border-red-200">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <h3 className="font-bold">Error loading dashboard data</h3>
        <p>Please check your database connection or try again later.</p>
      </div>
    );
  }

  const fmt = (val: number) => `৳${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const profitMargin = dashboardData.totalRevenue > 0 
    ? (dashboardData.netProfit / dashboardData.totalRevenue) * 100 
    : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finance Dashboard (ফাইন্যান্স ড্যাশবোর্ড)</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time overview of your financial health (আর্থিক অবস্থার রিয়েল-টাইম ওভারভিউ)</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-100 shadow-sm bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600/80 mb-1">Revenue (এই মাসের আয়)</p>
                <h3 className="text-2xl font-bold text-slate-900">{fmt(dashboardData.totalRevenue)}</h3>
              </div>
              <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100 shadow-sm bg-orange-50/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-600/80 mb-1">Expenses (এই মাসের ব্যয়)</p>
                <h3 className="text-2xl font-bold text-slate-900">{fmt(dashboardData.totalExpenses)}</h3>
              </div>
              <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 shadow-sm bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-green-600/80 mb-1">Net Profit (নিট লাভ)</p>
                <h3 className="text-2xl font-bold text-slate-900">{fmt(dashboardData.netProfit)}</h3>
              </div>
              <div className="h-10 w-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-green-700">
              <span className="bg-green-100 px-2 py-0.5 rounded-full">{profitMargin.toFixed(1)}% Margin</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100 shadow-sm bg-purple-50/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-600/80 mb-1">Cash In Hand (নগদ ও ব্যাংক)</p>
                <h3 className="text-2xl font-bold text-slate-900">{fmt(dashboardData.cashInHand)}</h3>
              </div>
              <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-full"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">Market Due (বকেয়া পাওনা)</p>
              <p className="text-lg font-bold text-slate-900">{fmt(dashboardData.accountsReceivable)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-slate-100 text-slate-600 rounded-full"><FileText className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">Payable (দেনা/পাওনাদার)</p>
              <p className="text-lg font-bold text-slate-900">{fmt(dashboardData.accountsPayable)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><CreditCard className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase">Liabilities (বিনিয়োগকারীর দায়)</p>
              <p className="text-lg font-bold text-slate-900">{fmt(dashboardData.investorLiability)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue vs Expense Trend */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Revenue & Expense Trend (আয়-ব্যয়ের গ্রাফ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `৳${val/1000}k`} />
                  <RechartsTooltip 
                    formatter={(value: any) => [`৳${(value || 0).toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Area type="monotone" name="Revenue" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" name="Expense" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-5 w-5 text-slate-500" />
              Expense Breakdown (খরচের খাতসমূহ)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseData.length > 0 ? (
              <div className="h-[300px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => `৳${(value || 0).toLocaleString()}`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="w-full mt-4 space-y-2 max-h-[120px] overflow-y-auto scrollbar-hide px-2">
                  {expenseData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-slate-600 truncate max-w-[120px]">{entry.name}</span>
                      </div>
                      <span className="font-semibold text-slate-900">{fmt(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
                No expense data this month
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Recent Ledger Transactions */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Recent Ledger Transactions (সাম্প্রতিক লেনদেন)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-3 px-4 text-left font-semibold text-slate-500">Date & Time (তারিখ)</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-500">Source (উৎস)</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-500">Journal Entry (জার্নাল)</th>
                  <th className="py-3 px-4 text-right font-semibold text-slate-500">Amount (পরিমাণ)</th>
                  <th className="py-3 px-4 text-left font-semibold text-slate-500 pl-8">Accounts Affected (একাউন্টসমূহ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx: any) => {
                  const debitItems = tx.journalEntry?.items?.filter((i:any) => i.debit > 0) || [];
                  const creditItems = tx.journalEntry?.items?.filter((i:any) => i.credit > 0) || [];
                  const amount = debitItems.reduce((sum: number, i: any) => sum + i.debit, 0) || creditItems.reduce((sum: number, i: any) => sum + i.credit, 0);
                  
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500">{format(new Date(tx.createdAt), 'MMM d, h:mm a')}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 font-medium">
                          {tx.source.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-blue-600">{tx.journalEntry?.entryNumber || '-'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">{fmt(amount)}</td>
                      <td className="py-3 px-4 pl-8">
                        <div className="flex flex-col text-xs space-y-1">
                          {debitItems.map((i: any, idx: number) => (
                            <span key={idx} className="text-green-700">Dr. {i.chartOfAccount?.name} ({fmt(i.debit)})</span>
                          ))}
                          {creditItems.map((i: any, idx: number) => (
                            <span key={idx} className="text-red-700">Cr. {i.chartOfAccount?.name} ({fmt(i.credit)})</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">No transactions recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
