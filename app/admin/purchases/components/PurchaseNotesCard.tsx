import { FileText, Paperclip, Upload, X, File as FileIcon, ExternalLink } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { CldUploadWidget, type CloudinaryUploadWidgetOptions } from 'next-cloudinary';
import { useMemo } from 'react';
import Link from 'next/link';

interface PurchaseNotesCardProps {
  note: string;
  setNote: (note: string) => void;
  attachment?: string;
  setAttachment?: (url: string) => void;
}

export function PurchaseNotesCard({ note, setNote, attachment, setAttachment }: PurchaseNotesCardProps) {
  const uploadOptions = useMemo<CloudinaryUploadWidgetOptions>(() => ({
    multiple: false,
    resourceType: "auto",
    clientAllowedFormats: ["png", "jpeg", "jpg", "webp", "pdf"],
    folder: "purchases/vouchers",
    sources: ['local', 'camera', 'google_drive'],
  }), []);

  const handleSuccess = (result: any) => {
    if (typeof result.info === 'object' && result.info.secure_url) {
      if (setAttachment) setAttachment(result.info.secure_url);
    }
  };
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
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Paperclip className="w-3.5 h-3.5" /> Attachments
          </label>
          
          {attachment ? (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-md shrink-0">
                  <FileIcon className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">Voucher Document</p>
                  <Link href={attachment} target="_blank" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-0.5">
                    View full attachment <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setAttachment && setAttachment('')}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <CldUploadWidget
              signatureEndpoint="/api/cloudinary/sign"
              onSuccess={handleSuccess}
              options={uploadOptions}
            >
              {({ open }) => (
                <div 
                  onClick={() => open()}
                  className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-6 text-center hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors cursor-pointer group"
                >
                  <div className="mx-auto w-10 h-10 bg-gray-50 dark:bg-gray-900 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 flex items-center justify-center rounded-full mb-3 transition-colors">
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload voucher</p>
                  <p className="text-xs text-gray-400 mt-1">Invoice, Quotation, PDF or Image (Max 5MB)</p>
                </div>
              )}
            </CldUploadWidget>
          )}
        </div>
      </div>
    </div>
  );
}
