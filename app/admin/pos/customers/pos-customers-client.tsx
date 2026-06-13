'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Search, TrendingUp, AlertCircle, ArrowLeft, Printer, BookOpen, DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import type { InvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import { createPOSCustomer, updatePOSCustomer, deletePOSCustomer } from '@/lib/actions/pos-customer-actions';

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

export function POSCustomersClient({ customers, invoiceSettings }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  
  const currencySymbol = invoiceSettings?.currencySymbol || '৳';
  const fmt = (n: number) =>
    `${currencySymbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const openAdd = () => {
    setFormData({ name: '', phone: '', email: '', address: '' });
    setIsAddOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '' });
    setIsEditOpen(true);
  };

  const openDelete = (c: Customer) => {
    setEditingCustomer(c);
    setIsDeleteOpen(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return toast.error('Name and phone are required');
    setIsSubmitting(true);
    const res = await createPOSCustomer(formData);
    setIsSubmitting(false);
    if (res.success) {
      toast.success('Customer added successfully');
      setIsAddOpen(false);
    } else {
      toast.error(res.error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!formData.name || !formData.phone) return toast.error('Name and phone are required');
    setIsSubmitting(true);
    const res = await updatePOSCustomer(editingCustomer.id, formData);
    setIsSubmitting(false);
    if (res.success) {
      toast.success('Customer updated successfully');
      setIsEditOpen(false);
    } else {
      toast.error(res.error);
    }
  };

  const handleDelete = async () => {
    if (!editingCustomer) return;
    setIsSubmitting(true);
    const res = await deletePOSCustomer(editingCustomer.id);
    setIsSubmitting(false);
    if (res.success) {
      toast.success('Customer deleted successfully');
      setIsDeleteOpen(false);
    } else {
      toast.error(res.error);
    }
  };

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
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9 shrink-0 rounded-full bg-gray-50 hover:bg-gray-100 border-gray-200">
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">Customer Database</h1>
            <p className="text-xs text-gray-500 mt-0.5">{customers.length} registered customers</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAdd} className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm rounded-lg px-3 sm:px-4">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Customer</span>
          </Button>
          <Button onClick={handlePrintAll} variant="outline" className="flex h-9 gap-2 shadow-sm rounded-lg px-3 sm:px-4">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-blue-50 border border-blue-100 rounded-xl shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider truncate">Customers</p>
              <p className="text-base sm:text-xl font-bold text-gray-900 truncate">{customers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider truncate">Total Sales</p>
              <p className="text-base sm:text-xl font-bold text-indigo-700 truncate">{fmt(totalSalesAll)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-green-50 border border-green-100 rounded-xl shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider truncate">Total Paid</p>
              <p className="text-base sm:text-xl font-bold text-green-700 truncate">{fmt(totalPaidAll)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-3 sm:p-4 flex items-center gap-3">
            <div className="p-2 sm:p-2.5 bg-red-50 border border-red-100 rounded-xl shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider truncate">Total Due</p>
              <p className="text-base sm:text-xl font-bold text-red-600 truncate">{fmt(totalDueAll)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        <Input
          className="pl-10 h-11 bg-white border-gray-200 shadow-sm focus-visible:ring-blue-500 rounded-xl"
          placeholder="Search by customer name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop Table View */}
      <Card className="hidden md:block border-gray-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs tracking-wider uppercase">#</th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs tracking-wider uppercase">Customer</th>
                  <th className="text-left px-5 py-3.5 font-medium text-gray-500 text-xs tracking-wider uppercase">Phone</th>
                  <th className="text-right px-5 py-3.5 font-medium text-gray-500 text-xs tracking-wider uppercase">Invoices</th>
                  <th className="text-right px-5 py-3.5 font-medium text-gray-500 text-xs tracking-wider uppercase">Purchase</th>
                  <th className="text-right px-5 py-3.5 font-medium text-gray-500 text-xs tracking-wider uppercase">Paid</th>
                  <th className="text-right px-5 py-3.5 font-medium text-gray-500 text-xs tracking-wider uppercase">Due</th>
                  <th className="text-center px-5 py-3.5 font-medium text-gray-500 text-xs tracking-wider uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="h-8 w-8 text-gray-300" />
                        <p>No customers found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer, idx) => (
                    <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-5 py-4 text-gray-400 text-xs">{idx + 1}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{customer.name}</p>
                        {customer.email && <p className="text-xs text-gray-500 mt-0.5">{customer.email}</p>}
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-sm">{customer.phone}</td>
                      <td className="px-5 py-4 text-right text-gray-600 text-sm">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">{customer.totalOrders}</Badge>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-gray-900 text-sm">
                        {fmt(customer.totalPurchase)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-green-600 text-sm">
                        {fmt(customer.totalPaid)}
                      </td>
                      <td className="px-5 py-4 text-right text-sm">
                        {customer.totalDue > 0 ? (
                          <span className="font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">{fmt(customer.totalDue)}</span>
                        ) : (
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">Clear</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(customer)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit Customer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openDelete(customer)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/pos/customers/${customer.id}`)}
                            className="h-8 text-xs gap-1.5 bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
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
                  <tr className="bg-gray-50/80 font-semibold border-t border-gray-200">
                    <td colSpan={4} className="px-5 py-4 text-sm text-gray-600">TOTAL SUMMARY</td>
                    <td className="px-5 py-4 text-right text-sm text-indigo-700">{fmt(totalSalesAll)}</td>
                    <td className="px-5 py-4 text-right text-sm text-green-700">{fmt(totalPaidAll)}</td>
                    <td className="px-5 py-4 text-right text-sm text-red-600">{fmt(totalDueAll)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-3">
        {filtered.length === 0 ? (
          <Card className="border border-dashed border-gray-200 shadow-none bg-gray-50/50">
            <CardContent className="p-8 text-center text-gray-400">
              <div className="flex flex-col items-center justify-center gap-2">
                <Users className="h-8 w-8 text-gray-300" />
                <p>No customers found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {filtered.map((customer, idx) => (
              <Card key={customer.id} className="border-gray-100 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 bg-white border-b border-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{customer.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">{customer.phone}</span>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px] h-5 px-1.5 border-0">
                            {customer.totalOrders} inv
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-400 border-gray-200 shrink-0">
                        #{idx + 1}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/50 p-4 grid grid-cols-3 gap-y-4 gap-x-2 text-sm border-b border-gray-100">
                     <div className="col-span-1">
                       <p className="text-[10px] uppercase tracking-wider font-medium text-gray-500 mb-1">Purchase</p>
                       <p className="font-semibold text-gray-900">{fmt(customer.totalPurchase)}</p>
                     </div>
                     <div className="col-span-1">
                       <p className="text-[10px] uppercase tracking-wider font-medium text-gray-500 mb-1">Paid</p>
                       <p className="font-semibold text-green-600">{fmt(customer.totalPaid)}</p>
                     </div>
                     <div className="col-span-1 text-right">
                       <p className="text-[10px] uppercase tracking-wider font-medium text-gray-500 mb-1">Due</p>
                       {customer.totalDue > 0 ? (
                          <span className="font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded text-xs">{fmt(customer.totalDue)}</span>
                        ) : (
                          <span className="font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-xs">Clear</span>
                        )}
                     </div>
                  </div>

                  <div className="p-3 bg-white grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEdit(customer)}
                      className="h-10 w-full col-span-1 border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDelete(customer)}
                      className="h-10 w-full col-span-1 border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/admin/pos/customers/${customer.id}`)}
                      className="h-10 col-span-2 gap-2 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 border-gray-200 hover:border-blue-200 shadow-sm"
                    >
                      <BookOpen className="h-4 w-4" />
                      Ledger
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Mobile Total Summary Card */}
            <Card className="mt-2 border-indigo-100 bg-indigo-50/50 shadow-sm">
              <CardContent className="p-4">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">Total Summary</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-indigo-600/70 font-medium uppercase mb-0.5">Sales</p>
                    <p className="text-sm font-bold text-indigo-700">{fmt(totalSalesAll)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-green-600/70 font-medium uppercase mb-0.5">Paid</p>
                    <p className="text-sm font-bold text-green-700">{fmt(totalPaidAll)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-red-600/70 font-medium uppercase mb-0.5">Due</p>
                    <p className="text-sm font-bold text-red-600">{fmt(totalDueAll)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(val) => {
        if (!val) { setIsAddOpen(false); setIsEditOpen(false); }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription>
              {isEditOpen ? 'Update the details for this customer.' : 'Enter the details for the new customer.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={isEditOpen ? handleEdit : handleAdd} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Customer Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Email Address (Optional)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                placeholder="Customer Address (Optional)"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{editingCustomer?.name}</strong>? This action cannot be undone.
              Note: Customers with existing orders cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
