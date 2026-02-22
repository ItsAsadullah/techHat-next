'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { updateInvoiceSettings, type InvoiceSettings } from '@/lib/actions/invoice-settings-actions';
import ImageUpload from '@/components/ui/image-upload';
import { Loader2, Save, LayoutTemplate } from 'lucide-react';
import { InvoiceDesigner } from './invoice-designer';

const invoiceSchema = z.object({
  invoiceLogo: z.string().optional(),
  invoiceBackground: z.string().optional(),
  invoiceCompanyName: z.string().min(1, 'Company name is required'),
  invoiceCompanyAddress: z.string().optional(),
  invoiceCompanyPhone: z.string().optional(),
  invoiceCompanyEmail: z.string().optional(),
  invoiceFooterText: z.string().optional(),
  showLogo: z.boolean(),
  showBackground: z.boolean(),
  invoiceLayout: z.string().optional(),
  // Enhanced
  invoicePrefix: z.string().optional(),
  nextInvoiceNumber: z.string().optional(),
  showTax: z.boolean(),
  termsAndConditions: z.string().optional(),
  receiptWidth: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceSettingsClientProps {
  initialSettings: InvoiceSettings;
}

export function InvoiceSettingsClient({ initialSettings }: InvoiceSettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceLogo: initialSettings.invoiceLogo,
      invoiceBackground: initialSettings.invoiceBackground,
      invoiceCompanyName: initialSettings.invoiceCompanyName,
      invoiceCompanyAddress: initialSettings.invoiceCompanyAddress,
      invoiceCompanyPhone: initialSettings.invoiceCompanyPhone,
      invoiceCompanyEmail: initialSettings.invoiceCompanyEmail,
      invoiceFooterText: initialSettings.invoiceFooterText,
      showLogo: initialSettings.showLogo,
      showBackground: initialSettings.showBackground,
      invoiceLayout: initialSettings.invoiceLayout || '[]',
      // Enhanced
      invoicePrefix: initialSettings.invoicePrefix || 'INV-',
      nextInvoiceNumber: initialSettings.nextInvoiceNumber || '1001',
      showTax: initialSettings.showTax !== false,
      termsAndConditions: initialSettings.termsAndConditions || '',
      receiptWidth: initialSettings.receiptWidth || '80',
    },
  });

  async function onSubmit(data: InvoiceFormValues) {
    setLoading(true);
    try {
      const result = await updateInvoiceSettings({
        invoiceLogo: data.invoiceLogo,
        invoiceBackground: data.invoiceBackground,
        invoiceCompanyName: data.invoiceCompanyName,
        invoiceCompanyAddress: data.invoiceCompanyAddress || '',
        invoiceCompanyPhone: data.invoiceCompanyPhone || '',
        invoiceCompanyEmail: data.invoiceCompanyEmail || '',
        invoiceFooterText: data.invoiceFooterText || '',
        showLogo: data.showLogo,
        showBackground: data.showBackground,
        invoiceLayout: data.invoiceLayout || '[]',
        // Enhanced
        invoicePrefix: data.invoicePrefix,
        nextInvoiceNumber: data.nextInvoiceNumber,
        showTax: data.showTax,
        termsAndConditions: data.termsAndConditions,
        receiptWidth: data.receiptWidth,
      });

      if (result.success) {
        toast.success('Invoice settings updated successfully');
        setShowDesigner(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update settings');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const handleLayoutSave = (layout: string) => {
    form.setValue('invoiceLayout', layout);
    onSubmit(form.getValues());
  };

  if (showDesigner) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div>
            <h3 className="font-bold text-blue-900">Visual Designer</h3>
            <p className="text-sm text-blue-700">Drag items to position them on the invoice.</p>
          </div>
          <Button variant="outline" onClick={() => setShowDesigner(false)} className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
            Back to Settings
          </Button>
        </div>
        <InvoiceDesigner 
          settings={{
            ...initialSettings,
            invoiceLogo: form.watch('invoiceLogo') || '',
            invoiceBackground: form.watch('invoiceBackground') || '',
            showLogo: form.watch('showLogo') ?? true,
            showBackground: form.watch('showBackground') ?? false,
            invoiceCompanyName: form.watch('invoiceCompanyName') || '',
            invoiceCompanyAddress: form.watch('invoiceCompanyAddress') || '',
            invoiceCompanyPhone: form.watch('invoiceCompanyPhone') || '',
            invoiceCompanyEmail: form.watch('invoiceCompanyEmail') || '',
            invoiceFooterText: form.watch('invoiceFooterText') || '',
            invoiceLayout: form.watch('invoiceLayout') || '[]',
          }} 
          onSave={handleLayoutSave} 
        />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex justify-end mb-4">
             <Button type="button" onClick={() => setShowDesigner(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-md">
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Open Invoice Designer
             </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">Branding</h3>
            
            <FormField
              control={form.control}
              name="showLogo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show Logo</FormLabel>
                    <FormDescription>
                      Display your logo on the invoice header.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('showLogo') && (
              <FormField
                control={form.control}
                name="invoiceLogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value ? [field.value] : []}
                        onChange={(urls) => field.onChange(urls[urls.length - 1] || '')}
                        onRemove={() => field.onChange('')}
                        folder="invoices"
                      />
                    </FormControl>
                    <FormDescription>
                      Upload your company logo (Square or Landscape recommended).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="showBackground"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show Background</FormLabel>
                    <FormDescription>
                      Use a watermark or background pad design.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

             {form.watch('showBackground') && (
              <FormField
                control={form.control}
                name="invoiceBackground"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background Design (Pad)</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value ? [field.value] : []}
                        onChange={(urls) => field.onChange(urls[urls.length - 1] || '')}
                        onRemove={() => field.onChange('')}
                        folder="invoices"
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a background image/pad design (A4/Letter size ratio recommended).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">Company Details</h3>
            
            <FormField
              control={form.control}
              name="invoiceCompanyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="TechHat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceCompanyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Haildhani Bazar, Jhenaidah Sadar, Jhenaidah" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Company address</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceCompanyPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+8801911777694" {...field} />
                  </FormControl>
                  <FormDescription>Company phone number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceCompanyEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="techhat.shop@gmail.com" {...field} />
                  </FormControl>
                  <FormDescription>Company email address</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceFooterText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Text / Terms</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Thank you for your business!&#10;No returns after 7 days." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Terms, conditions, or thank you notes.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── Numbering, Tax & Receipt ─────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">Numbering</h3>

            <FormField
              control={form.control}
              name="invoicePrefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Prefix</FormLabel>
                  <FormControl>
                    <Input placeholder="INV-" {...field} className="max-w-xs" />
                  </FormControl>
                  <FormDescription>Prepended to invoice numbers (e.g. INV-, TH-)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextInvoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Invoice Number</FormLabel>
                  <FormControl>
                    <Input placeholder="1001" {...field} className="max-w-xs" />
                  </FormControl>
                  <FormDescription>The number part of the next generated invoice</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="receiptWidth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt Paper Width</FormLabel>
                  <FormControl>
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="58">58 mm (compact)</option>
                      <option value="80">80 mm (standard)</option>
                    </select>
                  </FormControl>
                  <FormDescription>Thermal printer receipt width</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showTax"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Show Tax on Invoice</FormLabel>
                    <FormDescription>Display tax line item on printed invoices</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2">Terms &amp; Conditions</h3>
            <FormField
              control={form.control}
              name="termsAndConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms &amp; Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="1. All sales are final.&#10;2. Returns accepted within 7 days with receipt."
                      className="min-h-[180px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Printed at the bottom of every invoice</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <Button type="submit" disabled={loading} className="min-w-[150px] bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
