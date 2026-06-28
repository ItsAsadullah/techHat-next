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
import { 
    ExpenseCategory, Expense, StaffMember, StaffSalary, SalaryDueItem, ExpenseStats, Tab 
} from './types';
import { 
    PAYMENT_METHODS, MONTH_NAMES_BN, MONTH_NAMES, DEFAULT_CATEGORIES, 
    formatCurrency, formatDate, getPaymentMethodLabel, getPaymentMethodIcon 
} from './constants';

export function ReportsTab() {
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
