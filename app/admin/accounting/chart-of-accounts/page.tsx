// @ts-nocheck
import { getChartOfAccounts } from '@/lib/actions/accounting-actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import InitAccountsButton from './init-accounts-button';

export default async function ChartOfAccountsPage() {
  const res = await getChartOfAccounts();
  const accounts = res.success ? res.data : [];

  const groupedAccounts = accounts.reduce((acc: any, account: any) => {
    if (!acc[account.type]) acc[account.type] = [];
    acc[account.type].push(account);
    return acc;
  }, {});

  const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-muted-foreground">Manage your general ledger accounts and track balances</p>
        </div>
        {accounts.length === 0 && <InitAccountsButton />}
      </div>

      <div className="space-y-8">
        {accountTypes.map((type) => {
          const typeAccounts = groupedAccounts[type] || [];
          if (typeAccounts.length === 0) return null;

          const totalBalance = typeAccounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);

          return (
            <Card key={type}>
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {type}
                    <Badge variant="outline" className="text-xs font-normal">{typeAccounts.length} accounts</Badge>
                  </CardTitle>
                  <div className="text-lg font-bold">
                    ৳{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Current Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeAccounts.map((acc: any) => (
                      <TableRow key={acc.id}>
                        <TableCell className="font-mono text-muted-foreground">{acc.code}</TableCell>
                        <TableCell className="font-medium">{acc.name}</TableCell>
                        <TableCell className="text-right font-medium text-indigo-600 dark:text-indigo-400">
                          ৳{(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
