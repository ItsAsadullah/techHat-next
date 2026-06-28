'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CashFlowClientProps {
  data: {
    trend: any[];
    summary: {
      totalInflow: number;
      totalOutflow: number;
      netChange: number;
    }
  };
  currentPeriod: string;
}

export function CashFlowClient({ data, currentPeriod }: CashFlowClientProps) {
  const router = useRouter();

  const fmt = (val: number) => `৳${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handlePeriodChange = (val: string) => {
    router.push(`/admin/finance/cash-flow?period=${val}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cash Flow Visualization</h1>
          <p className="text-slate-500 text-sm mt-1">Track physical cash movement across your business</p>
        </div>
        
        <Tabs value={currentPeriod} onValueChange={handlePeriodChange}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-100 shadow-sm bg-green-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-green-100 text-green-600 rounded-full"><ArrowUpRight className="h-6 w-6" /></div>
            <div>
              <p className="text-xs text-green-600/80 font-bold uppercase tracking-wider">Total Cash In</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(data.summary.totalInflow)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-100 shadow-sm bg-red-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-red-100 text-red-600 rounded-full"><ArrowDownRight className="h-6 w-6" /></div>
            <div>
              <p className="text-xs text-red-600/80 font-bold uppercase tracking-wider">Total Cash Out</p>
              <p className="text-2xl font-bold text-slate-900">{fmt(data.summary.totalOutflow)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-100 shadow-sm bg-blue-50/50">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-full"><Wallet className="h-6 w-6" /></div>
            <div>
              <p className="text-xs text-blue-600/80 font-bold uppercase tracking-wider">Net Change</p>
              <p className={`text-2xl font-bold ${data.summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmt(data.summary.netChange)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Cash Flow Waterfall</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.trend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `৳${val/1000}k`} />
                <RechartsTooltip 
                  formatter={(value: any) => [`৳${(value || 0).toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                
                <Bar dataKey="cashIn" name="Cash Inflow" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="cashOut" name="Cash Outflow" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Line type="monotone" dataKey="netCash" name="Net Cash" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
