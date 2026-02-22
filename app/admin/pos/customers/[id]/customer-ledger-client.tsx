'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Phone, MapPin, Mail, ShoppingBag, Printer,
  TrendingUp, AlertCircle, DollarSign, Download,
} from 'lucide-react';
import type { InvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import type { getCustomerLedger } from '@/lib/actions/ledger-actions';

type LedgerData = NonNullable<Awaited<ReturnType<typeof getCustomerLedger>>>;

interface Props {
  data: LedgerData;
  invoiceSettings: InvoiceSettings;
}

const fmt = (n: number) => `৳${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: Date) =>
  new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

export function CustomerLedgerClient({ data, invoiceSettings }: Props) {
  const router = useRouter();
  const { customer, ledger } = data;
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const store = invoiceSettings.invoiceCompanyName || 'TechHat';
    const phone = invoiceSettings.invoiceCompanyPhone || '';
    const address = invoiceSettings.invoiceCompanyAddress || '';
    const today = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });

    const ledgerRows = ledger
      .map(
        (e) => `
      <tr>
        <td>${fmtDate(e.date)}</td>
        <td><span class="badge ${e.type === 'Invoice' ? 'badge-blue' : 'badge-green'}">${e.type}</span></td>
        <td class="mono">${e.reference}</td>
        <td>${e.description}</td>
        <td class="num">${e.debit > 0 ? fmt(e.debit) : '—'}</td>
        <td class="num">${e.credit > 0 ? fmt(e.credit) : '—'}</td>
        <td class="num ${e.balance > 0 ? 'due' : 'clear'}">${fmt(Math.abs(e.balance))}${e.balance > 0 ? ' Dr' : ' Cr'}</td>
      </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ledger - ${customer.name}</title>
<style>
  @page { size: A4; margin: 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #111; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #111; }
  .store-name { font-size: 20px; font-weight: 800; letter-spacing: 1px; }
  .store-sub { font-size: 10px; color: #555; margin-top: 2px; }
  .report-title { text-align: right; }
  .report-title h2 { font-size: 16px; font-weight: 700; color: #1a1a1a; }
  .report-title p { font-size: 10px; color: #666; margin-top: 2px; }
  .customer-card { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .customer-info h3 { font-size: 14px; font-weight: 700; }
  .customer-info p { font-size: 10px; color: #555; margin-top: 2px; }
  .stat-box { text-align: center; }
  .stat-box .label { font-size: 9px; color: #777; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-box .value { font-size: 14px; font-weight: 700; margin-top: 2px; }
  .stat-box .value.green { color: #16a34a; }
  .stat-box .value.red { color: #dc2626; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: #111; color: #fff; }
  th { padding: 7px 8px; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 0.3px; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
  tr:nth-child(even) td { background: #fafafa; }
  .num { text-align: right; }
  .mono { font-family: monospace; font-weight: 600; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-green { background: #dcfce7; color: #15803d; }
  .due { color: #dc2626; font-weight: 700; }
  .clear { color: #16a34a; font-weight: 700; }
  .summary-row td { font-weight: 700; background: #f0f0f0 !important; font-size: 11px; }
  .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
</style></head><body>
<div class="header">
  <div>
    <div class="store-name">${store}</div>
    <div class="store-sub">${address}${phone ? ` | ${phone}` : ''}</div>
  </div>
  <div class="report-title">
    <h2>CUSTOMER LEDGER</h2>
    <p>Generated: ${today}</p>
  </div>
</div>
<div class="customer-card">
  <div class="customer-info" style="grid-column: span 1;">
    <h3>${customer.name}</h3>
    <p>${customer.phone}</p>
    ${customer.email ? `<p>${customer.email}</p>` : ''}
    ${customer.address ? `<p>${customer.address}</p>` : ''}
  </div>
  <div class="stat-box">
    <div class="label">Total Purchase</div>
    <div class="value green">${fmt(customer.totalPurchase)}</div>
  </div>
  <div class="stat-box">
    <div class="label">Total Due</div>
    <div class="value ${customer.totalDue > 0 ? 'red' : 'green'}">${fmt(customer.totalDue)}</div>
  </div>
</div>
<table>
  <thead>
    <tr>
      <th>Date</th><th>Type</th><th>Reference</th><th>Description</th>
      <th style="text-align:right">Debit (৳)</th>
      <th style="text-align:right">Credit (৳)</th>
      <th style="text-align:right">Balance (৳)</th>
    </tr>
  </thead>
  <tbody>
    ${ledgerRows}
    <tr class="summary-row">
      <td colspan="4">TOTAL</td>
      <td class="num">${fmt(ledger.reduce((s, e) => s + e.debit, 0))}</td>
      <td class="num">${fmt(ledger.reduce((s, e) => s + e.credit, 0))}</td>
      <td class="num ${customer.totalDue > 0 ? 'due' : 'clear'}">${fmt(customer.totalDue)} Dr</td>
    </tr>
  </tbody>
</table>
<div class="footer">TechHat POS &bull; Confidential Customer Ledger &bull; ${today}</div>
</body></html>`;

    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Button>
        <Button onClick={handlePrint} className="gap-2 bg-gray-900 hover:bg-gray-800 text-white">
          <Printer className="h-4 w-4" /> Print / Download PDF
        </Button>
      </div>

      {/* Customer Profile Header */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {customer.phone}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {customer.email}
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {customer.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" /> Total Orders
              </p>
              <p className="text-2xl font-bold text-gray-800">{customer.totalOrders}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Total Purchase
              </p>
              <p className="text-2xl font-bold text-blue-700">{fmt(customer.totalPurchase)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Total Paid
              </p>
              <p className="text-2xl font-bold text-green-700">{fmt(customer.totalPaid)}</p>
            </div>
            <div className={`rounded-xl p-4 ${customer.totalDue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Total Due
              </p>
              <p className={`text-2xl font-bold ${customer.totalDue > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {fmt(customer.totalDue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Account Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0" ref={printRef}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-3 font-semibold text-xs">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Reference</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Description</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs">Debit (৳)</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs">Credit (৳)</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs">Balance (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      No ledger entries found
                    </td>
                  </tr>
                ) : (
                  ledger.map((entry, idx) => (
                    <tr key={idx} className={`hover:bg-gray-50 ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">
                        {fmtDate(entry.date)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          className={`text-xs border-0 ${
                            entry.type === 'Invoice'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {entry.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold text-gray-700 text-xs">
                        {entry.reference}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">{entry.description}</td>
                      <td className="px-4 py-2.5 text-right text-xs font-semibold">
                        {entry.debit > 0 ? (
                          <span className="text-orange-600">{fmt(entry.debit)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs font-semibold">
                        {entry.credit > 0 ? (
                          <span className="text-green-600">{fmt(entry.credit)}</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs font-bold">
                        <span className={entry.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                          {fmt(Math.abs(entry.balance))}
                          <span className="ml-1 text-[10px] font-normal">
                            {entry.balance > 0 ? 'Dr' : 'Cr'}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {ledger.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td colSpan={4} className="px-4 py-3 text-sm">
                      TOTAL
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-orange-600">
                      {fmt(ledger.reduce((s, e) => s + e.debit, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-green-600">
                      {fmt(ledger.reduce((s, e) => s + e.credit, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <span className={customer.totalDue > 0 ? 'text-red-600' : 'text-green-600'}>
                        {fmt(customer.totalDue)}
                        <span className="ml-1 text-xs font-normal">Dr</span>
                      </span>
                    </td>
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
