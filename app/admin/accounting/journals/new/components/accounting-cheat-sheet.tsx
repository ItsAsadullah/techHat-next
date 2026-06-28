'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen, Info } from 'lucide-react';

export function AccountingCheatSheet() {
  return (
    <Card className="border-l-4 border-l-blue-500 shadow-sm h-full">
      <CardHeader className="pb-3 bg-slate-50 border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Accounting Cheat Sheet</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800 font-medium">
            Golden Rule: Total Debit MUST equal Total Credit.
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800 text-sm">১. সম্পদ (Asset) ও খরচ (Expense):</h4>
          <ul className="text-sm space-y-1 text-slate-600 list-disc pl-5">
            <li><span className="font-medium text-emerald-600">বাড়লে:</span> Debit</li>
            <li><span className="font-medium text-rose-600">কমলে:</span> Credit</li>
          </ul>
          <p className="text-xs text-muted-foreground italic">উদাহরণ: Cash, Bank, Rent Expense, Salary Expense</p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-slate-800 text-sm">২. দায় (Liability), আয় (Revenue) ও মূলধন (Equity):</h4>
          <ul className="text-sm space-y-1 text-slate-600 list-disc pl-5">
            <li><span className="font-medium text-emerald-600">বাড়লে:</span> Credit</li>
            <li><span className="font-medium text-rose-600">কমলে:</span> Debit</li>
          </ul>
          <p className="text-xs text-muted-foreground italic">উদাহরণ: Accounts Payable, Sales, Investor Loan</p>
        </div>

        <hr />

        <div className="space-y-2">
          <h4 className="font-semibold text-slate-800 text-sm">Common Examples (সাধারণ উদাহরণ)</h4>
          <div className="bg-slate-100 p-2 rounded text-xs space-y-1">
            <p className="font-medium text-slate-700">ক্যাশ ইনভেস্টমেন্ট গ্রহণ (Receiving Cash Investment):</p>
            <p>Debit: Cash (সম্পদ বাড়লো)</p>
            <p>Credit: Investor Loan (দায় বাড়লো)</p>
          </div>
          <div className="bg-slate-100 p-2 rounded text-xs space-y-1">
            <p className="font-medium text-slate-700">দোকান ভাড়া প্রদান (Paying Rent in Cash):</p>
            <p>Debit: Rent Expense (খরচ বাড়লো)</p>
            <p>Credit: Cash (সম্পদ কমলো)</p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
