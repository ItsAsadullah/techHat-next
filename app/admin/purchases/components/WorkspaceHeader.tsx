import { ArrowLeft, Save, Loader2, Send, CheckCircle, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface WorkspaceHeaderProps {
  isEditMode: boolean;
  poNumber?: string;
  status?: string;
  loading: boolean;
  onDiscard: () => void;
  onSubmit: (status: 'DRAFT' | 'SUBMITTED' | 'APPROVED') => void;
}

export function WorkspaceHeader({ isEditMode, poNumber, status = 'DRAFT', loading, onDiscard, onSubmit }: WorkspaceHeaderProps) {
  const router = useRouter();

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-700';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex items-center justify-between sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 py-3 px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {isEditMode ? poNumber : 'New Purchase Order'}
            </h1>
            <Badge className={`rounded-md px-2 py-0.5 text-xs font-semibold ${getStatusColor(status)} shadow-none border-0`}>
              {status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditMode ? 'Manage procurement details.' : 'Create a new procurement request.'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" onClick={onDiscard} disabled={loading} className="text-gray-500 hover:text-gray-900">
          Discard
        </Button>
        
        {isEditMode && (
          <>
            <Button type="button" variant="outline" className="gap-2 shadow-sm">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button type="button" variant="outline" className="gap-2 shadow-sm">
              <Download className="w-4 h-4" /> PDF
            </Button>
          </>
        )}

        {isEditMode && (status === 'DRAFT' || status === 'SUBMITTED') && (
          <Button type="button" variant="outline" onClick={() => onSubmit(status as 'DRAFT' | 'SUBMITTED')} disabled={loading} className="gap-2 shadow-sm border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        )}

        {!isEditMode && status === 'DRAFT' && (
          <Button type="button" variant="outline" onClick={() => onSubmit('DRAFT')} disabled={loading} className="gap-2 shadow-sm border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </Button>
        )}

        {(status === 'DRAFT' || status === 'SUBMITTED') && (
          <Button type="button" onClick={() => onSubmit(status === 'DRAFT' ? 'SUBMITTED' : 'APPROVED')} disabled={loading} className="gap-2 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (status === 'DRAFT' ? <Send className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />)}
            {status === 'DRAFT' ? 'Submit PO' : 'Approve PO'}
          </Button>
        )}
      </div>
    </div>
  );
}
