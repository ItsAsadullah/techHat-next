'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { createJournalEntry } from '@/lib/actions/accounting-actions';
import { format } from 'date-fns';

type JournalItem = { accountId: string; description: string; debit: number; credit: number };
type Account = { id: string; code: string; name: string };

export function JournalForm({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  
  const [items, setItems] = useState([
    { accountId: '', description: '', debit: 0, credit: 0 },
    { accountId: '', description: '', debit: 0, credit: 0 }
  ]);

  useEffect(() => {
    const handleAiFill = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      if (!data) return;
      
      if (data.date) setDate(data.date);
      if (data.reference) setReference(data.reference);
      if (data.notes) setNotes(data.notes);
      
      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        // Ensure missing fields are populated
        const formattedItems: JournalItem[] = data.items.map((item: Partial<JournalItem>) => ({
          accountId: item.accountId || '',
          description: item.description || '',
          debit: Number(item.debit) || 0,
          credit: Number(item.credit) || 0,
        }));
        setItems(formattedItems);
      }
      
      toast.success('Form magically auto-filled by AI! 🪄');
    };

    window.addEventListener('ai-fill-journal', handleAiFill);
    return () => window.removeEventListener('ai-fill-journal', handleAiFill);
  }, []);

  const handleAddItem = () => setItems([...items, { accountId: '', description: '', debit: 0, credit: 0 }]);
  const handleRemoveItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleItemChange = (index: number, field: keyof JournalItem, value: string | number) => {
    const newItems = [...items] as JournalItem[];
    (newItems[index] as Record<string, string | number>)[field] = value;
    
    // Auto-balance logic: if typing in debit, clear credit and vice versa
    if (field === 'debit' && typeof value === 'number' && value > 0) newItems[index].credit = 0;
    if (field === 'credit' && typeof value === 'number' && value > 0) newItems[index].debit = 0;
    
    setItems(newItems);
  };

  const totalDebit = items.reduce((sum, item) => sum + (item.debit || 0), 0);
  const totalCredit = items.reduce((sum, item) => sum + (item.credit || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  const onSubmit = async () => {
    if (!isBalanced) {
      toast.error('Imbalanced Entry', { description: 'Debits must equal credits.' });
      return;
    }

    const validItems = items.filter(i => i.accountId && (i.debit > 0 || i.credit > 0));
    if (validItems.length < 2) {
      toast.error('Validation Error', { description: 'At least two account entries are required.' });
      return;
    }

    setLoading(true);
    const res = await createJournalEntry({
      reference,
      date: new Date(date),
      notes,
      journalEntryItems: validItems
    });
    setLoading(false);

    if (res.success) {
      toast.success('Journal Entry Created');
      router.push('/admin/accounting/journals');
    } else {
      toast.error('Error', { description: res.error });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transaction Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reference No. (Optional)</Label>
              <Input placeholder="Invoice #, Receipt #, etc." value={reference} onChange={e => setReference(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Transaction description..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Journal Lines</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-2" /> Add Line
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden md:grid grid-cols-12 gap-4 mb-2 text-sm font-medium text-muted-foreground px-4">
            <div className="col-span-5">Account</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2 text-right">Debit (৳)</div>
            <div className="col-span-2 text-right">Credit (৳)</div>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 md:p-0 border rounded-lg md:border-none md:rounded-none bg-muted/10 md:bg-transparent relative group">
              <div className="md:col-span-5 space-y-2 md:space-y-0">
                <Label className="md:hidden">Account</Label>
                <Select value={item.accountId} onValueChange={(val) => handleItemChange(index, 'accountId', val)}>
                  <SelectTrigger><SelectValue placeholder="Select Account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3 space-y-2 md:space-y-0">
                <Label className="md:hidden">Description</Label>
                <Input placeholder="Line description..." value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
              </div>

              <div className="md:col-span-2 space-y-2 md:space-y-0">
                <Label className="md:hidden">Debit</Label>
                <Input type="number" min="0" step="0.01" value={item.debit || ''} onChange={e => handleItemChange(index, 'debit', parseFloat(e.target.value) || 0)} className="text-right" placeholder="0.00" />
              </div>

              <div className="md:col-span-2 space-y-2 md:space-y-0 flex gap-2">
                <div className="flex-1">
                  <Label className="md:hidden">Credit</Label>
                  <Input type="number" min="0" step="0.01" value={item.credit || ''} onChange={e => handleItemChange(index, 'credit', parseFloat(e.target.value) || 0)} className="text-right" placeholder="0.00" />
                </div>
                {items.length > 2 && (
                  <Button type="button" variant="ghost" size="icon" className="md:opacity-0 group-hover:opacity-100 mt-6 md:mt-0" onClick={() => handleRemoveItem(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          <div className="border-t pt-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 font-bold">
              <div className="col-span-8 text-right hidden md:block">Total</div>
              <div className={`md:col-span-2 text-right ${isBalanced ? 'text-foreground' : 'text-red-500'}`}>
                <span className="md:hidden mr-2">Total Debit:</span>
                ৳{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className={`md:col-span-2 text-right ${isBalanced ? 'text-foreground' : 'text-red-500'}`}>
                <span className="md:hidden mr-2">Total Credit:</span>
                ৳{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          
          {!isBalanced && (
            <div className="flex items-center gap-2 justify-end text-red-500 text-sm mt-2 font-medium px-4">
              <AlertTriangle className="h-4 w-4" />
              Out of balance by ৳{difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={onSubmit} disabled={loading || !isBalanced || totalDebit === 0}>
          <Save className="h-4 w-4 mr-2" />
          Save Journal Entry
        </Button>
      </div>
    </div>
  );
}
