'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Phone, Wallet, Receipt, FileText, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { getCustomerFullProfile } from '@/lib/actions/receivables-actions';
import { PaymentDrawer } from './payment-drawer';
import { toast } from 'sonner';

export function DueCollectionClient({ customer }: { customer: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [customer.id]);

  const loadProfile = async () => {
    setLoading(true);
    const res = await getCustomerFullProfile(customer.id);
    if (res.success) {
      setProfile(res.data);
    } else {
      toast.error('Failed to load profile');
    }
    setLoading(false);
  };

  const getCreditWarning = (c: any) => {
    if (!c || c.balance <= 0) return null;
    const score = c.creditScore ?? 100;
    const rating = c.creditRating ?? 'GOOD';
    if (rating === 'BLOCKED') return `⛔ এই কাস্টমার ক্রেডিট ব্লক। পূর্বের বাকি: ৳${c.balance.toLocaleString()}`;
    if (rating === 'RISKY') return `⚠️ ঝুঁকিপূর্ণ কাস্টমার। বাকি: ৳${c.balance.toLocaleString()}, স্কোর: ${score}`;
    if (c.creditLimit > 0 && c.balance >= c.creditLimit) return `🔴 ক্রেডিট লিমিট পার হয়েছে। বাকি: ৳${c.balance.toLocaleString()} / লিমিট: ৳${c.creditLimit.toLocaleString()}`;
    if (c.balance > 0) return `ℹ️ পূর্বের বাকি আছে: ৳${c.balance.toLocaleString()}। বিক্রি করা যাবে।`;
    return null;
  };

  const warningMsg = profile?.creditWarning || getCreditWarning(customer);

  return (
    <div className="space-y-6">
      {/* Top Warning Banner */}
      {warningMsg && (
        <div className={`p-4 rounded-md border flex items-start gap-3 ${customer.creditRating === 'BLOCKED' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'}`}>
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Credit Alert</h4>
            <p className="text-sm mt-1">{warningMsg}</p>
          </div>
        </div>
      )}

      {/* Customer Quick Summary Card */}
      <Card className="bg-slate-900 text-slate-50 border-slate-800 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="h-32 w-32" />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold border-2 border-slate-700">
                {customer.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
                <div className="flex items-center text-slate-400 gap-3 mt-1 text-sm">
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5"/> {customer.phone || 'No phone'}</span>
                  <span className="flex items-center gap-1">Score: {customer.creditScore ?? 100}/100</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 items-center">
              <div>
                <p className="text-slate-400 text-sm">Outstanding Due</p>
                <p className="text-2xl font-bold text-red-400">৳{customer.balance.toLocaleString()}</p>
              </div>
              <div className="hidden sm:block">
                <p className="text-slate-400 text-sm">Credit Limit</p>
                <p className="text-xl font-semibold">৳{customer.creditLimit.toLocaleString()}</p>
              </div>
              <Button 
                size="lg" 
                onClick={() => setPaymentDrawerOpen(true)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold text-base px-6 shadow-lg shadow-green-900/20 disabled:opacity-50"
              >
                <Wallet className="mr-2 h-5 w-5" />
                {loading ? 'Loading...' : 'Collect Payment'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS WORKSPACE */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border rounded-xl bg-gray-50/50">
          Loading financial data...
        </div>
      ) : profile ? (
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-5 h-12 items-center bg-slate-100 rounded-lg p-1">
          <TabsTrigger value="overview" className="h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Overview</TabsTrigger>
          <TabsTrigger value="outstanding" className="h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Outstanding Invoices</TabsTrigger>
          <TabsTrigger value="payments" className="h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Payments</TabsTrigger>
          <TabsTrigger value="ledger" className="h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Customer Ledger</TabsTrigger>
          <TabsTrigger value="statement" className="h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md">Statement</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground">Total Purchases</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">৳{customer.totalPurchase.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground">Total Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">৳{customer.totalPaid.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground">Avg. Payment Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{customer.paymentScore || 0} Days</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="outstanding">
             <Card>
               <CardHeader>
                 <CardTitle>Outstanding Invoices</CardTitle>
               </CardHeader>
               <CardContent>
                 {profile.outstandingInvoices.length === 0 ? (
                   <div className="text-center py-10 text-muted-foreground">No outstanding invoices.</div>
                 ) : (
                   <div className="border rounded-md overflow-hidden">
                     <table className="w-full text-sm">
                       <thead className="bg-slate-50 border-b">
                         <tr>
                           <th className="px-4 py-3 text-left font-medium">Invoice</th>
                           <th className="px-4 py-3 text-left font-medium">Date</th>
                           <th className="px-4 py-3 text-right font-medium">Total</th>
                           <th className="px-4 py-3 text-right font-medium">Paid</th>
                           <th className="px-4 py-3 text-right font-medium">Due</th>
                           <th className="px-4 py-3 text-center font-medium">Age</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y">
                         {profile.outstandingInvoices.map((inv: any) => (
                           <tr key={inv.id} className="hover:bg-slate-50">
                             <td className="px-4 py-3 font-medium">{inv.orderNumber}</td>
                             <td className="px-4 py-3">{new Date(inv.createdAt).toLocaleDateString()}</td>
                             <td className="px-4 py-3 text-right">৳{inv.grandTotal.toLocaleString()}</td>
                             <td className="px-4 py-3 text-right">৳{(inv.paidAmount || 0).toLocaleString()}</td>
                             <td className="px-4 py-3 text-right font-semibold text-red-600">৳{inv.dueAmount.toLocaleString()}</td>
                             <td className="px-4 py-3 text-center">
                               <Badge variant={inv.ageDays > 30 ? "destructive" : "secondary"}>
                                 {inv.ageDays} Days
                               </Badge>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="payments">
             <Card>
               <CardHeader>
                 <CardTitle>Recent Payments</CardTitle>
               </CardHeader>
               <CardContent>
                  {profile.recentPayments.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">No payment history.</div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Receipt</th>
                            <th className="px-4 py-3 text-left font-medium">Date</th>
                            <th className="px-4 py-3 text-left font-medium">Method</th>
                            <th className="px-4 py-3 text-right font-medium">Amount</th>
                            <th className="px-4 py-3 text-left font-medium pl-6">Allocations</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {profile.recentPayments.map((p: any) => (
                            <tr key={p.id}>
                              <td className="px-4 py-3 font-medium">{p.receiptNumber || p.paymentNumber}</td>
                              <td className="px-4 py-3">{new Date(p.paymentDate).toLocaleDateString()}</td>
                              <td className="px-4 py-3"><Badge variant="outline">{p.paymentMethod}</Badge></td>
                              <td className="px-4 py-3 text-right font-semibold text-green-600">৳{p.amount.toLocaleString()}</td>
                              <td className="px-4 py-3 pl-6 text-slate-500">
                                {p.allocations.map((a:any) => a.order.orderNumber).join(', ') || 'Advance/Unallocated'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="ledger">
             <Card>
               <CardHeader>
                 <CardTitle>Customer Ledger</CardTitle>
                 <CardDescription>Immutable record of all transactions</CardDescription>
               </CardHeader>
               <CardContent>
                  <div className="border rounded-md overflow-hidden">
                     <table className="w-full text-sm">
                       <thead className="bg-slate-50 border-b">
                         <tr>
                           <th className="px-4 py-3 text-left font-medium">Date</th>
                           <th className="px-4 py-3 text-left font-medium">Type</th>
                           <th className="px-4 py-3 text-left font-medium">Ref</th>
                           <th className="px-4 py-3 text-right font-medium">Debit (+)</th>
                           <th className="px-4 py-3 text-right font-medium">Credit (-)</th>
                           <th className="px-4 py-3 text-right font-medium">Balance</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y">
                         {profile.recentLedger.map((l: any) => (
                           <tr key={l.id} className="hover:bg-slate-50">
                             <td className="px-4 py-3 whitespace-nowrap">{new Date(l.date).toLocaleString()}</td>
                             <td className="px-4 py-3">
                                <Badge variant={l.type === 'Payment' ? 'outline' : 'secondary'} className={l.type === 'Payment' ? 'border-green-200 text-green-700 bg-green-50' : ''}>
                                  {l.type}
                                </Badge>
                             </td>
                             <td className="px-4 py-3">{l.referenceId}</td>
                             <td className="px-4 py-3 text-right">{l.debit > 0 ? `৳${l.debit.toLocaleString()}` : '-'}</td>
                             <td className="px-4 py-3 text-right text-green-600">{l.credit > 0 ? `৳${l.credit.toLocaleString()}` : '-'}</td>
                             <td className="px-4 py-3 text-right font-semibold">৳{l.runningBalance.toLocaleString()}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="statement">
            <Card>
               <CardHeader>
                 <CardTitle>Generate Statement</CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="text-muted-foreground mb-4">Generate and print a professional PDF statement for this customer.</p>
                 <Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Download Statement PDF</Button>
               </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
      ) : null}

      {profile && (
        <PaymentDrawer 
          open={paymentDrawerOpen} 
          onClose={() => { setPaymentDrawerOpen(false); loadProfile(); }} 
          customer={profile.customer}
          outstandingInvoices={profile.outstandingInvoices}
        />
      )}
    </div>
  );
}
