import { AccountForm } from './components/account-form';

export default function NewAccountPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Account</h1>
        <p className="text-muted-foreground">Add a new account to the General Ledger</p>
      </div>

      <AccountForm />
    </div>
  );
}
