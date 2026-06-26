'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, User, Phone, Wallet, AlertCircle, ShieldAlert, CreditCard } from 'lucide-react';
import { DueCollectionClient } from './due-collection-client';

export function ReceivablesDashboardClient({ customers }: { customers: any[] }) {
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!search) return customers.filter(c => c.balance > 0).slice(0, 50);
    const lower = search.toLowerCase();
    return customers.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      (c.phone && c.phone.includes(lower))
    ).slice(0, 50);
  }, [customers, search]);

  const totalDue = useMemo(() => customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0), [customers]);
  const overdueCount = useMemo(() => customers.filter(c => c.balance > 0 && c.creditRating === 'RISKY' || c.creditRating === 'BLOCKED').length, [customers]);

  if (selectedCustomerId) {
    const selected = customers.find(c => c.id === selectedCustomerId);
    if (selected) {
      return (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setSelectedCustomerId(null)}>
            ← Back to Dashboard
          </Button>
          <DueCollectionClient customer={selected} />
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">৳{totalDue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From {customers.filter(c => c.balance > 0).length} customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risky Customers</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div>
              <CardTitle>Customer Accounts</CardTitle>
              <CardDescription>Search customers to manage credit and collect due</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search by name, phone..." 
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredCustomers.map(customer => (
              <div 
                key={customer.id}
                onClick={() => setSelectedCustomerId(customer.id)}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{customer.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {customer.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                  <div className="text-left sm:text-right flex-1 sm:flex-none">
                    <p className="text-sm text-gray-500">Balance</p>
                    <p className={`font-semibold ${customer.balance > 0 ? 'text-red-600' : customer.balance < 0 ? 'text-green-600' : ''}`}>
                      ৳{customer.balance.toLocaleString()}
                    </p>
                  </div>

                  <div className="hidden md:block text-right">
                    <p className="text-sm text-gray-500">Credit Limit</p>
                    <p className="font-medium text-gray-900">৳{customer.creditLimit.toLocaleString()}</p>
                  </div>

                  <div className="hidden lg:block w-24">
                     {customer.creditRating === 'EXCELLENT' && <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Excellent</Badge>}
                     {customer.creditRating === 'GOOD' && <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Good</Badge>}
                     {customer.creditRating === 'AVERAGE' && <Badge variant="outline" className="border-yellow-200 text-yellow-700 bg-yellow-50">Average</Badge>}
                     {customer.creditRating === 'RISKY' && <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Risky</Badge>}
                     {customer.creditRating === 'BLOCKED' && <Badge variant="destructive">Blocked</Badge>}
                  </div>

                  <Button size="sm">Workspace →</Button>
                </div>
              </div>
            ))}
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No customers found matching your search.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
