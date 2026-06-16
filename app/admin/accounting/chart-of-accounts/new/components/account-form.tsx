'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { createChartOfAccount } from '@/lib/actions/accounting-actions';

export function AccountForm() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | ''>('');

  const onSubmit = async () => {
    if (!code || !name || !type) {
      toast.error('Validation Error', { description: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    const res = await createChartOfAccount({ code, name, type });
    setLoading(false);

    if (res.success) {
      toast.success('Account created successfully');
      router.push('/admin/accounting/chart-of-accounts');
    } else {
      toast.error('Error', { description: res.error });
    }
  };

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Account Code</Label>
            <Input 
              placeholder="e.g., 1000, 2000, 5010" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">Unique identifier for this account.</p>
          </div>

          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ASSET">Asset (Cash, Inventory, Receivables)</SelectItem>
                <SelectItem value="LIABILITY">Liability (Payables, Loans)</SelectItem>
                <SelectItem value="EQUITY">Equity (Owner's Equity, Retained Earnings)</SelectItem>
                <SelectItem value="REVENUE">Revenue (Sales, Income)</SelectItem>
                <SelectItem value="EXPENSE">Expense (COGS, Rent, Salaries)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Account Name</Label>
          <Input 
            placeholder="e.g., Cash in Hand, Inventory Asset, Cost of Goods Sold" 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={onSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Create Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
