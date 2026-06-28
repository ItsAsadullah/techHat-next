import { Metadata } from 'next';
import { IncomeStatementClient } from './income-statement-client';

export const metadata: Metadata = {
  title: 'Income Statement (P&L) - TechHat',
  description: 'View profit and loss statement',
};

export default function IncomeStatementPage() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <IncomeStatementClient />
      </div>
    </div>
  );
}
