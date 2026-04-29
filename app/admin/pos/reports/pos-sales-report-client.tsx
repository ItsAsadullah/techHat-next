'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Printer, TrendingUp, ShoppingCart, AlertCircle, CheckCircle2,
  DollarSign, Calendar, Filter, ArrowLeft, Download, FileText
} from 'lucide-react';
import { getPOSSalesReport } from '@/lib/actions/pos-customer-actions';
import type { InvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { toast } from 'sonner';

type POSStatus = 'PAID' | 'PARTIAL' | 'DUE';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  grandTotal: number;
  paidAmount: number | null;
  dueAmount: number | null;
  posPaymentStatus: POSStatus | null;
  paymentMethod: string;
  createdAt: Date;
  items: { productName: string; quantity: number }[];
  guarantor: { name: string; phone: string } | null;
  posCustomer: { id: string; name: string } | null;
}

interface SalesSummary {
  totalSales: number;
  totalPaid: number;
  totalDue: number;
  totalDiscount: number;
  totalOrders: number;
}

interface Props {
  initialData: { orders: Order[]; summary: SalesSummary };
  dailySummary: { totalSales: number; totalOrders: number; totalItems: number };
  invoiceSettings: InvoiceSettings;
}

const statusBadge = (status: POSStatus | null) => {
  if (status === 'PAID') return <Badge className="bg-green-100 text-green-700 border-0">PAID</Badge>;
  if (status === 'PARTIAL') return <Badge className="bg-yellow-100 text-yellow-700 border-0">PARTIAL</Badge>;
  if (status === 'DUE') return <Badge className="bg-red-100 text-red-700 border-0">DUE</Badge>;
  return <Badge className="bg-green-100 text-green-700 border-0">PAID</Badge>;
};

const todayStr = () => new Date().toISOString().split('T')[0];
const yesterdayStr = () => {
  const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0];
};
const weekStartStr = () => {
  const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0];
};

export function POSSalesReport({ initialData, dailySummary, invoiceSettings }: Props) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialData.orders);
  const [summary, setSummary] = useState<SalesSummary>(initialData.summary);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleDownloadCSV = () => {
    const rows = [
      [
        'Invoice #', 'Date', 'Time',
        'Customer Name', 'Customer Phone',
        'Guarantor Name', 'Guarantor Phone', 'Guarantor Relation',
        'Items (Name × Qty @ Unit Price = Total)',
        'Sub Total', 'Discount', 'Tax', 'Grand Total',
        'Paid', 'Due', 'Status', 'Payment Method',
        'Cash Payment', 'Card Payment', 'Mobile Payment',
      ],
      ...orders.map((o) => {
        const dateObj = new Date(o.createdAt);
        const oo = o as any;
        return [
          o.orderNumber,
          dateObj.toLocaleDateString('en-US', { dateStyle: 'medium' }),
          dateObj.toLocaleTimeString('en-US', { timeStyle: 'short' }),
          o.customerName || 'Guest',
          o.customerPhone || '',
          o.guarantor?.name || '',
          o.guarantor?.phone || '',
          (o.guarantor as any)?.relation || '',
          o.items.map((i: any) => `${i.productName} ×${i.quantity} @ ৳${i.unitPrice} = ৳${i.total}`).join(' | '),
          oo.totalAmount ?? o.grandTotal,
          oo.discount ?? 0,
          oo.tax ?? 0,
          o.grandTotal,
          o.paidAmount ?? o.grandTotal,
          o.dueAmount ?? 0,
          o.posPaymentStatus || 'PAID',
          o.paymentMethod,
          oo.cashPayment ?? '',
          oo.cardPayment ?? '',
          oo.mobilePayment ?? '',
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    const companyName = invoiceSettings?.invoiceCompanyName || 'TechHat';
    const companyPhone = invoiceSettings?.invoiceCompanyPhone || '';
    const companyAddress = invoiceSettings?.invoiceCompanyAddress || '';
    const companyEmail = (invoiceSettings as any)?.invoiceCompanyEmail || '';
    const logoUrl = `${window.location.origin}/images/Logo.png`;
    const now = new Date();
    const nowStrEn = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    // Group orders by date
    const groupedByDate: Record<string, Order[]> = {};
    [...orders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).forEach((o) => {
      const dk = new Date(o.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groupedByDate[dk]) groupedByDate[dk] = [];
      groupedByDate[dk].push(o);
    });

    let runningBalance = 0;
    let slNo = 0;
    const statementRows = Object.entries(groupedByDate).map(([dateKey, dayOrders]) => {
      const dayTotal = dayOrders.reduce((s, o) => s + o.grandTotal, 0);
      const dayPaid = dayOrders.reduce((s, o) => s + (o.paidAmount ?? o.grandTotal), 0);
      const dayDue = dayOrders.reduce((s, o) => s + (o.dueAmount ?? 0), 0);

      const txnRows = dayOrders.map((o) => {
        const oo = o as any;
        slNo++;
        const paid = o.paidAmount ?? o.grandTotal;
        const due = o.dueAmount ?? 0;
        const disc = oo.discount ?? 0;
        const timeStr = new Date(o.createdAt).toLocaleTimeString('en-US', { timeStyle: 'short' });
        const status = o.posPaymentStatus || 'PAID';
        runningBalance += o.grandTotal;

        const itemText = o.items.map((it: any) =>
          `${it.productName} ×${it.quantity}${it.unitPrice ? ` @৳${Number(it.unitPrice).toLocaleString()}` : ''}`
        ).join(', ');

        const discNote = disc > 0 ? ` [ছাড়: -৳${disc.toLocaleString()}]` : '';

        const pmLabel = o.paymentMethod === 'MOBILE_BANKING' ? 'MFS' : o.paymentMethod === 'CASH' ? 'Cash' : o.paymentMethod === 'CARD' ? 'Card' : 'Mix';
        const mixedParts = [
          oo.cashPayment ? `C:৳${Number(oo.cashPayment).toLocaleString()}` : '',
          oo.cardPayment ? `K:৳${Number(oo.cardPayment).toLocaleString()}` : '',
          oo.mobilePayment ? `M:৳${Number(oo.mobilePayment).toLocaleString()}` : '',
        ].filter(Boolean).join(' ');

        const custLine = `${o.customerName || 'Guest'}${o.customerPhone ? ` · ${o.customerPhone}` : ''}`;
        const guarLine = o.guarantor ? `জামিন: ${o.guarantor.name} · ${o.guarantor.phone}` : '';

        return `<tr>
          <td class="c g">${slNo}</td>
          <td class="g">${timeStr}</td>
          <td><b>${o.orderNumber}</b></td>
          <td>${custLine}${guarLine ? `<br><span class="sm">${guarLine}</span>` : ''}</td>
          <td class="sm">${itemText}${discNote}</td>
          <td class="c">${pmLabel}${mixedParts ? `<br><span class="sm">${mixedParts}</span>` : ''}</td>
          <td class="r">৳${o.grandTotal.toLocaleString()}</td>
          <td class="r">৳${paid.toLocaleString()}</td>
          <td class="r ${due > 0 ? 'due' : 'g'}">${due > 0 ? `৳${due.toLocaleString()}` : '—'}</td>
          <td class="r bal">৳${runningBalance.toLocaleString()}</td>
          <td class="c"><span class="st ${status.toLowerCase()}">${status}</span></td>
        </tr>`;
      }).join('');

      return `<tr class="dg">
          <td colspan="11"><b>${dateKey}</b> &nbsp;·&nbsp; ${dayOrders.length} অর্ডার &nbsp;·&nbsp; বিক্রয়: ৳${dayTotal.toLocaleString()} &nbsp;·&nbsp; পরিশোধ: ৳${dayPaid.toLocaleString()}${dayDue > 0 ? ` &nbsp;·&nbsp; বাকি: ৳${dayDue.toLocaleString()}` : ''}</td>
        </tr>${txnRows}`;
    }).join('');

    const totalPaidAll = orders.reduce((s, o) => s + (o.paidAmount ?? o.grandTotal), 0);
    const totalDueAll = orders.reduce((s, o) => s + (o.dueAmount ?? 0), 0);
    const totalDiscAll = orders.reduce((s, o) => s + ((o as any).discount ?? 0), 0);
    const sortedDates = [...orders].map(o => new Date(o.createdAt)).sort((a, b) => a.getTime() - b.getTime());
    const fromDate = sortedDates.length ? sortedDates[0].toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—';
    const toDate = sortedDates.length ? sortedDates[sortedDates.length - 1].toLocaleDateString('en-US', { dateStyle: 'medium' }) : '—';

    const css = `
      @page{size:A4 portrait;margin:10mm 11mm}
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;font-size:8.5px;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      /* HEADER */
      .hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:6px}
      .hl{display:flex;align-items:center;gap:8px}
      .logo-img{height:36px;width:auto;object-fit:contain}
      .co-name{font-size:16px;font-weight:900;letter-spacing:2px;line-height:1}
      .co-sub{font-size:7px;color:#444;margin-top:2px}
      .co-contact{font-size:7px;color:#555;margin-top:3px;line-height:1.5}
      .hr{text-align:right}
      .rpt-title{font-size:14px;font-weight:900;letter-spacing:1px;text-transform:uppercase;border-bottom:1.5px solid #000;padding-bottom:2px;display:inline-block}
      .rpt-meta{font-size:7px;color:#444;margin-top:3px}
      /* SUMMARY */
      .sum{display:flex;gap:0;border:1px solid #ccc;margin-bottom:6px}
      .sc{flex:1;padding:4px 8px;border-right:1px solid #ccc;text-align:center}
      .sc:last-child{border-right:none}
      .sl{font-size:6.5px;color:#666;text-transform:uppercase;letter-spacing:.3px}
      .sv{font-size:11px;font-weight:800;color:#000;margin-top:1px}
      /* TABLE */
      table{width:100%;border-collapse:collapse;font-size:8px}
      th{background:#000;color:#fff;padding:4px 5px;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap}
      th.r{text-align:right}th.c{text-align:center}
      tr.dg td{background:#e8e8e8;padding:3px 5px;font-size:7.5px;font-weight:700;border-top:1.5px solid #000;border-bottom:1px solid #bbb}
      td{padding:3px 5px;border-bottom:1px solid #ddd;vertical-align:top}
      tr:nth-child(even) td{background:#f7f7f7}
      .c{text-align:center}.r{text-align:right}.g{color:#777}
      .sm{font-size:7px;color:#555}
      .due{font-weight:700;color:#000}
      .bal{font-weight:800;font-size:8.5px}
      .st{font-size:6.5px;font-weight:800;letter-spacing:.5px;padding:1px 5px;border:1px solid #000;display:inline-block;white-space:nowrap}
      .st.paid{border-style:solid}.st.partial{border-style:dashed}.st.due{background:#000;color:#fff}
      /* TOTAL ROW */
      tfoot td{background:#000;color:#fff;padding:4px 5px;font-weight:700;font-size:8.5px;border-top:2px solid #000}
      tfoot td.r{text-align:right}
      /* FOOTER */
      .foot{display:flex;justify-content:space-between;margin-top:8px;padding-top:5px;border-top:1px solid #ccc;font-size:7px;color:#555}
      .foot .sig{text-align:right}
      .sig-line{display:inline-block;width:160px;border-bottom:1px solid #999;margin-bottom:3px}
      @media print{body{margin:0}tr{page-break-inside:avoid}}
    `;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Sales Statement — ${companyName}</title><style>${css}</style></head><body>

    <div class="hdr">
      <div class="hl">
        <img src="${logoUrl}" class="logo-img" alt="" onerror="this.style.display='none'"/>
        <div>
          <div class="co-name">TECH HAT</div>
          <div class="co-sub">Technology &amp; Electronics</div>
          <div class="co-contact">${[companyPhone, companyEmail, companyAddress].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <div class="hr">
        <div class="rpt-title">Account Statement</div>
        <div class="rpt-meta">Period: ${fromDate} — ${toDate}<br>Printed: ${nowStrEn}</div>
      </div>
    </div>

    <div class="sum">
      <div class="sc"><div class="sl">মোট অর্ডার</div><div class="sv">${summary.totalOrders}</div></div>
      <div class="sc"><div class="sl">গ্রস সেলস</div><div class="sv">৳${summary.totalSales.toLocaleString()}</div></div>
      <div class="sc"><div class="sl">পরিশোধিত</div><div class="sv">৳${totalPaidAll.toLocaleString()}</div></div>
      <div class="sc"><div class="sl">বকেয়া</div><div class="sv">৳${totalDueAll.toLocaleString()}</div></div>
      <div class="sc"><div class="sl">মোট ছাড়</div><div class="sv">৳${totalDiscAll.toLocaleString()}</div></div>
    </div>

    <table>
      <thead><tr>
        <th class="c" style="width:20px">#</th>
        <th style="width:40px">সময়</th>
        <th style="width:95px">ইনভয়েস</th>
        <th style="width:105px">কাস্টমার</th>
        <th>পণ্য সমূহ</th>
        <th class="c" style="width:52px">মাধ্যম</th>
        <th class="r" style="width:56px">মোট</th>
        <th class="r" style="width:56px">পরিশোধ</th>
        <th class="r" style="width:50px">বাকি</th>
        <th class="r" style="width:60px">ব্যালেন্স</th>
        <th class="c" style="width:42px">স্ট্যাটাস</th>
      </tr></thead>
      <tbody>${statementRows}</tbody>
      <tfoot><tr>
        <td colspan="6">সর্বমোট · ${orders.length} টি লেনদেন</td>
        <td class="r">৳${summary.totalSales.toLocaleString()}</td>
        <td class="r">৳${totalPaidAll.toLocaleString()}</td>
        <td class="r">৳${totalDueAll.toLocaleString()}</td>
        <td class="r">৳${summary.totalSales.toLocaleString()}</td>
        <td></td>
      </tr></tfoot>
    </table>

    <div class="foot">
      <div>
        <b>${companyName}</b> — Ref: RPT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${orders.length}<br>
        This is a computer-generated statement. No signature required.
      </div>
      <div class="sig">
        <div class="sig-line"></div><br>Authorized Signature &amp; Seal
      </div>
    </div>

    </body></html>`;

    const w = window.open('', '_blank', 'width=900,height=1100');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.focus(); setTimeout(() => { w.print(); }, 400); };
  };

  const handleFilter = () => {
    startTransition(async () => {
      try {
        let sd: Date | undefined;
        let ed: Date | undefined;
        if (datePreset === 'today') { sd = new Date(todayStr()); ed = new Date(); }
        else if (datePreset === 'yesterday') { sd = new Date(yesterdayStr()); ed = new Date(yesterdayStr() + 'T23:59:59'); }
        else if (datePreset === 'week') { sd = new Date(weekStartStr()); ed = new Date(); }
        else if (datePreset === 'custom') {
          if (startDate) sd = new Date(startDate);
          if (endDate) ed = new Date(endDate + 'T23:59:59');
        }
        const data = await getPOSSalesReport({
          startDate: sd, endDate: ed,
          search: search || undefined,
          status: status as any,
        });
        setOrders(data.orders as any);
        setSummary(data.summary as any);
      } catch {
        toast.error('Failed to fetch report');
      }
    });
  };

  const handlePrint = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=800,height=1123');
    if (!printWindow) return;

    const headerBg = '/images/invoice/header-bg.png';
    const footerBg = '/images/invoice/footer-bg.png';
    const logo = '/images/Logo.png';

    const companyName = invoiceSettings?.invoiceCompanyName || 'TechHat';
    const companyPhone = invoiceSettings?.invoiceCompanyPhone || '+8801911777694';
    const companyEmail = invoiceSettings?.invoiceCompanyEmail || 'techhat.shop@gmail.com';
    const companyAddress = invoiceSettings?.invoiceCompanyAddress || 'Haildhani Bazar, Jhenaidah Sadar, Jhenaidah';

    const paidAmount = order.paidAmount ?? order.grandTotal;
    const dueAmount = order.dueAmount ?? 0;
    const subtotal = (order as any).totalAmount ?? order.grandTotal;
    const discount = (order as any).discount ?? 0;
    const tax = (order as any).tax ?? 0;
    const dateStr = new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const styles = `
      @page { size: A4; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Arial', sans-serif; font-size: 13px; line-height: 1.6; color: #000; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .invoice-container { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; position: relative; padding-bottom: 100px; overflow: hidden; }
      .invoice-header { position: relative; height: 120px; background-image: url('${headerBg}'); background-size: 110%; background-position: right center; background-repeat: no-repeat; display: flex; align-items: center; justify-content: space-between; padding: 20px 40px; margin-top: 10px; }
      .header-left { display: flex; align-items: center; gap: 15px; }
      .logo { height: 70px; width: auto; object-fit: contain; }
      .company-name { font-size: 32px; font-weight: 900; font-family: 'Impact', 'Arial Black', sans-serif; letter-spacing: 2px; line-height: 1; }
      .company-name .tech { color: #E31E24; }
      .company-name .hat { color: #333; }
      .company-slogan { font-size: 11px; color: #666; font-style: italic; margin-top: 4px; }
      .header-right { text-align: right; color: #fff; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
      .invoice-title { color: white; font-size: 32px; font-weight: bold; letter-spacing: 2px; display: inline-block; margin-top: -5px; }
      .company-contact { font-size: 16px; line-height: 1.3; color: #fff; }
      .company-contact div { display: flex; align-items: center; justify-content: flex-end; }
      .invoice-body { padding: 30px 40px; }
      .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 25px; }
      .invoice-to { flex: 1; background: #f9f9f9; padding: 15px; border-radius: 8px; }
      .invoice-to h3 { font-size: 14px; color: #666; margin-bottom: 5px; }
      .customer-name { font-size: 18px; font-weight: bold; color: #E31E24; margin-bottom: 3px; }
      .customer-phone { font-size: 12px; color: #666; }
      .invoice-details { text-align: right; background: #f9f9f9; padding: 15px; border-radius: 8px; }
      .invoice-number { background: #333; color: white; padding: 5px 15px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 8px; border-radius: 6px; }
      .detail-row { font-size: 12px; margin-bottom: 3px; }
      .detail-label { font-weight: normal; color: #666; display: inline-block; width: 100px; text-align: right; }
      .detail-value { font-weight: bold; color: #000; }
      .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border-radius: 8px; overflow: hidden; }
      .invoice-table thead { background: #E31E24; color: white; }
      .invoice-table thead th { padding: 8px 12px; text-align: left; font-size: 13px; font-weight: bold; }
      .invoice-table thead th:nth-child(2), .invoice-table thead th:nth-child(3), .invoice-table thead th:nth-child(4) { text-align: center; background: #333; }
      .invoice-table tbody tr { border-bottom: 1px solid #e0e0e0; }
      .invoice-table tbody td { padding: 10px 12px; font-size: 12px; }
      .invoice-table tbody td:nth-child(2), .invoice-table tbody td:nth-child(3), .invoice-table tbody td:nth-child(4) { text-align: center; font-weight: 600; }
      .item-name { font-weight: 600; color: #000; }
      .invoice-bottom { display: flex; justify-content: space-between; gap: 40px; margin-top: 30px; }
      .payment-info { flex: 1; background: #f9f9f9; padding: 15px; border-radius: 8px; }
      .payment-info h4 { font-size: 13px; font-weight: bold; margin-bottom: 8px; }
      .payment-info .info-row { font-size: 11px; margin-bottom: 4px; }
      .info-label { display: inline-block; width: 80px; color: #666; }
      .info-value { font-weight: 600; color: #000; }
      .totals { min-width: 300px; border-radius: 8px; overflow: hidden; }
      .total-row { display: flex; justify-content: space-between; padding: 8px 15px; font-size: 13px; }
      .total-row.subtotal { border-top: 1px solid #ddd; border-radius: 8px 8px 0 0; }
      .total-row.grand { background: #E31E24; color: white; font-size: 16px; font-weight: bold; margin-top: 5px; border-radius: 6px; }
      .total-row.vat, .total-row.discount { font-size: 12px; color: #666; }
      .terms-section { margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 3px solid #E31E24; border-radius: 8px; }
      .terms-section h4 { font-size: 12px; font-weight: bold; margin-bottom: 5px; }
      .terms-section p { font-size: 11px; color: #666; line-height: 1.5; }
      .signature-section { margin-top: 40px; text-align: right; }
      .signature-line { border-top: 1px solid #000; width: 200px; margin-left: auto; margin-top: 60px; padding-top: 5px; font-size: 11px; text-align: center; }
      .invoice-footer { position: absolute; bottom: 0; left: 0; right: 0; height: 80px; text-align: center; display: flex; flex-direction: column; justify-content: flex-start; padding-top: 10px; }
      .footer-decoration { position: absolute; bottom: 0; right: 0; width: 60%; height: 80px; background-image: url('${footerBg}'); background-size: contain; background-position: right bottom; background-repeat: no-repeat; pointer-events: none; z-index: 0; overflow: hidden; }
      .invoice-footer > * { position: relative; z-index: 1; }
      .thank-you { font-size: 14px; font-weight: bold; color: #E31E24; margin-bottom: 5px; }
      .footer-note { font-size: 10px; color: #666; font-style: italic; }
      @media print { body { margin: 0; } .invoice-container { margin: 0; } }
    `;

    const itemsHtml = order.items.map((item: any) => `
      <tr>
        <td><div class="item-name">${item.productName}</div></td>
        <td>${String(item.quantity).padStart(2, '0')}</td>
        <td>৳${(item.unitPrice ?? 0).toLocaleString()}</td>
        <td>৳${(item.total ?? (item.unitPrice * item.quantity)).toLocaleString()}</td>
      </tr>
    `).join('');

    const contentHtml = `
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="header-left">
            <img src="${logo}" alt="${companyName}" class="logo" />
            <div>
              <div class="company-name"><span class="tech">TECH</span> <span class="hat">HAT</span></div>
              <div class="company-slogan">Trusted Place of Technology</div>
            </div>
          </div>
          <div class="header-right">
            <div class="invoice-title">INVOICE</div>
            <div class="company-contact">
              <div>${companyPhone} <span style="display:inline-flex;align-items:center;margin-left:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 13 19.79 19.79 0 0 1 1.87 4.26 2 2 0 0 1 3.84 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></span></div>
              <div>${companyEmail} <span style="display:inline-flex;align-items:center;margin-left:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span></div>
              <div>${companyAddress} <span style="display:inline-flex;align-items:center;margin-left:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span></div>
            </div>
          </div>
        </div>
        <div class="invoice-body">
          <div class="invoice-meta">
            <div class="invoice-to">
              <h3>Invoice To:</h3>
              <div class="customer-name">${order.customerName || 'Guest Customer'}</div>
              ${order.customerPhone ? `<div class="customer-phone">P : ${order.customerPhone}</div>` : ''}
              ${order.guarantor ? `<div style="margin-top:8px;font-size:11px;color:#92400e;background:#fffbeb;padding:6px 10px;border-radius:6px;border:1px solid #fde68a;"><b>Guarantor:</b> ${order.guarantor.name} — ${order.guarantor.phone}</div>` : ''}
            </div>
            <div class="invoice-details">
              <div class="invoice-number">INVOICE NO:#${order.orderNumber}</div>
              <div class="detail-row"><span class="detail-label">Account No</span> <span class="detail-value">${order.orderNumber.slice(0, 6)}</span></div>
              <div class="detail-row"><span class="detail-label">Invoice Date</span> <span class="detail-value">${dateStr}</span></div>
              <div class="detail-row"><span class="detail-label">Status</span> <span class="detail-value" style="color:${dueAmount > 0 ? '#dc2626' : '#16a34a'}">${order.posPaymentStatus || 'PAID'}</span></div>
            </div>
          </div>
          <table class="invoice-table">
            <thead><tr>
              <th>Item description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total Price</th>
            </tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div class="invoice-bottom">
            <div class="payment-info">
              <h4>Payment method</h4>
              <div class="info-row"><span class="info-label">Method</span><span class="info-value">${order.paymentMethod}</span></div>
              <div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color:${dueAmount > 0 ? '#dc2626' : '#16a34a'}">${order.posPaymentStatus || 'PAID'}</span></div>
            </div>
            <div class="totals">
              <div class="total-row subtotal"><span>Sub Total</span><span>৳${subtotal.toLocaleString()}</span></div>
              ${tax > 0 ? `<div class="total-row vat"><span>Tax</span><span>৳${tax.toLocaleString()}</span></div>` : ''}
              ${discount > 0 ? `<div class="total-row discount"><span>Discount</span><span>-৳${discount.toLocaleString()}</span></div>` : ''}
              <div class="total-row grand"><span>Grand Total</span><span>৳${order.grandTotal.toLocaleString()}</span></div>
              ${dueAmount > 0 ? `
                <div class="total-row" style="color:#16a34a;font-weight:700;"><span>Paid</span><span>৳${paidAmount.toLocaleString()}</span></div>
                <div class="total-row" style="color:#dc2626;font-weight:700;"><span>Due</span><span>৳${dueAmount.toLocaleString()}</span></div>
              ` : ''}
            </div>
          </div>
          <div class="terms-section">
            <h4>Terms &amp; Conditions:</h4>
            <p>${invoiceSettings?.invoiceFooterText || 'Thank you for your business! All sales are final. Please keep this invoice for your records.'}</p>
          </div>
          <div class="signature-section"><div class="signature-line">Chief Director</div></div>
        </div>
        <div class="footer-decoration"></div>
        <div class="invoice-footer">
          <div class="thank-you">Thank You for Your Business!</div>
          <div class="footer-note">We appreciate your trust in TECH HAT</div>
        </div>
      </div>
    `;

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Invoice ${order.orderNumber}</title><meta charset="UTF-8"><style>${styles}</style></head><body>${contentHtml}</body></html>`);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };
  };

  const statCards = [
    { label: 'Total Orders', value: String(summary.totalOrders), icon: ShoppingCart, color: 'text-blue-500', vclass: '' },
    { label: 'Total Sales', value: `৳${summary.totalSales.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-500', vclass: '' },
    { label: 'Total Paid', value: `৳${summary.totalPaid.toLocaleString()}`, icon: CheckCircle2, color: 'text-green-500', vclass: 'text-green-600' },
    { label: 'Total Due', value: `৳${summary.totalDue.toLocaleString()}`, icon: AlertCircle, color: 'text-red-500', vclass: 'text-red-600' },
    { label: "Today's Sales", value: `৳${dailySummary.totalSales.toLocaleString()}`, icon: DollarSign, color: 'text-orange-500', vclass: '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-sm text-gray-500 mt-1">All POS invoices and transactions</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="flex items-center gap-1.5" disabled={orders.length === 0}>
            <Download className="h-4 w-4" />
            CSV ডাউনলোড
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintReport} className="flex items-center gap-1.5" disabled={orders.length === 0}>
            <FileText className="h-4 w-4" />
            রিপোর্ট প্রিন্ট
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, vclass }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <p className={`text-xl font-bold ${vclass}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-9" placeholder="Invoice #, customer, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-[155px]">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {datePreset === 'custom' && (
              <>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[155px]" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[155px]" />
              </>
            )}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[135px]">
                <Filter className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="DUE">Due</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleFilter} disabled={isPending} className="bg-gray-900 hover:bg-gray-800">
              {isPending ? 'Loading...' : 'Apply'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Invoice</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Paid</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Due</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">No orders found</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-700 text-xs">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                      </td>
                      <td className="px-4 py-3">
                        {order.posCustomer ? (
                          <a href={`/admin/pos/customers/${order.posCustomer.id}`} className="text-blue-600 hover:underline font-medium">
                            {order.customerName || '—'}
                          </a>
                        ) : (
                          <span className="text-gray-600">{order.customerName || 'Guest'}</span>
                        )}
                        {order.customerPhone && <p className="text-xs text-gray-400">{order.customerPhone}</p>}
                        {order.guarantor && <p className="text-xs text-amber-600">G: {order.guarantor.name}</p>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">৳{order.grandTotal.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-semibold">
                        ৳{(order.paidAmount ?? order.grandTotal).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(order.dueAmount ?? 0) > 0
                          ? <span className="text-red-600 font-semibold">৳{order.dueAmount!.toLocaleString()}</span>
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">{statusBadge(order.posPaymentStatus)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handlePrint(order)}>
                          <Printer className="h-3 w-3" /> Print
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

