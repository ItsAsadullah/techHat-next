'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3, TrendingUp, ShoppingCart, Wallet, Package,
  Users, Store, CreditCard, FileText, Printer, Download,
  FileSpreadsheet, RefreshCw, Calendar, ArrowUpRight,
  ArrowDownRight, ChevronDown, AlertCircle,
} from 'lucide-react';
import {
  getReportSummary,
  getSalesReport,
  getProductReport,
  getStockReport,
  getExpenseReport,
  getCustomerDueReport,
  getVendorDueReport,
  getProfitLossReport,
  getPaymentReport,
} from '@/lib/actions/report-actions';
import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type ReportTab =
  | 'sales' | 'product' | 'stock' | 'expense'
  | 'customer-due' | 'vendor-due' | 'profit-loss' | 'payment';

type CompanyInfo = { name: string; address: string; phone: string; logo: string };

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  '৳' + n.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });

const fmtDateTime = () =>
  new Date().toLocaleString('en-BD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// Print helper — opens a new window with letterhead + table
// ─────────────────────────────────────────────────────────────
function printReport(
  company: CompanyInfo,
  title: string,
  dateLabel: string,
  headerRow: string[],
  dataRows: string[][],
  footerRows?: string[][],
) {
  const logoHtml = company.logo
    ? `<img src="${company.logo}" style="height:48px;object-fit:contain;" />`
    : `<span style="font-size:22px;font-weight:700;">${company.name}</span>`;

  const thead = headerRow.map((h) => `<th>${h}</th>`).join('');
  const tbody = dataRows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('');
  const tfoot = footerRows
    ? footerRows.map((r) => `<tr class="footer-row">${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { margin: 18mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #111; background: #fff; }
  .letterhead { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 10px; margin-bottom: 14px; }
  .letterhead-left { display: flex; align-items: center; gap: 12px; }
  .company-info { line-height: 1.5; }
  .company-name { font-size: 18px; font-weight: 700; }
  .company-sub { font-size: 10px; color: #555; }
  .report-meta { text-align: right; }
  .report-title { font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .report-date { font-size: 10px; color: #555; margin-top: 3px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #111; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.4px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e5e5; font-size: 11px; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .footer-row td { background: #f0f0f0 !important; font-weight: 700; border-top: 2px solid #111; border-bottom: none; }
  .print-footer { margin-top: 18px; display: flex; justify-content: space-between; font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 6px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="letterhead">
  <div class="letterhead-left">
    ${logoHtml}
    <div class="company-info">
      <div class="company-name">${company.name}</div>
      ${company.address ? `<div class="company-sub">${company.address}</div>` : ''}
      ${company.phone ? `<div class="company-sub">Tel: ${company.phone}</div>` : ''}
    </div>
  </div>
  <div class="report-meta">
    <div class="report-title">${title}</div>
    <div class="report-date">${dateLabel}</div>
  </div>
</div>
<table>
  <thead><tr>${thead}</tr></thead>
  <tbody>${tbody}</tbody>
  ${tfoot ? `<tfoot>${tfoot}</tfoot>` : ''}
</table>
<div class="print-footer">
  <span>Printed on: ${fmtDateTime()}</span>
  <span>${company.name} — Confidential</span>
</div>
<script>window.onload=()=>{ window.print(); };</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (w) { w.document.write(html); w.document.close(); }
}

// ─────────────────────────────────────────────────────────────
// Summary Card
// ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string; icon: any; color: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-green-100 text-green-700',
    PARTIAL: 'bg-yellow-100 text-yellow-700',
    DUE: 'bg-red-100 text-red-700',
    PENDING: 'bg-orange-100 text-orange-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Report toolbar
// ─────────────────────────────────────────────────────────────
function ReportToolbar({ onPrint, onCSV, loading }: {
  onPrint: () => void; onCSV: () => void; loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrint}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition"
      >
        <Printer className="w-3.5 h-3.5" />Print / PDF
      </button>
      <button
        onClick={onCSV}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />Excel (CSV)
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<CompanyInfo>({ name: 'TechHat', address: '', phone: '', logo: '' });

  // Data states
  const [summary, setSummary] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [stockData, setStockData] = useState<any>(null);
  const [expenseData, setExpenseData] = useState<any>(null);
  const [customerDueData, setCustomerDueData] = useState<any>(null);
  const [vendorDueData, setVendorDueData] = useState<any>(null);
  const [plData, setPlData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Load company info once
  useEffect(() => {
    getInvoiceSettings().then((s) => {
      setCompany({
        name: s.invoiceCompanyName || 'TechHat',
        address: s.invoiceCompanyAddress || '',
        phone: s.invoiceCompanyPhone || '',
        logo: s.invoiceLogo || '',
      });
    });
    loadSummary();
  }, []);

  // Load tab data when tab or date changes
  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, fromDate, toDate]);

  async function loadSummary() {
    const s = await getReportSummary();
    setSummary(s);
  }

  async function loadTabData(tab: ReportTab) {
    setLoading(true);
    try {
      switch (tab) {
        case 'sales':        setSalesData(await getSalesReport(fromDate || undefined, toDate || undefined)); break;
        case 'product':      setProductData(await getProductReport()); break;
        case 'stock':        setStockData(await getStockReport(fromDate || undefined, toDate || undefined)); break;
        case 'expense':      setExpenseData(await getExpenseReport(fromDate || undefined, toDate || undefined)); break;
        case 'customer-due': setCustomerDueData(await getCustomerDueReport()); break;
        case 'vendor-due':   setVendorDueData(await getVendorDueReport()); break;
        case 'profit-loss':  setPlData(await getProfitLossReport(fromDate || undefined, toDate || undefined)); break;
        case 'payment':      setPaymentData(await getPaymentReport(fromDate || undefined, toDate || undefined)); break;
      }
    } finally {
      setLoading(false);
    }
  }

  const dateLabel = fromDate && toDate
    ? `${fmtDate(fromDate)} — ${fmtDate(toDate)}`
    : fromDate ? `From ${fmtDate(fromDate)}`
    : toDate ? `Until ${fmtDate(toDate)}`
    : 'All Time';

  // ── Tabs config ──────────────────────────────────────────────
  const tabs: { id: ReportTab; label: string; icon: any }[] = [
    { id: 'sales',        label: 'Sales',          icon: ShoppingCart },
    { id: 'product',      label: 'Products',        icon: Package },
    { id: 'stock',        label: 'Stock',           icon: BarChart3 },
    { id: 'expense',      label: 'Expenses',        icon: Wallet },
    { id: 'customer-due', label: 'Customer Due',    icon: Users },
    { id: 'vendor-due',   label: 'Vendor Due',      icon: Store },
    { id: 'profit-loss',  label: 'Profit & Loss',   icon: TrendingUp },
    { id: 'payment',      label: 'Payments',        icon: CreditCard },
  ];

  // ── Print functions ──────────────────────────────────────────
  function printSales() {
    if (!salesData) return;
    printReport(
      company,
      'Sales Report',
      dateLabel,
      ['Date', 'Invoice #', 'Customer', 'Total', 'Paid', 'Due', 'Status'],
      salesData.rows.map((o: any) => [
        fmtDate(o.createdAt),
        o.orderNumber,
        o.posCustomer?.name ?? o.customerName ?? 'Walk-in',
        fmt(o.grandTotal ?? 0),
        fmt(o.paidAmount ?? 0),
        fmt(o.dueAmount ?? 0),
        (o.posPaymentStatus ?? o.paymentStatus ?? o.status).toUpperCase(),
      ]),
      [['', '', 'TOTAL', fmt(salesData.totals.grandTotal), fmt(salesData.totals.paidAmount), fmt(salesData.totals.dueAmount), '']],
    );
  }

  function printProducts() {
    if (!productData) return;
    printReport(
      company,
      'Product Report',
      'All Products',
      ['Product', 'SKU', 'Category', 'Brand', 'Cost Price', 'Sell Price', 'Stock', 'Stock Value'],
      productData.rows.map((p: any) => [
        p.name, p.sku ?? '-', p.categoryName, p.brandName,
        fmt(p.costPrice), fmt(p.price), p.stock.toString(), fmt(p.stockValue),
      ]),
      [['', '', '', '', '', 'TOTAL STOCK', productData.totals.stock.toString(), fmt(productData.totals.stockValue)]],
    );
  }

  function printStock() {
    if (!stockData) return;
    printReport(
      company,
      'Stock Report',
      dateLabel,
      ['Product', 'SKU', 'Category', 'Opening', 'Purchased', 'Sold', 'Adjusted', 'Closing'],
      stockData.rows.map((r: any) => [
        r.name, r.sku, r.categoryName,
        r.opening.toString(), r.purchased.toString(), r.sold.toString(),
        r.adjusted.toString(), r.closing.toString(),
      ]),
    );
  }

  function printExpenses() {
    if (!expenseData) return;
    printReport(
      company,
      'Expense Report',
      dateLabel,
      ['Date', 'Title', 'Category', 'Payment Method', 'Paid To', 'Amount'],
      expenseData.rows.map((e: any) => [
        fmtDate(e.date), e.title, e.categoryName,
        e.paymentMethod, e.paidTo ?? '-', fmt(e.amount),
      ]),
      [['', '', '', '', 'TOTAL', fmt(expenseData.total)]],
    );
  }

  function printCustomerDue() {
    if (!customerDueData) return;
    printReport(
      company,
      'Customer Due Report',
      'All Time',
      ['Customer', 'Phone', 'Total Purchase', 'Total Paid', 'Due'],
      customerDueData.rows.map((c: any) => [
        c.name, c.phone, fmt(c.totalPurchase), fmt(c.totalPaid), fmt(c.totalDue),
      ]),
      [['TOTAL', '', fmt(customerDueData.totals.totalPurchase), fmt(customerDueData.totals.totalPaid), fmt(customerDueData.totals.totalDue)]],
    );
  }

  function printVendorDue() {
    if (!vendorDueData) return;
    printReport(
      company,
      'Vendor Due Report',
      'All Time',
      ['Vendor', 'Phone', 'Total Purchase', 'Total Paid', 'Due'],
      vendorDueData.rows.map((v: any) => [
        v.name, v.phone, fmt(v.totalPurchase), fmt(v.totalPaid), fmt(v.due),
      ]),
      [['TOTAL', '', fmt(vendorDueData.totals.totalPurchase), fmt(vendorDueData.totals.totalPaid), fmt(vendorDueData.totals.due)]],
    );
  }

  function printPL() {
    if (!plData) return;
    const rows = [
      ['Total Sales', '', fmt(plData.totalSales)],
      ['(-) Returns/Refunds', '', fmt(plData.totalReturns)],
      ['Net Sales', '', fmt(plData.netSales)],
      ['(-) Product Cost (COGS)', '', fmt(plData.productCost)],
      ['Gross Profit', '', fmt(plData.grossProfit)],
      ['', '', ''],
      ['Operating Expenses', '', ''],
      ...plData.expenseBreakdown.map((e: any) => [`  ${e.name}`, '', fmt(e.amount)]),
      ['Total Expenses', '', fmt(plData.totalExpenses)],
      ['', '', ''],
      ['Net Profit / (Loss)', '', fmt(plData.netProfit)],
    ];
    printReport(
      company,
      'Profit & Loss Statement',
      dateLabel,
      ['Description', '', 'Amount'],
      rows,
    );
  }

  function printPayments() {
    if (!paymentData) return;
    printReport(
      company,
      'Payment Report',
      dateLabel,
      ['Date', 'Invoice #', 'Customer', 'Method', 'Provider', 'Amount'],
      paymentData.rows.map((p: any) => [
        fmtDate(p.createdAt), p.orderNumber, p.customerName,
        p.method, p.provider ?? '-', fmt(p.amount),
      ]),
      [['', '', '', '', 'TOTAL', fmt(paymentData.total)]],
    );
  }

  // ── CSV functions ──────────────────────────────────────────
  function csvSales() {
    if (!salesData) return;
    downloadCSV('sales-report.csv',
      ['Date', 'Invoice', 'Customer', 'Total', 'Paid', 'Due', 'Status'],
      salesData.rows.map((o: any) => [
        fmtDate(o.createdAt), o.orderNumber,
        o.posCustomer?.name ?? o.customerName ?? 'Walk-in',
        (o.grandTotal ?? 0).toFixed(2), (o.paidAmount ?? 0).toFixed(2),
        (o.dueAmount ?? 0).toFixed(2),
        (o.posPaymentStatus ?? o.paymentStatus ?? o.status).toUpperCase(),
      ]),
    );
  }

  function csvProducts() {
    if (!productData) return;
    downloadCSV('product-report.csv',
      ['Product', 'SKU', 'Category', 'Brand', 'Cost Price', 'Sell Price', 'Stock', 'Stock Value'],
      productData.rows.map((p: any) => [
        p.name, p.sku ?? '', p.categoryName, p.brandName,
        p.costPrice.toFixed(2), p.price.toFixed(2),
        p.stock.toString(), p.stockValue.toFixed(2),
      ]),
    );
  }

  function csvStock() {
    if (!stockData) return;
    downloadCSV('stock-report.csv',
      ['Product', 'SKU', 'Category', 'Opening', 'Purchased', 'Sold', 'Adjusted', 'Closing'],
      stockData.rows.map((r: any) => [
        r.name, r.sku, r.categoryName,
        r.opening, r.purchased, r.sold, r.adjusted, r.closing,
      ]),
    );
  }

  function csvExpenses() {
    if (!expenseData) return;
    downloadCSV('expense-report.csv',
      ['Date', 'Title', 'Category', 'Payment Method', 'Paid To', 'Amount'],
      expenseData.rows.map((e: any) => [
        fmtDate(e.date), e.title, e.categoryName,
        e.paymentMethod, e.paidTo ?? '', e.amount.toFixed(2),
      ]),
    );
  }

  function csvCustomerDue() {
    if (!customerDueData) return;
    downloadCSV('customer-due-report.csv',
      ['Customer', 'Phone', 'Total Purchase', 'Total Paid', 'Due'],
      customerDueData.rows.map((c: any) => [
        c.name, c.phone, c.totalPurchase.toFixed(2), c.totalPaid.toFixed(2), c.totalDue.toFixed(2),
      ]),
    );
  }

  function csvVendorDue() {
    if (!vendorDueData) return;
    downloadCSV('vendor-due-report.csv',
      ['Vendor', 'Phone', 'Total Purchase', 'Total Paid', 'Due'],
      vendorDueData.rows.map((v: any) => [
        v.name, v.phone, v.totalPurchase.toFixed(2), v.totalPaid.toFixed(2), v.due.toFixed(2),
      ]),
    );
  }

  function csvPL() {
    if (!plData) return;
    downloadCSV('profit-loss-report.csv',
      ['Description', 'Amount'],
      [
        ['Total Sales', plData.totalSales.toFixed(2)],
        ['Returns', plData.totalReturns.toFixed(2)],
        ['Net Sales', plData.netSales.toFixed(2)],
        ['Product Cost', plData.productCost.toFixed(2)],
        ['Gross Profit', plData.grossProfit.toFixed(2)],
        ['Total Expenses', plData.totalExpenses.toFixed(2)],
        ['Net Profit', plData.netProfit.toFixed(2)],
        ...plData.expenseBreakdown.map((e: any) => [`Expense: ${e.name}`, e.amount.toFixed(2)]),
      ],
    );
  }

  function csvPayments() {
    if (!paymentData) return;
    downloadCSV('payment-report.csv',
      ['Date', 'Invoice', 'Customer', 'Method', 'Provider', 'Amount'],
      paymentData.rows.map((p: any) => [
        fmtDate(p.createdAt), p.orderNumber, p.customerName,
        p.method, p.provider ?? '', p.amount.toFixed(2),
      ]),
    );
  }

  // ─────────────────────────────────────────────────────────
  const printFns: Record<ReportTab, () => void> = {
    sales: printSales, product: printProducts, stock: printStock,
    expense: printExpenses, 'customer-due': printCustomerDue,
    'vendor-due': printVendorDue, 'profit-loss': printPL, payment: printPayments,
  };
  const csvFns: Record<ReportTab, () => void> = {
    sales: csvSales, product: csvProducts, stock: csvStock,
    expense: csvExpenses, 'customer-due': csvCustomerDue,
    'vendor-due': csvVendorDue, 'profit-loss': csvPL, payment: csvPayments,
  };

  // ─────────────────────────────────────────────────────────
  // Table wrapper
  // ─────────────────────────────────────────────────────────
  const TH = ({ children }: { children: React.ReactNode }) => (
    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200 whitespace-nowrap">
      {children}
    </th>
  );
  const TD = ({ children, right, bold, red, green }: { children: React.ReactNode; right?: boolean; bold?: boolean; red?: boolean; green?: boolean }) => (
    <td className={`px-3 py-2.5 text-sm border-b border-gray-100 ${right ? 'text-right font-mono' : ''} ${bold ? 'font-semibold' : ''} ${red ? 'text-red-600' : ''} ${green ? 'text-green-600' : ''}`}>
      {children}
    </td>
  );
  const TotalRow = ({ cells }: { cells: React.ReactNode[] }) => (
    <tr className="bg-gray-50 border-t-2 border-gray-300">
      {cells.map((c, i) => (
        <td key={i} className="px-3 py-2.5 text-sm font-bold border-b border-gray-200 text-right font-mono last:first:text-left">
          {c}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Business Reports</h1>
              <p className="text-xs text-gray-400">All reports, analytics & export</p>
            </div>
          </div>
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(''); setToDate(''); }}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <SummaryCard label="Today's Sales" value={fmt(summary.todaySales)} icon={ShoppingCart} color="bg-blue-600" sub="POS + Online" />
            <SummaryCard label="This Month" value={fmt(summary.monthSales)} icon={TrendingUp} color="bg-indigo-600" />
            <SummaryCard label="Total Expenses" value={fmt(summary.totalExpenses)} icon={Wallet} color="bg-orange-500" />
            <SummaryCard label="Net Profit" value={fmt(summary.netProfit)} icon={BarChart3} color={summary.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-500'} />
            <SummaryCard label="Stock Value" value={fmt(summary.totalStockValue)} icon={Package} color="bg-violet-600" />
            <SummaryCard label="Customer Due" value={fmt(summary.totalCustomerDue)} icon={Users} color="bg-pink-600" />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Tab bar */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">{tabs.find((t) => t.id === activeTab)?.label}</span>
              {' — '}
              <span className="text-xs">{dateLabel}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadTabData(activeTab)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <ReportToolbar
                onPrint={printFns[activeTab]}
                onCSV={csvFns[activeTab]}
                loading={loading}
              />
            </div>
          </div>

          {/* Content area */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* ── SALES ── */}
                {activeTab === 'sales' && salesData && (
                  <table className="w-full">
                    <thead>
                      <tr>
                        <TH>Date</TH><TH>Invoice #</TH><TH>Customer</TH>
                        <TH>Total</TH><TH>Paid</TH><TH>Due</TH><TH>Status</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.rows.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">No records found</td></tr>
                      )}
                      {salesData.rows.map((o: any) => (
                        <tr key={o.id} className="hover:bg-gray-50">
                          <TD>{fmtDate(o.createdAt)}</TD>
                          <TD><span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{o.orderNumber}</span></TD>
                          <TD>{o.posCustomer?.name ?? o.customerName ?? 'Walk-in'}</TD>
                          <TD right bold>{fmt(o.grandTotal ?? 0)}</TD>
                          <TD right green>{fmt(o.paidAmount ?? 0)}</TD>
                          <TD right red={(o.dueAmount ?? 0) > 0}>{fmt(o.dueAmount ?? 0)}</TD>
                          <TD><StatusBadge status={(o.posPaymentStatus ?? o.paymentStatus ?? o.status).toUpperCase()} /></TD>
                        </tr>
                      ))}
                    </tbody>
                    {salesData.rows.length > 0 && (
                      <tfoot>
                        <TotalRow cells={[
                          <span className="text-left font-bold text-gray-700 text-sm">TOTAL ({salesData.rows.length} orders)</span>,
                          '', '',
                          fmt(salesData.totals.grandTotal),
                          <span className="text-green-600">{fmt(salesData.totals.paidAmount)}</span>,
                          <span className="text-red-600">{fmt(salesData.totals.dueAmount)}</span>,
                          '',
                        ]} />
                      </tfoot>
                    )}
                  </table>
                )}

                {/* ── PRODUCTS ── */}
                {activeTab === 'product' && productData && (
                  <table className="w-full">
                    <thead>
                      <tr>
                        <TH>Product</TH><TH>SKU</TH><TH>Category</TH><TH>Brand</TH>
                        <TH>Cost Price</TH><TH>Sell Price</TH><TH>Stock</TH><TH>Stock Value</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {productData.rows.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No records</td></tr>
                      )}
                      {productData.rows.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <TD><span className="font-medium">{p.name}</span></TD>
                          <TD><span className="font-mono text-xs text-gray-500">{p.sku ?? '-'}</span></TD>
                          <TD>{p.categoryName}</TD>
                          <TD>{p.brandName}</TD>
                          <TD right>{fmt(p.costPrice)}</TD>
                          <TD right>{fmt(p.price)}</TD>
                          <TD right bold red={p.stock === 0} >{p.stock}</TD>
                          <TD right bold>{fmt(p.stockValue)}</TD>
                        </tr>
                      ))}
                    </tbody>
                    {productData.rows.length > 0 && (
                      <tfoot>
                        <TotalRow cells={['', '', '', '', '', '', productData.totals.stock.toString(), fmt(productData.totals.stockValue)]} />
                      </tfoot>
                    )}
                  </table>
                )}

                {/* ── STOCK ── */}
                {activeTab === 'stock' && stockData && (
                  <table className="w-full">
                    <thead>
                      <tr>
                        <TH>Product</TH><TH>SKU</TH><TH>Category</TH>
                        <TH>Opening</TH><TH>Purchased</TH><TH>Sold</TH><TH>Adjusted</TH><TH>Closing</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {stockData.rows.length === 0 && (
                        <tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">No records</td></tr>
                      )}
                      {stockData.rows.map((r: any) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <TD><span className="font-medium">{r.name}</span></TD>
                          <TD><span className="font-mono text-xs text-gray-500">{r.sku}</span></TD>
                          <TD>{r.categoryName}</TD>
                          <TD right>{r.opening}</TD>
                          <TD right green>{r.purchased}</TD>
                          <TD right red={r.sold > 0}>{r.sold}</TD>
                          <TD right>{r.adjusted}</TD>
                          <TD right bold>{r.closing}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* ── EXPENSES ── */}
                {activeTab === 'expense' && expenseData && (
                  <table className="w-full">
                    <thead>
                      <tr>
                        <TH>Date</TH><TH>Title</TH><TH>Category</TH>
                        <TH>Method</TH><TH>Paid To</TH><TH>Amount</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseData.rows.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No records</td></tr>
                      )}
                      {expenseData.rows.map((e: any) => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <TD>{fmtDate(e.date)}</TD>
                          <TD><span className="font-medium">{e.title}</span></TD>
                          <TD>{e.categoryName}</TD>
                          <TD><span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{e.paymentMethod}</span></TD>
                          <TD>{e.paidTo ?? '-'}</TD>
                          <TD right bold>{fmt(e.amount)}</TD>
                        </tr>
                      ))}
                    </tbody>
                    {expenseData.rows.length > 0 && (
                      <tfoot>
                        <TotalRow cells={['', '', '', '', 'TOTAL', fmt(expenseData.total)]} />
                      </tfoot>
                    )}
                  </table>
                )}

                {/* ── CUSTOMER DUE ── */}
                {activeTab === 'customer-due' && customerDueData && (
                  <table className="w-full">
                    <thead>
                      <tr>
                        <TH>#</TH><TH>Customer</TH><TH>Phone</TH>
                        <TH>Total Purchase</TH><TH>Total Paid</TH><TH>Due</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDueData.rows.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No customer dues</td></tr>
                      )}
                      {customerDueData.rows.map((c: any, i: number) => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <TD><span className="text-gray-400 text-xs">{i + 1}</span></TD>
                          <TD><span className="font-medium">{c.name}</span></TD>
                          <TD><span className="font-mono text-xs">{c.phone}</span></TD>
                          <TD right>{fmt(c.totalPurchase)}</TD>
                          <TD right green>{fmt(c.totalPaid)}</TD>
                          <TD right bold red>{fmt(c.totalDue)}</TD>
                        </tr>
                      ))}
                    </tbody>
                    {customerDueData.rows.length > 0 && (
                      <tfoot>
                        <TotalRow cells={['', 'TOTAL', '', fmt(customerDueData.totals.totalPurchase), fmt(customerDueData.totals.totalPaid), fmt(customerDueData.totals.totalDue)]} />
                      </tfoot>
                    )}
                  </table>
                )}

                {/* ── VENDOR DUE ── */}
                {activeTab === 'vendor-due' && vendorDueData && (
                  <table className="w-full">
                    <thead>
                      <tr>
                        <TH>#</TH><TH>Vendor / Supplier</TH><TH>Phone</TH>
                        <TH>Total Purchase</TH><TH>Total Paid</TH><TH>Due</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorDueData.rows.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No vendor dues</td></tr>
                      )}
                      {vendorDueData.rows.map((v: any, i: number) => (
                        <tr key={v.id} className="hover:bg-gray-50">
                          <TD><span className="text-gray-400 text-xs">{i + 1}</span></TD>
                          <TD><span className="font-medium">{v.name}</span></TD>
                          <TD><span className="font-mono text-xs">{v.phone}</span></TD>
                          <TD right>{fmt(v.totalPurchase)}</TD>
                          <TD right green>{fmt(v.totalPaid)}</TD>
                          <TD right bold red={v.due > 0}>{fmt(v.due)}</TD>
                        </tr>
                      ))}
                    </tbody>
                    {vendorDueData.rows.length > 0 && (
                      <tfoot>
                        <TotalRow cells={['', 'TOTAL', '', fmt(vendorDueData.totals.totalPurchase), fmt(vendorDueData.totals.totalPaid), fmt(vendorDueData.totals.due)]} />
                      </tfoot>
                    )}
                  </table>
                )}

                {/* ── PROFIT & LOSS ── */}
                {activeTab === 'profit-loss' && plData && (
                  <div className="p-6">
                    <div className="max-w-2xl mx-auto space-y-0 border border-gray-200 rounded-xl overflow-hidden">
                      {/* Revenue section */}
                      <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                        Revenue
                      </div>
                      {[
                        { label: 'Total Sales', value: plData.totalSales, bold: false },
                        { label: '(-) Returns / Refunds', value: plData.totalReturns, isNeg: true },
                        { label: 'Net Sales', value: plData.netSales, bold: true, border: true },
                        { label: '(-) Product Cost (COGS)', value: plData.productCost, isNeg: true },
                      ].map((row, i) => (
                        <div key={i} className={`flex justify-between items-center px-6 py-3 ${row.border ? 'border-t border-gray-300 bg-blue-50' : ''} border-b border-gray-100`}>
                          <span className={`text-sm ${row.bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{row.label}</span>
                          <span className={`font-mono text-sm ${row.bold ? 'font-bold' : ''} ${row.isNeg ? 'text-red-600' : 'text-gray-900'}`}>
                            {row.isNeg ? `(${fmt(row.value)})` : fmt(row.value)}
                          </span>
                        </div>
                      ))}
                      {/* Gross Profit */}
                      <div className="flex justify-between items-center px-6 py-3 bg-emerald-50 border-b-2 border-emerald-300">
                        <span className="text-sm font-bold text-emerald-800">Gross Profit</span>
                        <span className={`font-mono font-bold text-sm ${plData.grossProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{fmt(plData.grossProfit)}</span>
                      </div>

                      {/* Expenses section */}
                      <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                        Operating Expenses
                      </div>
                      {plData.expenseBreakdown.map((e: any, i: number) => (
                        <div key={i} className="flex justify-between items-center px-6 py-2.5 border-b border-gray-100">
                          <span className="text-sm text-gray-600 pl-4">↳ {e.name}</span>
                          <span className="font-mono text-sm text-red-600">({fmt(e.amount)})</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center px-6 py-3 border-b-2 border-gray-300 bg-red-50">
                        <span className="text-sm font-bold text-red-800">Total Expenses</span>
                        <span className="font-mono font-bold text-sm text-red-700">({fmt(plData.totalExpenses)})</span>
                      </div>

                      {/* Net Profit */}
                      <div className={`flex justify-between items-center px-6 py-4 ${plData.netProfit >= 0 ? 'bg-emerald-600' : 'bg-red-600'}`}>
                        <span className="text-base font-bold text-white">NET PROFIT / (LOSS)</span>
                        <span className="font-mono font-bold text-lg text-white">{fmt(plData.netProfit)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PAYMENTS ── */}
                {activeTab === 'payment' && paymentData && (
                  <>
                    {/* Method summary */}
                    {Object.keys(paymentData.byMethod).length > 0 && (
                      <div className="flex gap-3 p-4 border-b border-gray-100 flex-wrap">
                        {Object.entries(paymentData.byMethod).map(([method, amount]: [string, any]) => (
                          <div key={method} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <span className="text-xs text-gray-500 font-medium">{method}</span>
                            <span className="text-sm font-bold text-gray-900 font-mono">{fmt(amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <table className="w-full">
                      <thead>
                        <tr>
                          <TH>Date</TH><TH>Invoice #</TH><TH>Customer</TH>
                          <TH>Method</TH><TH>Provider</TH><TH>Amount</TH>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentData.rows.length === 0 && (
                          <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No records</td></tr>
                        )}
                        {paymentData.rows.map((p: any) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <TD>{fmtDate(p.createdAt)}</TD>
                            <TD><span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.orderNumber}</span></TD>
                            <TD>{p.customerName}</TD>
                            <TD><StatusBadge status={p.method} /></TD>
                            <TD>{p.provider ?? '-'}</TD>
                            <TD right bold>{fmt(p.amount)}</TD>
                          </tr>
                        ))}
                      </tbody>
                      {paymentData.rows.length > 0 && (
                        <tfoot>
                          <TotalRow cells={['', '', '', '', 'TOTAL', fmt(paymentData.total)]} />
                        </tfoot>
                      )}
                    </table>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
