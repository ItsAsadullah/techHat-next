import { FileText, Paperclip } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface PurchaseNotesCardProps {
  note: string;
  setNote: (note: string) => void;
}

export function PurchaseNotesCard({ note, setNote }: PurchaseNotesCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm mt-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5 flex items-center gap-2">
        <FileText className="w-4 h-4" /> Purchase Notes & Terms
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Internal Notes</label>
          <Textarea 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            placeholder="Add internal references, terms & conditions, or instructions..." 
            className="min-h-[120px] bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-indigo-500"
          />
        </div>
        
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-2">
            <Paperclip className="w-3.5 h-3.5" /> Attachments
          </label>
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer">
            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">Invoice, Quotation, PDF (Max 5MB)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
