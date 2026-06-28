import { Metadata } from 'next';
import { BalanceSheetClient } from './balance-sheet-client';

export const metadata: Metadata = {
  title: 'Balance Sheet - TechHat',
  description: 'View the company balance sheet',
};

export default function BalanceSheetPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <BalanceSheetClient />
      </div>
    </div>
  );
}
