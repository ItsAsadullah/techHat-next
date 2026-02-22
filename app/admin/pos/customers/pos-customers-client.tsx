'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Search, TrendingUp, AlertCircle, ArrowLeft, Printer, BookOpen, DollarSign } from 'lucide-react';
import type { InvoiceSettings } from '@/lib/actions/invoice-settings-actions';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  totalPurchase: number;
  totalPaid: number;
  totalDue: number;
  totalOrders: number;
  createdAt: Date;
}

interface Props {
  customers: Customer[];
  invoiceSettings: InvoiceSettings;
}

const fmt = (n: number) =>
  `?${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function POSCustomersClient({ customers, invoiceSettings }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const totalDueAll = customers.reduce((s, c) => s + c.totalDue, 0);
  const totalSalesAll = customers.reduce((s, c) => s + c.totalPurchase, 0);
  const totalPaidAll = customers.reduce((s, c) => s + c.totalPaid, 0);

  const handlePrintAll = () => {
    const store = invoiceSettings.invoiceCompanyName || 'TechHat';
    const phone = invoiceSettings.invoiceCompanyPhone || '';
    const address = invoiceSettings.invoiceCompanyAddress || '';
    const today = new Date().toLocaleDateString('en-US', { dateStyle: 'long' });

    const rows = filtered
      .map(
        (c, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${c.name}</strong></td>
        <td>${c.phone}</td>
        <td class="num">${c.totalOrders}</td>
        <td class="num green">${fmt(c.totalPurchase)}</td>
        <td class="num">${fmt(c.totalPaid)}</td>
        <td class="num ${c.totalDue > 0 ? 'red' : 'green'}">${fmt(c.totalDue)}</td>
      </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>All Customers Report</title>
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
  .green { color: #16a34a; } .red { color: #dc2626; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #111; color: #fff; }
  th { padding: 7px 8px; text-align: left; font-size: 10px; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 10px; }
  tr:nth-child(even) td { background: #fafafa; }
  .num { text-align: right; }
  .summary-row td { font-weight: 700; background: #f0f0f0 !important; }
  .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
</style></head><body>
<div class="header">
  <div><div class="store-name">${store}</div><div class="store-sub">${address}${phone ? ' | ' + phone : ''}</div></div>
  <div class="report-title"><h2>ALL CUSTOMERS REPORT</h2><p>Generated: ${today}</p></div>
</div>
<div class="summary">
  <div class="stat"><div class="l">Total Customers</div><div class="v">${customers.length}</div></div>
  <div class="stat"><div class="l">Total Sales</div><div class="v green">${fmt(customers.reduce((s, c) => s + c.totalPurchase, 0))}</div></div>
  <div class="stat"><div class="l">Total Paid</div><div class="v green">${fmt(customers.reduce((s, c) => s + c.totalPaid, 0))}</div></div>
  <div class="stat"><div class="l">Total Due</div><div class="v red">${fmt(customers.reduce((s, c) => s + c.totalDue, 0))}</div></div>
</div>
<table>
  <thead><tr><th>#</th><th>Customer</th><th>Phone</th><th class="num">Invoices</th><th class="num">Total Purchase</th><th class="num">Total Paid</th><th class="num">Total Due</th></tr></thead>
  <tbody>
    ${rows}
    <tr class="summary-row">
      <td colspan="4">TOTAL</td>
      <td class="num green">${fmt(customers.reduce((s, c) => s + c.totalPurchase, 0))}</td>
      <td class="num">${fmt(customers.reduce((s, c) => s + c.totalPaid, 0))}</td>
      <td class="num red">${fmt(customers.reduce((s, c) => s + c.totalDue, 0))}</td>
    </tr>
  </tbody>
</table>
<div class="footer">TechHat POS - All Customers Report - ${today}</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Customer Database</h1>
            <p className="text-sm text-gray-500 mt-1">{customers.length} registered customers</p>
          </div>
        </div>
        <Button onClick={handlePrintAll} className="gap-2 bg-gray-900 hover:bg-gray-800 text-white">
          <Printer className="h-4 w-4" /> Print All Customers
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Customers</p>
              <p className="text-xl font-bold">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Sales</p>
              <p className="text-xl font-bold text-indigo-700">{fmt(totalSalesAll)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Paid</p>
              <p className="text-xl font-bold text-green-700">{fmt(totalPaidAll)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Due</p>
              <p className="text-xl font-bold text-red-600">{fmt(totalDueAll)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-9"
          placeholder="Search by name or phone..."
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
                  <th className="text-left px-4 py-3 font-semibold text-xs">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs">Phone</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs">Invoices</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs">Total Purchase</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs">Total Paid</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs">Total Due</th>
                  <th className="text-center px-4 py-3 font-semibold text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer, idx) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{customer.name}</p>
                        {customer.email && <p className="text-xs text-gray-400">{customer.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{customer.phone}</td>
                      <td className="px-4 py-3 text-right text-gray-600 text-xs">{customer.totalOrders}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900 text-xs">
                        {fmt(customer.totalPurchase)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600 text-xs">
                        {fmt(customer.totalPaid)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">
                        {customer.totalDue > 0 ? (
                          <span className="font-semibold text-red-600">{fmt(customer.totalDue)}</span>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-0 text-xs">Clear</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/pos/customers/${customer.id}`)}
                            className="h-7 text-xs gap-1"
                          >
                            <BookOpen className="h-3 w-3" />
                            Ledger
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                    <td colSpan={4} className="px-4 py-3 text-sm">TOTAL</td>
                    <td className="px-4 py-3 text-right text-sm">{fmt(totalSalesAll)}</td>
                    <td className="px-4 py-3 text-right text-sm text-green-700">{fmt(totalPaidAll)}</td>
                    <td className="px-4 py-3 text-right text-sm text-red-600">{fmt(totalDueAll)}</td>
                    <td></td>
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
