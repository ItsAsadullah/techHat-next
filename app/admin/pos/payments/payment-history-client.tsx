'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Printer, DollarSign, CreditCard, Smartphone, Banknote, Filter } from 'lucide-react';
import { getPaymentHistory } from '@/lib/actions/ledger-actions';
import type { InvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { toast } from 'sonner';

type Payment = {
  id: string;
  date: Date;
  customerName: string;
  customerId: string | null;
  method: string;
  amount: number;
  invoiceNumber: string;
  type: 'Initial Payment' | 'Due Payment';
  note?: string | null;
};

interface Props {
  initialData: { payments: Payment[]; totalAmount: number };
  customers: { id: string; name: string; phone: string }[];
  invoiceSettings: InvoiceSettings;
}

const fmt = (n: number) =>
  `৳${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: Date) =>
  new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

const methodIcon = (m: string) => {
  if (m === 'CASH') return <Banknote className="h-3.5 w-3.5 text-green-600 inline mr-1" />;
  if (m === 'CARD') return <CreditCard className="h-3.5 w-3.5 text-blue-600 inline mr-1" />;
  if (m === 'MOBILE_BANKING') return <Smartphone className="h-3.5 w-3.5 text-purple-600 inline mr-1" />;
  return <DollarSign className="h-3.5 w-3.5 text-gray-500 inline mr-1" />;
};

const methodLabel: Record<string, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  MOBILE_BANKING: 'Mobile Banking',
  ONLINE: 'Online',
  MIXED: 'Mixed',
  'Due Collection': 'Due Collection',
};

export function PaymentHistoryClient({ initialData, customers, invoiceSettings }: Props) {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>(initialData.payments);
  const [totalAmount, setTotalAmount] = useState(initialData.totalAmount);
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('ALL');
  const [customerId, setCustomerId] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleFilter = () => {
    startTransition(async () => {
      try {
        const data = await getPaymentHistory({
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate + 'T23:59:59') : undefined,
          method: method === 'ALL' ? undefined : method,
          customerId: customerId === 'ALL' ? undefined : customerId,
        });
        setPayments(data.payments as Payment[]);
        setTotalAmount(data.totalAmount);
      } catch {
        toast.error('Failed to load payment history');
      }
    });
  };

  const filtered = payments.filter((p) => {
    if (!search) return true;
    return (
      p.customerName.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handlePrint = () => {
    const store = invoiceSettings.invoiceCompanyName || 'TechHat';
    const phone = invoiceSettings.invoiceCompanyPhone || '';
    const address = invoiceSettings.invoiceCompanyAddress || '';
    const today = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });

    const rows = filtered
      .map(
        (p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${fmtDate(p.date)}</td>
        <td><strong>${p.customerName}</strong></td>
        <td>${methodLabel[p.method] || p.method}</td>
        <td class="num green"><strong>${fmt(p.amount)}</strong></td>
        <td class="mono">${p.invoiceNumber}</td>
        <td><span class="badge ${p.type === 'Due Payment' ? 'badge-orange' : 'badge-blue'}">${p.type}</span></td>
        ${p.note ? `<td class="note">${p.note}</td>` : '<td>—</td>'}
      </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payment History</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #111; }
  .header { display: flex; justify-content: space-between; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 2px solid #111; }
  .store-name { font-size: 20px; font-weight: 800; }
  .store-sub { font-size: 10px; color: #555; margin-top: 2px; }
  .report-title h2 { font-size: 16px; font-weight: 700; text-align: right; }
  .report-title p { font-size: 10px; color: #666; text-align: right; margin-top: 2px; }
  .summary { display: flex; gap: 20px; margin-bottom: 14px; }
  .stat { background: #f8f9fa; border-radius: 6px; padding: 8px 16px; text-align: center; }
  .stat .l { font-size: 9px; color: #777; text-transform: uppercase; }
  .stat .v { font-size: 14px; font-weight: 700; margin-top: 2px; }
  .green { color: #16a34a; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #111; color: #fff; }
  th { padding: 7px 8px; text-align: left; font-size: 10px; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
  tr:nth-child(even) td { background: #fafafa; }
  .num { text-align: right; }
  .mono { font-family: monospace; font-size: 10px; font-weight: 600; }
  .note { color: #777; font-style: italic; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-orange { background: #ffedd5; color: #c2410c; }
  .summary-row td { font-weight: 700; background: #f0f0f0 !important; }
  .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
</style></head><body>
<div class="header">
  <div><div class="store-name">${store}</div><div class="store-sub">${address}${phone ? ` | ${phone}` : ''}</div></div>
  <div class="report-title">
    <h2>PAYMENT HISTORY REPORT</h2>
    <p>Generated: ${today}${startDate ? ` | From: ${startDate}` : ''}${endDate ? ` To: ${endDate}` : ''}</p>
  </div>
</div>
<div class="summary">
  <div class="stat"><div class="l">Total Payments</div><div class="v">${filtered.length}</div></div>
  <div class="stat"><div class="l">Total Amount Collected</div><div class="v green">${fmt(filtered.reduce((s, p) => s + p.amount, 0))}</div></div>
</div>
<table>
  <thead><tr><th>#</th><th>Date & Time</th><th>Customer</th><th>Method</th><th class="num">Amount</th><th>Invoice</th><th>Type</th><th>Note</th></tr></thead>
  <tbody>
    ${rows}
    <tr class="summary-row">
      <td colspan="4">TOTAL</td>
      <td class="num green">${fmt(filtered.reduce((s, p) => s + p.amount, 0))}</td>
      <td colspan="3"></td>
    </tr>
  </tbody>
</table>
<div class="footer">TechHat POS &bull; Payment History Report &bull; ${today}</div>
</body></html>`;

    const win = window.open('', '_blank', 'width=1200,height=900');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-sm text-gray-500 mt-1">All collected payments across POS</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="gap-2 bg-gray-900 hover:bg-gray-800 text-white">
          <Printer className="h-4 w-4" /> Print / PDF
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Customer</label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Customers</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Payment Method</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Methods</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="MOBILE_BANKING">Mobile Banking</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="MIXED">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleFilter}
            disabled={isPending}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            {isPending ? 'Loading...' : 'Apply Filters'}
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Payments', value: filtered.length.toString(), color: 'text-gray-900' },
          {
            label: 'Total Collected',
            value: fmt(filtered.reduce((s, p) => s + p.amount, 0)),
            color: 'text-green-700',
          },
          {
            label: 'Initial Payments',
            value: filtered.filter((p) => p.type === 'Initial Payment').length.toString(),
            color: 'text-blue-700',
          },
          {
            label: 'Due Collections',
            value: filtered.filter((p) => p.type === 'Due Payment').length.toString(),
            color: 'text-orange-700',
          },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Search by customer or invoice number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-3 font-semibold text-xs">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Date & Time</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Method</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Invoice #</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr key={p.id} className={`hover:bg-gray-50 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                      <td className="px-4 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                        {fmtDate(p.date)}
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-gray-900 text-xs">{p.customerName}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">
                        {methodIcon(p.method)}
                        {methodLabel[p.method] || p.method}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-sm text-green-600">
                        {fmt(p.amount)}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-gray-700 text-xs">
                        {p.invoiceNumber}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          className={`text-xs border-0 ${
                            p.type === 'Due Payment'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {p.type}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td colSpan={4} className="px-4 py-3 text-sm">
                      TOTAL ({filtered.length} payments)
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-700">
                      {fmt(filtered.reduce((s, p) => s + p.amount, 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
