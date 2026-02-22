'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  LayoutGrid,
  DollarSign,
  Package,
  Tags,
  ListChecks,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Info,
  Settings,
  ScanLine,
  QrCode,
  Link as LinkIcon,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Upload,
  ChevronsUpDown,
  Check,
  Star,
  GripVertical,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createProduct, updateProduct } from '@/lib/actions/product-actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import CategoryHierarchy from '@/components/admin/category-hierarchy';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { useScanner } from '@/lib/hooks/use-scanner';
import { getSpecTemplates, getSavedTemplates, createSavedTemplate, deleteSavedTemplate } from '@/lib/actions/spec-actions';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ProductPreviewModal } from './product-preview-modal';

// Zod Schema
import { BrandCombobox } from '@/components/admin/brand-combobox';
import { MediaLibrary } from '@/components/admin/media-library';

// Zod Schema
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional().or(z.literal('')),
  productType: z.enum(['simple', 'variable']),
  unit: z.string(),
  videoUrl: z.string().optional().or(z.literal('')),
  warrantyMonths: z.number(),
  warrantyType: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
  isFlashSale: z.boolean(),
  description: z.string().optional().or(z.literal('')),
  // Pricing
  costPrice: z.number().min(0),
  expense: z.number(),
  price: z.number().min(0),
  offerPrice: z.number().optional(),
  sku: z.string().optional().or(z.literal('')),
  upc: z.string().optional().or(z.literal('')),
  // Inventory
  stock: z.number().min(0),
  minStock: z.number(),
  hasSerial: z.boolean(),
  // Dynamic Fields (Managed by state, but included here for type safety)
  serials: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  categories: any[];
  brands: any[];
  attributesList: any[];
  initialData?: any;
}

interface Attribute {
  id: string; // temporary id for the row
  attributeId?: number; // db id
  name: string;
  values: string[]; // comma separated values for now or array
}

interface Variation {
  id: string;
  name: string;
  sku: string;
  upc: string;
  cost: number;
  expense: number;
  price: number;
  offerPrice: number;
  stock: number;
  hasSerial: boolean;
  serials: string[];
  image?: string; // Preview URL
  productImageId?: string; // Link to gallery image
  attributes?: Record<string, string>;
}

interface GalleryImage {
  id: string;
  url: string;
  file?: File;
  isThumbnail: boolean;
}

interface Spec {
  id: string;
  key: string;
  value: string;
}

export default function ProductForm({ categories: initialCategories, brands: initialBrands, attributesList, initialData }: ProductFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [brands, setBrands] = useState(initialBrands);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Custom States for dynamic sections
  const [attributes, setAttributes] = useState<Attribute[]>(initialData?.attributes || []);
  const [variations, setVariations] = useState<Variation[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([{ id: '1', key: '', value: '' }]);
  const [templateSpecs, setTemplateSpecs] = useState<{id: string, name: string, value: string}[]>([]);
  
  // Custom Templates State
  const [savedTemplates, setSavedTemplates] = useState<{id: string, name: string, keys: string[]}[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);

  // Gallery State
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [currentVariationIndex, setCurrentVariationIndex] = useState<number | null>(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, message, onConfirm });
  };

  // Load Saved Templates
  useEffect(() => {
    async function loadSaved() {
      try {
        const templates = await getSavedTemplates();
        console.log('Saved templates loaded:', templates);
        setSavedTemplates(templates);
      } catch (err) {
        console.error('Failed to load saved templates:', err);
      }
    }
    loadSaved();
  }, []);

  // Load Initial Data
  useEffect(() => {
    if (initialData) {
      console.log('Loading initial data:', initialData);
      
      // 1. Attributes
      if (initialData.attributes && Array.isArray(initialData.attributes)) {
          setAttributes(initialData.attributes);
      }

      // 2. Variations
      if (initialData.variants && initialData.variants.length > 0) {
          if (initialData.productVariantType === 'variable') {
              const mappedVariations = initialData.variants.map((v: any) => ({
                  id: v.id,
                  name: v.name,
                  sku: v.sku || '',
                  upc: v.upc || '',
                  cost: v.costPrice || 0,
                  expense: v.expense || 0,
                  price: v.price || 0,
                  offerPrice: v.offerPrice || 0,
                  stock: v.stock || 0,
                  hasSerial: v.hasSerial || false,
                  serials: v.serials?.map((s: any) => s.serialNumber) || [],
                  image: v.image || '',
                  productImageId: v.productImageId || '',
                  attributes: v.attributes || {},
              }));
              setVariations(mappedVariations);
          } else {
              // Simple product serials
              if (initialData.variants[0].serials) {
                  setSerials(initialData.variants[0].serials.map((s: any) => s.serialNumber));
              }
          }
      }

      // 3. Specs (Custom) - We'll filter out template specs later if needed
      // For now, load non-template specs here? 
      // Actually, let's load all specs into `specs` temporarily, and cleanup duplicates in template effect?
      // Or better: Load all into `specs` and if they match a template, move them?
      // Simplest: Just load everything into `specs` that ISN'T likely a template?
      // No, we should wait for templates to load.
      // Let's just load them all into `specs` for now. 
      if (initialData.productSpecs && initialData.productSpecs.length > 0) {
          const loadedSpecs = initialData.productSpecs.map((s: any) => ({
              id: s.id,
              key: s.name,
              value: s.value
          }));
          setSpecs(loadedSpecs);
      }

      // 4. Gallery
      if (initialData.images && initialData.images.length > 0) {
          setGalleryImages(initialData.images.map((img: any) => ({
              id: img.id,
              url: img.url,
              isThumbnail: img.isThumbnail,
              file: undefined
          })));
      }
    }
  }, [initialData]);

  const handleLoadTemplate = () => {
    if (!selectedTemplateId) return;
    const template = savedTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    // Append keys to specs if they don't exist
    const currentKeys = new Set(specs.map(s => s.key));
    const newSpecs = [...specs];
    
    template.keys.forEach(key => {
        if (!currentKeys.has(key)) {
            newSpecs.push({ id: Math.random().toString(36).substr(2, 9), key: key, value: '' });
        }
    });
    
    // Remove empty initial row if it exists and we added new ones
    if (newSpecs.length > 1 && newSpecs[0].key === '' && newSpecs[0].value === '') {
       // Filter out empty rows instead of just shifting, to be safe
       const filtered = newSpecs.filter(s => s.key !== '' || s.value !== '');
       if (filtered.length > 0) setSpecs(filtered);
       else setSpecs(newSpecs); // Keep it if all empty
    } else {
       setSpecs(newSpecs);
    }
  };

  const handleSaveTemplate = async () => {
      if (!newTemplateName.trim()) return;
      
      // Collect all keys from current specs
      const keys = specs.map(s => s.key).filter(k => k.trim() !== '');
      if (keys.length === 0) {
          toast.warning('প্রথমে কিছু স্পেসিফিকেশন যোগ করুন।');
          return;
      }

      const result = await createSavedTemplate(newTemplateName, keys);
      if (result.success) {
          setSavedTemplates([...savedTemplates, result.template]);
          setNewTemplateName('');
          setIsSaveTemplateOpen(false);
          toast.success('টেমপ্লেট সফলভাবে সেভ হয়েছে!');
      } else {
          toast.error(result.error || 'টেমপ্লেট সেভ করতে ব্যর্থ হয়েছে।');
      }
  };

  const handleDeleteTemplate = async () => {
      if (!selectedTemplateId) return;
      showConfirm(
        'টেমপ্লেট ডিলেট করুন',
        'আপনি কি নিশ্চিত এই টেমপ্লেটটি ডিলেট করতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।',
        async () => {
          const result = await deleteSavedTemplate(selectedTemplateId);
          if (result.success) {
              setSavedTemplates(savedTemplates.filter(t => t.id !== selectedTemplateId));
              setSelectedTemplateId('');
              toast.success('টেমপ্লেট সফলভাবে ডিলেট হয়েছে।');
          } else {
              toast.error('টেমপ্লেট ডিলেট করতে ব্যর্থ হয়েছে।');
          }
        }
      );
  };

  const [serials, setSerials] = useState<string[]>([]);
  const [duplicateSerial, setDuplicateSerial] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [scannerMode, setScannerMode] = useState<'serial' | 'barcode' | 'sku'>('barcode');

  // We remove local useScanner hook and use the global one implicitly via inputs
  // But we still need to handle specific logic if we want "Scan" buttons to focus the right field
  
  const focusInput = (name: any) => {
      const input = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
      if (input) {
          input.focus();
          // Optional: Highlight it briefly
          input.classList.add('ring-2', 'ring-blue-500');
          setTimeout(() => input.classList.remove('ring-2', 'ring-blue-500'), 1000);
      }
  };
  
  // Custom Scanner Handlers for buttons
  // Instead of starting a new session, we just focus the input and let the global scanner type into it
  const generateSKU = () => {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix = watchedValues.name ? watchedValues.name.substring(0, 3).toUpperCase() : 'PRD';
    const sku = `${prefix}-${random}`;
    setValue('sku', sku, { shouldValidate: true });
  };

  const handleScanClick = (fieldName: string) => {
      focusInput(fieldName);
      toast.info("Ready to scan. Use your connected phone.");
  };

  // Generate QR code when scanner session starts
  // We don't need this anymore as it's global in the header
  /* 
  useEffect(() => { ... }, [scanner.scannerUrl]);
  */

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      categoryId: initialData?.categoryId || '',
      brandId: initialData?.brandId || '',
      productType: initialData?.productVariantType || 'simple',
      unit: initialData?.unit || 'pc',
      videoUrl: initialData?.videoUrl || '',
      warrantyMonths: initialData?.warrantyMonths || 0,
      warrantyType: initialData?.warrantyType || '',
      isActive: initialData?.isActive ?? true,
      isFlashSale: initialData?.isFlashSale ?? false,
      description: initialData?.description || '',
      costPrice: initialData?.costPrice || 0,
      expense: initialData?.variants?.[0]?.expense || 0,
      price: initialData?.price || 0,
      offerPrice: initialData?.offerPrice || 0,
      sku: initialData?.sku || '',
      upc: initialData?.variants?.[0]?.upc || initialData?.barcode || '',
      stock: initialData?.stock || 0,
      minStock: initialData?.minStock || 5,
      hasSerial: initialData?.variants?.[0]?.hasSerial || false,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watchedValues = watch();

  // Load spec templates on category change
  useEffect(() => {
    async function loadTemplates() {
      console.log('Category changed:', watchedValues.categoryId);
      if (!watchedValues.categoryId) {
        setTemplateSpecs([]);
        return;
      }
      
      try {
        const templates = await getSpecTemplates(watchedValues.categoryId);
        console.log('Loaded templates:', templates);
        if (templates && templates.length > 0) {
          
          // If initialData matches this category, pre-fill values
          let mappedTemplates;
          
          if (initialData && initialData.categoryId === watchedValues.categoryId && initialData.productSpecs) {
              const specsSource = initialData.productSpecs;
              mappedTemplates = templates.map(t => {
                 const found = specsSource.find((s: any) => s.name === t.name);
                 return {
                    id: t.id,
                    name: t.name,
                    value: found ? found.value : ''
                 };
              });
              
              // Remove these from Custom Specs list if they exist there
              const templateNames = new Set(templates.map(t => t.name));
              setSpecs(prev => prev.filter(s => !templateNames.has(s.key)));
              
          } else {
              mappedTemplates = templates.map(t => ({
                id: t.id,
                name: t.name,
                value: ''
              }));
          }

          setTemplateSpecs(mappedTemplates);
        } else {
          setTemplateSpecs([]);
        }
      } catch (e) {
        console.error("Failed to load templates", e);
      }
    }
    loadTemplates();
  }, [watchedValues.categoryId, initialData]);

  // When hasSerial is ON for simple product, auto-calculate stock from serial count
  useEffect(() => {
    if (watchedValues.hasSerial && watchedValues.productType === 'simple') {
      const filledSerials = serials.filter(s => s.trim().length > 0).length;
      setValue('stock', filledSerials);
    }
  }, [serials, watchedValues.hasSerial, watchedValues.productType, setValue]);

  // Profit Calculation
  const calculateProfit = (cost = 0, expense = 0, price = 0, offer = 0) => {
    const effectivePrice = offer > 0 ? offer : price;
    const totalCost = cost + expense;
    const profit = effectivePrice - totalCost;
    const margin = effectivePrice > 0 ? (profit / effectivePrice) * 100 : 0;
    return { totalCost, profit, margin };
  };

  const mainProfit = calculateProfit(
    Number(watchedValues.costPrice),
    Number(watchedValues.expense),
    Number(watchedValues.price),
    Number(watchedValues.offerPrice)
  );

  // Attribute Handlers
  const addAttribute = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setAttributes([...attributes, { id, name: '', values: [] }]);
  };

  const removeAttribute = (index: number) => {
    const newAttrs = [...attributes];
    newAttrs.splice(index, 1);
    setAttributes(newAttrs);
  };

  const handleAttributeSelect = (index: number, attrIdStr: string) => {
    const attrId = parseInt(attrIdStr);
    const selectedAttr = attributesList?.find(a => a.id === attrId);
    if (!selectedAttr) return;

    // Check duplication
    if (attributes.some((a, i) => i !== index && a.attributeId === attrId)) {
      // toast.error("Attribute already added");
      return; 
    }
    
    const newAttrs = [...attributes];
    newAttrs[index] = {
        ...newAttrs[index],
        attributeId: selectedAttr.id,
        name: selectedAttr.name,
        values: [],
    };
    setAttributes(newAttrs);
  };

  const handleValueSelect = (index: number, value: string) => {
    setAttributes(prev => {
        const newAttrs = [...prev];
        // Deep copy the specific attribute object to ensure React detects change
        newAttrs[index] = { ...newAttrs[index] };
        
        const currentValues = newAttrs[index].values || [];
        if (currentValues.includes(value)) {
            newAttrs[index].values = currentValues.filter(v => v !== value);
        } else {
            newAttrs[index].values = [...currentValues, value];
        }
        return newAttrs;
    });
  };

  const generateVariations = () => {
    if (attributes.length === 0) return;
    
    // Cartesian product of attribute values
    const cartesian = (args: string[][]) => args.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]] as string[][]);
    
    const attrValues = attributes.filter(a => a.values.length > 0).map(a => a.values);
    if (attrValues.length === 0) return;

    const combinations = cartesian(attrValues);
    const activeAttributes = attributes.filter(a => a.values.length > 0);
    
    const newVariations = combinations.map(combo => {
      // Map combo values back to attribute names
      const variantAttributes: Record<string, string> = {};
      activeAttributes.forEach((attr, idx) => {
          variantAttributes[attr.name] = combo[idx];
      });

      // Check if this variation involves "Color"
      // We assume if one of the values matches a color value, or the attribute is named "Color"
      const prefix = watchedValues.name ? watchedValues.name.substring(0, 3).toUpperCase() : 'PRD';
      const randomSKU = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: combo.join(' / '),
        sku: `${prefix}-${randomSKU}`,
        upc: '',
        cost: Number(watchedValues.costPrice) || 0,
        expense: Number(watchedValues.expense) || 0,
        price: Number(watchedValues.price) || 0,
        offerPrice: Number(watchedValues.offerPrice) || 0,
        stock: 0,
        hasSerial: false,
        serials: [],
        image: '',
        productImageId: '',
        attributes: variantAttributes,
      };
    });

    setVariations(newVariations);
  };

  const generateAllVariantSKUs = () => {
    const productName = watchedValues.name || 'PRD';
    setVariations(prev => prev.map(v => {
      if (v.sku && v.sku.trim() !== '') return v;
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const prefix = productName.substring(0, 3).toUpperCase();
      return {
        ...v,
        sku: `${prefix}-${random}`
      };
    }));
    toast.success("Generated SKUs for empty fields");
  };
  
  const handleGalleryUpload = (files: FileList | null) => {
     if (!files) return;
     const newImages: GalleryImage[] = Array.from(files).map(file => ({
         id: Math.random().toString(36).substr(2, 9),
         url: URL.createObjectURL(file),
         file: file,
         isThumbnail: galleryImages.length === 0 && Array.from(files).indexOf(file) === 0 // Make first image thumbnail if none exists
     }));
     
     // If we already have images, check if we have a thumbnail
     const hasThumbnail = galleryImages.some(img => img.isThumbnail);
     if (!hasThumbnail && newImages.length > 0) {
         newImages[0].isThumbnail = true;
     }

     setGalleryImages([...galleryImages, ...newImages]);
  };

  const handleLibrarySelect = (url: string) => {
      const newImage: GalleryImage = {
          id: Math.random().toString(36).substr(2, 9),
          url: url,
          isThumbnail: galleryImages.length === 0,
          file: undefined
      };
      setGalleryImages([...galleryImages, newImage]);
  };

  const removeGalleryImage = (id: string) => {
      const newImages = galleryImages.filter(img => img.id !== id);
      // If we removed the thumbnail, make the first one thumbnail
      if (galleryImages.find(img => img.id === id)?.isThumbnail && newImages.length > 0) {
          newImages[0].isThumbnail = true;
      }
      setGalleryImages(newImages);
      
      // Also update variations that were using this image
      setVariations(prev => prev.map(v => 
          v.productImageId === id ? { ...v, productImageId: '', image: '' } : v
      ));
  };

  const setThumbnail = (id: string) => {
      setGalleryImages(prev => prev.map(img => ({
          ...img,
          isThumbnail: img.id === id
      })));
  };

  const selectImageForVariation = (variationIndex: number, imageId: string) => {
      const image = galleryImages.find(img => img.id === imageId);
      if (!image) return;

      const newVariations = [...variations];
      newVariations[variationIndex] = {
          ...newVariations[variationIndex],
          productImageId: imageId,
          image: image.url
      };
      setVariations(newVariations);
      setIsImageSelectorOpen(false);
      setCurrentVariationIndex(null);
  };

  // Variation serial handlers
  const addSerialToVariation = (variationId: string) => {
    setVariations(prev => prev.map(v => 
      v.id === variationId ? { ...v, serials: [...v.serials, ''] } : v
    ));
  };

  const updateVariationSerial = (variationId: string, serialIndex: number, value: string) => {
    setVariations(prev => prev.map(v => 
      v.id === variationId ? { 
        ...v, 
        serials: v.serials.map((s, i) => i === serialIndex ? value : s) 
      } : v
    ));
  };

  const removeSerialFromVariation = (variationId: string, serialIndex: number) => {
    setVariations(prev => prev.map(v => 
      v.id === variationId ? { 
        ...v, 
        serials: v.serials.filter((_, i) => i !== serialIndex) 
      } : v
    ));
  };

  const toggleVariationSerial = (variationId: string, enabled: boolean) => {
    setVariations(prev => prev.map(v => 
      v.id === variationId ? { 
        ...v, 
        hasSerial: enabled,
        serials: enabled ? v.serials : [],
        stock: enabled ? v.serials.filter(s => s.trim().length > 0).length : v.stock,
      } : v
    ));
  };

  // Clean up object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      // Cleanup logic if needed
      galleryImages.forEach(img => {
          if (img.url.startsWith('blob:')) {
              URL.revokeObjectURL(img.url);
          }
      });
    };
  }, []); // Only run on mount/unmount to avoid revoking active URLs

  // Collect all unique spec keys from saved templates for dropdown suggestions
  const allSpecKeys = Array.from(
    new Set(
      savedTemplates.flatMap(t => t.keys).concat(templateSpecs.map(t => t.name))
    )
  ).sort();

  // Track which spec row's popover is open
  const [specKeyPopoverOpen, setSpecKeyPopoverOpen] = useState<string | null>(null);
  
  // Drag and drop state for specs
  const [draggedSpecIndex, setDraggedSpecIndex] = useState<number | null>(null);

  // Spec Handlers
  const addSpecRow = () => {
    setSpecs([...specs, { id: Math.random().toString(36).substr(2, 9), key: '', value: '' }]);
  };

  const removeSpecRow = (index: number) => {
    const newSpecs = [...specs];
    newSpecs.splice(index, 1);
    setSpecs(newSpecs);
  };

  const updateSpec = (index: number, field: keyof Spec, value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };
  
  // Drag and drop handlers for specs
  const handleSpecDragStart = (index: number) => {
    setDraggedSpecIndex(index);
  };
  
  const handleSpecDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSpecIndex === null || draggedSpecIndex === index) return;
    
    const newSpecs = [...specs];
    const draggedItem = newSpecs[draggedSpecIndex];
    newSpecs.splice(draggedSpecIndex, 1);
    newSpecs.splice(index, 0, draggedItem);
    
    setSpecs(newSpecs);
    setDraggedSpecIndex(index);
  };
  
  const handleSpecDragEnd = () => {
    setDraggedSpecIndex(null);
  };

  const updateTemplateSpec = (index: number, value: string) => {
    const newTemplates = [...templateSpecs];
    newTemplates[index].value = value;
    setTemplateSpecs(newTemplates);
  };

  async function onSubmit(data: ProductFormValues, shouldRedirect: boolean | any = true) {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Product-level fields only
      formData.append('name', data.name);
      formData.append('categoryId', data.categoryId);
      formData.append('brandId', data.brandId || '');
      formData.append('productType', data.productType);
      formData.append('unit', data.unit);
      formData.append('videoUrl', data.videoUrl || '');
      formData.append('warrantyMonths', data.warrantyMonths.toString());
      formData.append('warrantyType', data.warrantyType || '');
      formData.append('isActive', data.isActive.toString());
      formData.append('isFlashSale', data.isFlashSale.toString());
      formData.append('description', data.description || '');

      // Specs
      const validSpecs = specs.filter(s => s.key.trim() !== '');
      const specsRecord = validSpecs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
      
      const templateSpecsRecord = templateSpecs.reduce((acc, curr) => {
          if (curr.value.trim() !== '') {
              // @ts-ignore
              acc[curr.name] = curr.value;
          }
          return acc;
      }, {});

      const finalSpecs = { ...templateSpecsRecord, ...specsRecord };
      formData.append('specifications', JSON.stringify(finalSpecs));

      // Build variations — every product gets at least one variation
      if (data.productType === 'simple') {
        const filledSerials = serials.filter(s => s.trim().length > 0);
        
        // Auto-generate SKU if empty
        let finalSku = data.sku;
        if (!finalSku || finalSku.trim() === '') {
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            const prefix = data.name ? data.name.substring(0, 3).toUpperCase() : 'PRD';
            finalSku = `${prefix}-${random}`;
        }

        // Append SKU to formData for Product model
        formData.append('sku', finalSku);

        const defaultVariation = {
          name: 'Default',
          sku: finalSku,
          upc: data.upc || '',
          cost: data.costPrice,
          expense: data.expense,
          price: data.price,
          offerPrice: data.offerPrice || 0,
          stock: data.hasSerial ? filledSerials.length : data.stock,
          hasSerial: data.hasSerial,
          serials: data.hasSerial ? filledSerials : [],
          // Simple product just uses the main thumbnail or first image
          productImageId: galleryImages.find(img => img.isThumbnail)?.id || (galleryImages.length > 0 ? galleryImages[0].id : undefined)
        };
        formData.append('variations', JSON.stringify([defaultVariation]));
      } else {
        // Variable product — send all variations with their serials
        const variationsData = variations.map((v, index) => {
           // Auto-generate SKU if empty
           let finalSku = v.sku;
           if (!finalSku || finalSku.trim() === '') {
               const random = Math.random().toString(36).substring(2, 8).toUpperCase();
               const prefix = data.name ? data.name.substring(0, 3).toUpperCase() : 'PRD';
               finalSku = `${prefix}-${random}`;
           }

           return {
            ...v,
            sku: finalSku,
            stock: v.hasSerial ? v.serials.filter(s => s.trim().length > 0).length : v.stock,
            serials: v.hasSerial ? v.serials.filter(s => s.trim().length > 0) : [],
            image: undefined, // Don't send blob url
            // Send linkage
            productImageId: v.productImageId,
            attributes: v.attributes,
          };
        });
        formData.append('variations', JSON.stringify(variationsData));
        formData.append('attributes', JSON.stringify(attributes));
      }

      // Append Gallery Images
      // We need to send files and metadata to link them
      galleryImages.forEach((img, index) => {
          if (img.file) {
              formData.append(`gallery_file_${index}`, img.file);
          }
      });
      
      const galleryMetadata = galleryImages.map((img, index) => ({
          id: img.id,
          isThumbnail: img.isThumbnail,
          fileKey: img.file ? `gallery_file_${index}` : undefined,
          url: img.file ? undefined : img.url // If it's an existing URL (future edit mode)
      }));
      formData.append('gallery_metadata', JSON.stringify(galleryMetadata));

      let result;
      if (initialData && initialData.id) {
        result = await updateProduct(initialData.id, formData);
      } else {
        result = await createProduct(formData);
      }

      if (result.success) {
        setDuplicateSerial(null);
        
        // If shouldRedirect is true or an event object (default submit), redirect
        if (shouldRedirect === true || (typeof shouldRedirect === 'object' && shouldRedirect !== null)) {
            toast.success(initialData ? 'প্রোডাক্ট সফলভাবে আপডেট হয়েছে! ✅' : 'প্রোডাক্ট সফলভাবে তৈরি হয়েছে! ✅');
            setTimeout(() => router.push('/admin/products'), 800);
        } else {
            // Draft save behavior - stay on page
             toast.success('ড্রাফট সেভ হয়েছে! আপনি এডিট চালিয়ে যেতে পারেন।');
             // If new product was created as draft, switch to edit mode URL to keep working
             if (!initialData && (result as any).product?.id) {
                 router.replace(`/admin/products/edit/${(result as any).product.id}`);
             }
        }
      } else {
        console.error('Failed to save product:', result.error);
        
        // If there's a duplicate serial, highlight it and switch to inventory tab
        if ((result as any).duplicateSerial) {
          setDuplicateSerial((result as any).duplicateSerial);
          setActiveTab('inventory');
        }
        
        toast.error(`❌ ${result.error || 'অজানা এরর ঘটেছে'}`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(`একটি এরর হয়েছে: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveDraft = handleSubmit(async (data) => {
    // Force isActive to false for draft
    const draftData = { ...data, isActive: false };
    // Pass false to prevent redirect
    await onSubmit(draftData, false);
  });

  const handlePreview = () => {
     setIsPreviewOpen(true);
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      onKeyDown={(e) => {
        // Prevent accidental form submission on Enter, but allow it in Textarea and ContentEditable (RichText)
        if (
          e.key === 'Enter' && 
          (e.target as HTMLElement).tagName !== 'TEXTAREA' && 
          !(e.target as HTMLElement).isContentEditable
        ) {
          e.preventDefault();
        }
      }}
      className="min-h-screen bg-gray-50/30 dark:bg-gray-950 pb-20"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                type="button" 
                onClick={() => router.back()}
                className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full h-10 w-10 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-3 text-gray-900">
                  {initialData ? 'Edit Product' : 'Add New Product'}
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                    {initialData ? 'Active' : 'Draft'}
                  </Badge>
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <span>Products</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>{initialData ? 'Edit' : 'Create'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={handlePreview} className="border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white font-semibold shadow-sm bg-white dark:bg-gray-800">
                <ScanLine className="h-4 w-4 mr-2" /> Preview
              </Button>
              <Button type="button" variant="outline" onClick={handleSaveDraft} className="border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white font-semibold shadow-sm bg-white dark:bg-gray-800">
                <Save className="h-4 w-4 mr-2" /> Save Draft
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md border-0 font-bold px-8 tracking-wide transition-all active:scale-95"
              >
                {loading ? 'Saving...' : (initialData ? 'Update Product' : 'Publish Product')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          
          {/* Navigation Tabs */}
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="inline-flex h-auto p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm min-w-full md:min-w-0">
              {[
                { id: 'general', label: 'General', icon: Info, color: 'text-blue-600' },
                { id: 'pricing', label: 'Pricing', icon: DollarSign, color: 'text-green-600' },
                { id: 'inventory', label: 'Inventory', icon: Package, color: 'text-orange-600', badge: watchedValues.hasSerial && watchedValues.stock > 0 ? watchedValues.stock : null },
                { id: 'attributes', label: 'Attributes', icon: Tags, color: 'text-purple-600' },
                { id: 'specifications', label: 'Specifications', icon: ListChecks, color: 'text-indigo-600' },
                { id: 'media', label: 'Media', icon: ImageIcon, color: 'text-pink-600' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 transition-all data-[state=active]:bg-gray-50 dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 data-[state=active]:shadow-sm data-[state=active]:ring-1 data-[state=active]:ring-gray-200 dark:data-[state=active]:ring-gray-600"
                >
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? tab.color : 'text-gray-400'}`} />
                  {tab.label}
                  {tab.badge && (
                    <span className="ml-1 bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {tab.badge}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="grid grid-cols-1 gap-8">
            
            {/* Tab 1: General */}
            <TabsContent value="general" className="m-0 space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Left: Basic Information */}
                <div className="space-y-8">
                  <Card className="border-0 shadow-md ring-1 ring-gray-100 bg-white overflow-hidden rounded-2xl h-full">
                    <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Info className="h-5 w-5 text-blue-500" /> Basic Information
                      </CardTitle>
                      <CardDescription>Enter the core details of your product</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></label>
                        <Textarea 
                          {...register('name')} 
                          placeholder="e.g. Wireless Noise Cancelling Headphones" 
                          className="min-h-[3rem] text-lg bg-gray-50/50 border-gray-200 focus:bg-white transition-all resize-none py-3" 
                          rows={2}
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
                          <input type="hidden" {...register('categoryId')} />
                          <CategoryHierarchy 
                            initialCategories={categories}
                            onCategorySelect={(id) => setValue('categoryId', id, { shouldValidate: true })}
                          />
                          {errors.categoryId && <span className="text-red-500 text-xs">{errors.categoryId.message}</span>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Brand</label>
                          <BrandCombobox
                            brands={brands}
                            value={watchedValues.brandId}
                            onValueChange={(id) => setValue('brandId', id)}
                            onBrandsUpdate={setBrands}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Right: Organization */}
                <div className="space-y-8">
                  <Card className="border-0 shadow-md ring-1 ring-gray-100 bg-white overflow-hidden rounded-2xl h-full">
                    <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-gray-600" /> Organization
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700">Product Type</label>
                        <div className="grid grid-cols-2 gap-3">
                          <div 
                            className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-200 ${watchedValues.productType === 'simple' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/50 ring-1 ring-blue-500 shadow-sm' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`} 
                            onClick={() => setValue('productType', 'simple')}
                          >
                            <div className="font-semibold text-sm text-gray-900">Simple</div>
                            <div className="text-xs text-gray-500 mt-1">One version</div>
                            {watchedValues.productType === 'simple' && <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-blue-500" />}
                          </div>
                          <div 
                            className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-200 ${watchedValues.productType === 'variable' ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/50 ring-1 ring-blue-500 shadow-sm' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`} 
                            onClick={() => setValue('productType', 'variable')}
                          >
                            <div className="font-semibold text-sm text-gray-900">Variable</div>
                            <div className="text-xs text-gray-500 mt-1">Colors/Sizes</div>
                            {watchedValues.productType === 'variable' && <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-blue-500" />}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Unit</label>
                              <Input {...register('unit')} placeholder="pc, kg..." className="h-10 bg-gray-50/50" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">Warranty (Mo)</label>
                              <Input type="number" {...register('warrantyMonths', { valueAsNumber: true })} placeholder="0" className="h-10 bg-gray-50/50" />
                            </div>
                          </div>
                          
                          <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">Active Status</div>
                              <div className="text-xs text-gray-500">Visible in store</div>
                            </div>
                            <Switch 
                              checked={watchedValues.isActive}
                              onCheckedChange={(checked) => setValue('isActive', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="text-sm font-medium text-gray-900">Flash Sale</div>
                              <div className="text-xs text-gray-500">Promotional badge</div>
                            </div>
                            <Switch 
                              checked={watchedValues.isFlashSale}
                              onCheckedChange={(checked) => setValue('isFlashSale', checked)}
                            />
                          </div>
                          </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bottom: Description - Full Width */}
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-md ring-1 ring-gray-100 bg-white overflow-hidden rounded-2xl">
                    <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5 text-blue-500" /> Description
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <RichTextEditor 
                        value={watchedValues.description || ''}
                        onChange={(val) => setValue('description', val)}
                        placeholder="Write detailed features here..." 
                      />
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Info className="h-3 w-3" /> Supports formatting & images</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab 2: Pricing */}
            <TabsContent value="pricing" className="m-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <Card className="border-0 shadow-md ring-1 ring-gray-100 bg-white overflow-hidden rounded-2xl">
                <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-4">
                   <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" /> Pricing Strategy
                      </CardTitle>
                   </div>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  {watchedValues.productType === 'variable' && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Info className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 text-sm">Variable Pricing</h4>
                        <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                          These prices will act as defaults. You can set specific prices for each variation (e.g. Red-XL) in the <span className="font-semibold cursor-pointer underline" onClick={() => setActiveTab('attributes')}>Attributes</span> tab.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Cost Price</label>
                      <div className="relative group">
                        <span className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-green-600 transition-colors">৳</span>
                        <Input type="number" className="pl-8 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" {...register('costPrice', { valueAsNumber: true })} step="0.01" />
                      </div>
                      <p className="text-[10px] text-gray-500">Your buying price</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Expenses</label>
                      <div className="relative group">
                        <span className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-green-600 transition-colors">৳</span>
                        <Input type="number" className="pl-8 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" {...register('expense', { valueAsNumber: true })} step="0.01" />
                      </div>
                      <p className="text-[10px] text-gray-500">Shipping, tax, etc.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-900">Selling Price</label>
                      <div className="relative group">
                        <span className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-green-600 transition-colors">৳</span>
                        <Input type="number" className="pl-8 h-11 border-green-200 bg-green-50/30 focus:bg-white focus:border-green-500 focus:ring-green-500/20" {...register('price', { valueAsNumber: true })} step="0.01" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Offer Price</label>
                      <div className="relative group">
                        <span className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-green-600 transition-colors">৳</span>
                        <Input type="number" className="pl-8 h-11 bg-gray-50/50 border-gray-200 focus:bg-white" {...register('offerPrice', { valueAsNumber: true })} step="0.01" />
                      </div>
                    </div>
                  </div>

                  {/* Profit Visualizer */}
                  <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-900 rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-200">
                      <div className="pb-4 md:pb-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Total Cost</div>
                        <div className="text-2xl font-bold text-gray-700">৳ {mainProfit.totalCost.toFixed(2)}</div>
                        <div className="text-xs text-gray-400 mt-1">Cost + Expense</div>
                      </div>
                      <div className="py-4 md:py-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Net Profit</div>
                        <div className={`text-2xl font-bold ${mainProfit.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ৳ {mainProfit.profit.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Per unit sold</div>
                      </div>
                      <div className="pt-4 md:pt-0">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Margin</div>
                        <div className={`text-2xl font-bold ${mainProfit.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {mainProfit.margin.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Return on sales</div>
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Inventory */}
            <TabsContent value="inventory" className="m-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              {watchedValues.productType === 'variable' ? (
                <Card className="border-0 shadow-md ring-1 ring-gray-100 bg-white overflow-hidden rounded-2xl">
                  <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Package className="h-5 w-5 text-orange-500" /> Inventory Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Info className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-900 text-base">Managed Per Variation</h4>
                        <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                          Stock quantities, SKU codes, UPC barcodes, and serial number tracking for variable products are configured individually per variation.
                          Go to the <span className="font-semibold cursor-pointer underline" onClick={() => setActiveTab('attributes')}>Attributes</span> tab to manage inventory for each variation.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <Card className="border-0 shadow-md ring-1 ring-gray-100 bg-white overflow-hidden rounded-2xl h-full">
                    <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-4">
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Package className="h-5 w-5 text-orange-500" /> Stock Control
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-8">
                      {/* SKU & UPC for simple product */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">SKU Code</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={generateSKU} className="text-xs text-purple-600 hover:text-purple-700 font-medium">Auto Generate</button>
                                <span className="text-gray-300">|</span>
                                <button type="button" onClick={() => handleScanClick('sku')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Focus to Scan</button>
                            </div>
                          </div>
                          <Input {...register('sku')} placeholder="Leave empty to auto-generate" className="h-11 bg-gray-50/50" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Barcode / UPC</label>
                            <button type="button" onClick={() => handleScanClick('upc')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">Focus to Scan</button>
                          </div>
                          <Input {...register('upc')} placeholder="Scan or enter barcode" className="h-11 bg-gray-50/50" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Stock Quantity</label>
                          <Input type="number" {...register('stock', { valueAsNumber: true })} disabled={watchedValues.hasSerial} className={`h-12 text-lg font-mono border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 ${watchedValues.hasSerial ? 'bg-gray-100 dark:bg-gray-700/50 cursor-not-allowed' : 'bg-gray-50/50'}`} />
                          {watchedValues.hasSerial && <p className="text-xs text-orange-600">Auto-calculated from serial count</p>}
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Low Stock Alert</label>
                          <Input type="number" {...register('minStock', { valueAsNumber: true })} className="h-12 bg-gray-50/50 border-gray-200 focus:bg-white" />
                        </div>
                      </div>

                      <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5 flex items-center justify-between">
                         <div className="space-y-1">
                           <div className="font-semibold text-gray-900 flex items-center gap-2">
                             Unique Identifiers
                             <Badge variant="outline" className="text-xs font-normal bg-white dark:bg-gray-700 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-400">IMEI / Serial</Badge>
                           </div>
                           <div className="text-sm text-gray-500">Enable if you need to track specific items sold</div>
                         </div>
                         <Switch 
                            checked={watchedValues.hasSerial}
                            onCheckedChange={(checked) => setValue('hasSerial', checked)}
                            className="data-[state=checked]:bg-orange-500"
                          />
                      </div>

                      {watchedValues.hasSerial && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-200 flex justify-between items-center backdrop-blur-sm sticky top-0">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              <ListChecks className="h-4 w-4 text-gray-500" /> Recorded Serials
                            </h4>
                            <span className="text-xs font-medium bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 shadow-sm">
                              {serials.filter(s => s.trim().length > 0).length} entered
                            </span>
                          </div>
                          <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 bg-white">
                            {serials.map((serial, index) => {
                              const isDuplicate = duplicateSerial && serial.trim() === duplicateSerial;
                              return (
                              <div key={index} className="flex items-center gap-3 group">
                                <span className="text-xs font-mono text-gray-400 w-8 text-right pt-2">{index + 1}</span>
                                <div className="relative flex-1">
                                  <Input 
                                    value={serial} 
                                    onChange={(e) => {
                                      const newSerials = [...serials];
                                      newSerials[index] = e.target.value;
                                      setSerials(newSerials);
                                      // Clear duplicate error when user starts editing
                                      if (duplicateSerial) setDuplicateSerial(null);
                                    }}
                                    placeholder={`Enter Serial / IMEI #${index + 1}`}
                                    className={`h-10 pr-10 font-mono text-sm transition-colors ${
                                      isDuplicate 
                                        ? 'bg-red-50 border-red-300 ring-2 ring-red-200 focus:ring-red-300' 
                                        : 'bg-gray-50 group-hover:bg-white dark:bg-gray-800 dark:group-hover:bg-gray-700 border-gray-200 dark:border-gray-600'
                                    }`}
                                  />
                                  {isDuplicate ? (
                                    <div className="absolute right-3 top-2 flex items-center gap-1">
                                      <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded">DUPLICATE</span>
                                    </div>
                                  ) : serial && (
                                    <CheckCircle2 className="h-4 w-4 text-green-500 absolute right-3 top-3 animate-in zoom-in duration-200" />
                                  )}
                                </div>
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setSerials(prev => prev.filter((_, i) => i !== index))}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )})}
                            {serials.length === 0 && (
                              <div className="text-center py-10 text-gray-400">
                                <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Click &quot;Add Serial&quot; to start tracking individual units</p>
                              </div>
                            )}
                          </div>
                          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50">
                            <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setSerials(prev => [...prev, ''])}>
                              <Plus className="h-4 w-4 mr-2" /> Add Serial
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-8">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6">
                     <div className="flex items-start gap-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                           <ScanLine className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                           <h4 className="font-semibold text-blue-900 text-base">Global Scanner Ready</h4>
                           <p className="text-sm text-blue-700 mt-1 leading-relaxed">
                              The scanner is now located in the top navigation bar. Connect once and use it everywhere.
                              <br/>
                              Simply click into any field (SKU, UPC, Serial) and scan with your phone.
                           </p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
              )}
            </TabsContent>

            {/* Tab 4: Attributes */}
            <TabsContent value="attributes" className="m-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <Card className="border-0 shadow-md ring-1 ring-gray-100 bg-white overflow-hidden rounded-2xl min-h-[500px]">
                <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Tags className="h-5 w-5 text-purple-500" /> Product Variations
                    </CardTitle>
                    {watchedValues.productType === 'variable' && (
                       <Button type="button" onClick={addAttribute} size="sm" variant="outline" className="bg-white dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 border-gray-200 dark:border-gray-600">
                         <Plus className="h-4 w-4 mr-2" /> Add New Attribute
                       </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                   {watchedValues.productType === 'simple' ? (
                     <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto">
                        <div className="bg-yellow-50 p-4 rounded-full mb-4">
                          <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Simple Product Mode</h3>
                        <p className="text-gray-500 mb-6 leading-relaxed">
                          Attributes and variations are only available for variable products. 
                          Convert this product to add colors, sizes, or other options.
                        </p>
                        <Button 
                          type="button"
                          className="bg-gray-900 text-white hover:bg-gray-800"
                          onClick={() => setValue('productType', 'variable')}
                        >
                          Convert to Variable Product
                        </Button>
                     </div>
                   ) : (
                     <div className="space-y-10">
                       {/* Attribute Definitions */}
                       <div className="space-y-4">
                         {attributes.map((attr, index) => (
                         <div key={attr.id} className="flex flex-col md:flex-row gap-4 items-start p-4 bg-gray-50/50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700 group hover:border-purple-200 dark:hover:border-purple-700 transition-colors">
                             <div className="w-full md:w-1/4">
                               <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Attribute Name</label>
                               <Select 
                                 value={attr.attributeId?.toString()} 
                                 onValueChange={(val) => handleAttributeSelect(index, val)}
                               >
                                 <SelectTrigger className="bg-white dark:bg-gray-800 dark:border-gray-600">
                                   <SelectValue placeholder="Select Attribute" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   {attributesList?.map((a) => (
                                     <SelectItem key={a.id} value={a.id.toString()}>
                                       {a.name}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                             </div>
                             <div className="flex-1 w-full">
                               <label className="text-xs font-semibold text-gray-500 mb-1.5 block uppercase tracking-wider">Values</label>
                               
                               <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      role="combobox"
                                      className="w-full justify-between bg-white dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200 font-normal"
                                    >
                                     {attr.values.length > 0
                                       ? `${attr.values.length} selected`
                                       : "Select values..."}
                                     <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                   </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-[300px] p-0" align="start">
                                   <Command>
                                     <CommandInput placeholder="Search values..." />
                                     <CommandList>
                                       <CommandEmpty>No value found.</CommandEmpty>
                                       <CommandGroup>
                                          {attr.attributeId && attributesList?.find(a => a.id === attr.attributeId)?.values.map((val: any) => {
                                             const isSelected = attr.values.includes(val.value);
                                             return (
                                               <CommandItem
                                                 key={val.id}
                                                 value={val.value}
                                                 keywords={[val.value]}
                                                 onSelect={() => {
                                                   handleValueSelect(index, val.value);
                                                 }}
                                                 className="cursor-pointer data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                               >
                                                 <div className={cn(
                                                   "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                   isSelected
                                                     ? "bg-primary text-primary-foreground"
                                                     : "opacity-50 [&_svg]:invisible"
                                                 )}>
                                                   <Check className={cn("h-4 w-4")} />
                                                 </div>
                                                 <span>{val.value}</span>
                                                 {val.colorCode && (
                                                   <span className="ml-auto w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: val.colorCode }} />
                                                 )}
                                               </CommandItem>
                                             );
                                           })}
                                        </CommandGroup>
                                     </CommandList>
                                   </Command>
                                 </PopoverContent>
                               </Popover>
                               
                               {/* Selected Values Chips */}
                               <div className="flex flex-wrap gap-1 mt-2">
                                 {attr.values.map(v => (
                                   <Badge key={v} variant="secondary" className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                     {v}
                                     <button type="button" onClick={() => handleValueSelect(index, v)} className="ml-1 text-gray-400 hover:text-red-500">
                                       <X className="h-3 w-3" />
                                     </button>
                                   </Badge>
                                 ))}
                               </div>
                             </div>
                             <Button 
                               type="button"
                               variant="ghost" 
                               size="icon" 
                               className="mt-6 text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors"
                               onClick={() => removeAttribute(index)}
                             >
                               <Trash2 className="h-5 w-5" />
                             </Button>
                           </div>
                         ))}
                         
                         {attributes.length === 0 && (
                           <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/30 dark:bg-gray-800/30">
                             <p className="text-gray-400 italic">No attributes defined yet.</p>
                           </div>
                         )}

                         {attributes.length > 0 && (
                            <div className="flex justify-end pt-2">
                               <Button type="button" onClick={generateVariations} className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200">
                                 <Settings className="h-4 w-4 mr-2" /> Generate Variations from Attributes
                               </Button>
                            </div>
                         )}
                       </div>

                       {/* Generated Variations */}
                       {variations.length > 0 && (
                         <div className="space-y-6">
                           <div className="flex justify-between items-center">
                               <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                 <ListChecks className="h-4 w-4 text-gray-500" /> 
                                 Generated Variations ({variations.length})
                               </h3>
                               <Button type="button" variant="outline" size="sm" onClick={generateAllVariantSKUs} className="text-xs h-8">
                                   <Sparkles className="h-3 w-3 mr-2" /> Auto-Fill SKUs
                               </Button>
                           </div>
                           <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-800">
                             <div className="overflow-x-auto">
                               <Table>
                                 <TableHeader className="bg-gray-50/80">
                                   <TableRow>
                                     <TableHead className="font-semibold w-[80px]">Image</TableHead>
                                    <TableHead className="font-semibold min-w-[140px]">Variant</TableHead>
                                    <TableHead className="font-semibold min-w-[120px]">SKU</TableHead>
                                     <TableHead className="font-semibold min-w-[120px]">UPC</TableHead>
                                     <TableHead className="font-semibold min-w-[100px]">Cost</TableHead>
                                     <TableHead className="font-semibold min-w-[100px]">Expense</TableHead>
                                     <TableHead className="font-semibold min-w-[100px]">Price</TableHead>
                                     <TableHead className="font-semibold min-w-[100px]">Offer</TableHead>
                                     <TableHead className="font-semibold min-w-[90px]">Stock</TableHead>
                                     <TableHead className="font-semibold min-w-[70px] text-center">Serial</TableHead>
                                     <TableHead className="w-[50px]"></TableHead>
                                   </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                   {variations.map((variant, idx) => (
                                      <TableRow key={variant.id} className="hover:bg-gray-50/50">
                                        <TableCell>
                                          <div 
                                              className="relative w-10 h-10 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:border-blue-300"
                                              onClick={() => {
                                                  setCurrentVariationIndex(idx);
                                                  setIsImageSelectorOpen(true);
                                              }}
                                          >
                                              {variant.image ? (
                                                  <img src={variant.image} className="w-full h-full object-cover" />
                                              ) : (
                                                  <ImageIcon className="h-4 w-4 text-gray-400" />
                                              )}
                                              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-purple-700 whitespace-nowrap">{variant.name}</TableCell>
                                        <TableCell>
                                         <Input className="h-9 text-sm bg-white border-gray-200 min-w-[100px]" placeholder="SKU" value={variant.sku} onChange={(e) => { const v = [...variations]; v[idx].sku = e.target.value; setVariations(v); }} />
                                       </TableCell>
                                       <TableCell>
                                         <Input className="h-9 text-sm bg-white border-gray-200 min-w-[100px]" placeholder="UPC" value={variant.upc} onChange={(e) => { const v = [...variations]; v[idx].upc = e.target.value; setVariations(v); }} />
                                       </TableCell>
                                       <TableCell>
                                         <div className="relative">
                                           <span className="absolute left-2 top-2 text-gray-400 text-xs">৳</span>
                                           <Input 
                                             type="number" 
                                             className="h-9 text-sm pl-5 bg-white border-gray-200 w-24" 
                                             value={variant.cost || ''} 
                                             onFocus={(e) => e.target.select()}
                                             onChange={(e) => { const v = [...variations]; v[idx].cost = Number(e.target.value) || 0; setVariations(v); }} 
                                           />
                                         </div>
                                       </TableCell>
                                       <TableCell>
                                         <div className="relative">
                                           <span className="absolute left-2 top-2 text-gray-400 text-xs">৳</span>
                                           <Input 
                                             type="number" 
                                             className="h-9 text-sm pl-5 bg-white border-gray-200 w-24" 
                                             value={variant.expense || ''} 
                                             onFocus={(e) => e.target.select()}
                                             onChange={(e) => { const v = [...variations]; v[idx].expense = Number(e.target.value) || 0; setVariations(v); }} 
                                           />
                                         </div>
                                       </TableCell>
                                       <TableCell>
                                         <div className="relative">
                                           <span className="absolute left-2 top-2 text-gray-400 text-xs">৳</span>
                                           <Input 
                                             type="number" 
                                             className="h-9 text-sm pl-5 bg-white border-gray-200 w-24" 
                                             value={variant.price || ''} 
                                             onFocus={(e) => e.target.select()}
                                             onChange={(e) => { const v = [...variations]; v[idx].price = Number(e.target.value) || 0; setVariations(v); }} 
                                           />
                                         </div>
                                       </TableCell>
                                       <TableCell>
                                         <div className="relative">
                                           <span className="absolute left-2 top-2 text-gray-400 text-xs">৳</span>
                                           <Input 
                                             type="number" 
                                             className="h-9 text-sm pl-5 bg-white border-gray-200 w-24" 
                                             value={variant.offerPrice || ''} 
                                             onFocus={(e) => e.target.select()}
                                             onChange={(e) => { const v = [...variations]; v[idx].offerPrice = Number(e.target.value) || 0; setVariations(v); }} 
                                           />
                                         </div>
                                       </TableCell>
                                       <TableCell>
                                         {variant.hasSerial ? (
                                           <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                                             {variant.serials.filter(s => s.trim()).length}
                                           </Badge>
                                         ) : (
                                           <Input 
                                             type="number" 
                                             className="h-9 text-sm bg-white border-gray-200 w-20" 
                                             value={variant.stock || ''} 
                                             onFocus={(e) => e.target.select()}
                                             onChange={(e) => { const v = [...variations]; v[idx].stock = Number(e.target.value) || 0; setVariations(v); }} 
                                           />
                                         )}
                                       </TableCell>
                                       <TableCell className="text-center">
                                         <Switch 
                                           checked={variant.hasSerial} 
                                           onCheckedChange={(checked) => toggleVariationSerial(variant.id, checked)} 
                                           className="data-[state=checked]:bg-orange-500" 
                                         />
                                       </TableCell>
                                       <TableCell>
                                         <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-100" onClick={() => { const v = [...variations]; v.splice(idx, 1); setVariations(v); }}>
                                           <X className="h-5 w-5" />
                                         </Button>
                                       </TableCell>
                                     </TableRow>
                                   ))}
                                 </TableBody>
                               </Table>
                             </div>
                           </div>

                           {/* Serial input sections for variations with hasSerial enabled */}
                           {variations.some(v => v.hasSerial) && (
                             <div className="space-y-4">
                               <h4 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
                                 <ListChecks className="h-4 w-4 text-orange-500" /> Serial Numbers by Variation
                               </h4>
                               {variations.filter(v => v.hasSerial).map(variant => (
                                 <div key={variant.id} className="border border-orange-200 rounded-xl overflow-hidden bg-orange-50/30">
                                   <div className="bg-orange-50 px-4 py-3 border-b border-orange-200 flex justify-between items-center">
                                     <h5 className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                                       {variant.name}
                            <Badge variant="secondary" className="bg-white dark:bg-gray-700 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700 text-xs">
                                         {variant.serials.filter(s => s.trim()).length} serials
                                       </Badge>
                                     </h5>
                                     <Button type="button" variant="outline" size="sm" className="h-7 text-xs border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => addSerialToVariation(variant.id)}>
                                       <Plus className="h-3 w-3 mr-1" /> Add
                                     </Button>
                                   </div>
                                   <div className="p-4 space-y-2 max-h-[250px] overflow-y-auto">
                                     {variant.serials.map((serial, sIdx) => {
                                       const isDuplicate = duplicateSerial && serial.trim() === duplicateSerial;
                                       return (
                                       <div key={sIdx} className="flex items-center gap-2">
                                         <span className="text-xs font-mono text-gray-400 w-6 text-right">{sIdx + 1}</span>
                                         <Input 
                                           value={serial} 
                                           onChange={(e) => {
                                             updateVariationSerial(variant.id, sIdx, e.target.value);
                                             if (duplicateSerial) setDuplicateSerial(null);
                                           }}
                                           placeholder={`Serial #${sIdx + 1}`} 
                                           className={`h-8 text-sm font-mono flex-1 ${
                                             isDuplicate 
                                               ? 'bg-red-50 border-red-300 ring-2 ring-red-200 focus:ring-red-300' 
                                               : ''
                                           }`}
                                         />
                                         {isDuplicate ? (
                                           <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded shrink-0">DUPLICATE</span>
                                         ) : serial && (
                                           <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                         )}
                                         <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600" onClick={() => removeSerialFromVariation(variant.id, sIdx)}>
                                           <X className="h-3 w-3" />
                                         </Button>
                                       </div>
                                     )})}
                                     {variant.serials.length === 0 && (
                                       <p className="text-center text-sm text-gray-400 py-4">No serials added yet. Click &quot;Add&quot; to start tracking.</p>
                                     )}
                                   </div>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Specifications */}
            <TabsContent value="specifications" className="m-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <Card className="border-0 shadow-md ring-1 ring-gray-100 bg-white overflow-hidden rounded-2xl min-h-[500px]">
                <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-indigo-500" /> Technical Specifications
                    </CardTitle>
                    {/* Only show Add Row if we want to allow custom specs always, which we do */}
                  </div>
                </CardHeader>
                <CardContent className="pt-8">
                   <div className="bg-indigo-50/30 rounded-2xl border border-indigo-100 p-6 space-y-8">
                      
                      {/* Template Management Section */}
                      <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm">
                        <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                          <Package className="h-4 w-4 text-indigo-500" /> Specification Templates
                        </h5>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 space-y-1.5 w-full">
                            <label className="text-xs font-medium text-gray-500">Select Template</label>
                            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                              <SelectTrigger className="bg-gray-50 border-gray-200">
                                <SelectValue placeholder="Choose a template..." />
                              </SelectTrigger>
                              <SelectContent>
                                {savedTemplates.length > 0 ? (
                                  savedTemplates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="none" disabled>No templates saved</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              onClick={handleLoadTemplate}
                              disabled={!selectedTemplateId}
                              variant="outline"
                              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            >
                              <Upload className="h-4 w-4 mr-2" /> Load Template
                            </Button>
                            
                            {selectedTemplateId && (
                                <Button 
                                  type="button" 
                                  onClick={handleDeleteTemplate}
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            )}

                            <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
                              <DialogTrigger asChild>
                                <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                  <Save className="h-4 w-4 mr-2" /> Save as Template
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Save Specification Template</DialogTitle>
                                  <DialogDescription>
                                    Save the current custom specification keys as a reusable template.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <label className="text-sm font-medium mb-2 block">Template Name</label>
                                  <Input 
                                    value={newTemplateName} 
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    placeholder="e.g. Gaming Laptop Specs"
                                  />
                                </div>
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setIsSaveTemplateOpen(false)}>Cancel</Button>
                                  <Button type="button" onClick={handleSaveTemplate} className="bg-indigo-600 text-white">Save Template</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <div className="bg-indigo-100 p-2 rounded-lg">
                            <Lightbulb className="h-5 w-5 text-indigo-600" />
                         </div>
                         <div>
                            <h4 className="font-semibold text-indigo-900 text-sm">Feature Highlights</h4>
                            <p className="text-xs text-indigo-700 mt-0.5">Use this section to list detailed technical specs like Processor, RAM, Material, Dimensions etc.</p>
                         </div>
                      </div>

                      {/* Template Specs Section */}
                      {watchedValues.categoryId && templateSpecs.length === 0 && (
                         <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p className="text-xs text-gray-500">No standard templates found for this category (ID: {watchedValues.categoryId}).</p>
                         </div>
                      )}

                      {templateSpecs.length > 0 && (
                        <div className="space-y-3">
                            <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Standard Specifications ({watchedValues.categoryId ? 'Category Based' : 'Standard'})</h5>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-gray-50/80">
                                        <TableRow>
                                            <TableHead className="w-1/3 pl-6">Specification Name</TableHead>
                                            <TableHead className="w-2/3">Detail Value</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {templateSpecs.map((spec, index) => (
                                            <TableRow key={spec.id} className="group hover:bg-gray-50/50">
                                                <TableCell className="p-3 pl-6 font-medium text-gray-700 bg-gray-50/30">
                                                    {spec.name}
                                                </TableCell>
                                                <TableCell className="p-2">
                                                    <Input 
                                                        placeholder={`Enter ${spec.name}...`}
                                                        value={spec.value}
                                                        onChange={(e) => updateTemplateSpec(index, e.target.value)}
                                                        className="border-gray-200 focus:bg-white focus:border-indigo-300 transition-all text-gray-700" 
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                      )}

                      {/* Custom Specs Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                             <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Specifications</h5>
                             <Button size="sm" type="button" onClick={addSpecRow} variant="outline" className="h-8 text-xs border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                                <Plus className="h-3 w-3 mr-1"/> Add Custom Row
                             </Button>
                        </div>
                        
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader className="bg-gray-50/80">
                            <TableRow>
                              <TableHead className="w-[40px]"></TableHead>
                              <TableHead className="w-1/3 pl-4">Specification Name</TableHead>
                              <TableHead className="w-1/2">Detail Value</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {specs.map((spec, index) => (
                              <TableRow 
                                key={spec.id} 
                                className={cn(
                                  "group cursor-move",
                                  draggedSpecIndex === index && "opacity-50"
                                )}
                                draggable
                                onDragStart={() => handleSpecDragStart(index)}
                                onDragOver={(e) => handleSpecDragOver(e, index)}
                                onDragEnd={handleSpecDragEnd}
                              >
                                <TableCell className="p-2 pl-4">
                                  <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                                </TableCell>
                                <TableCell className="p-2">
                                  {allSpecKeys.length > 0 ? (
                                    <Popover 
                                      open={specKeyPopoverOpen === spec.id} 
                                      onOpenChange={(open) => setSpecKeyPopoverOpen(open ? spec.id : null)}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          role="combobox"
                                          type="button"
                                          className={cn(
                                            "w-full justify-between h-9 px-3 font-medium text-left hover:bg-gray-50 border border-transparent hover:border-gray-200",
                                            !spec.key && "text-gray-400"
                                          )}
                                        >
                                          <span className="truncate">{spec.key || "Select or type spec name..."}</span>
                                          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-[280px] p-0" align="start">
                                        <Command>
                                          <CommandInput 
                                            placeholder="Search or type new..." 
                                            value={spec.key}
                                            onValueChange={(val) => updateSpec(index, 'key', val)}
                                          />
                                          <CommandList>
                                            <CommandEmpty>
                                              <button 
                                                type="button"
                                                className="w-full text-left px-2 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded"
                                                onClick={() => {
                                                  setSpecKeyPopoverOpen(null);
                                                }}
                                              >
                                                Use &ldquo;<span className="font-semibold">{spec.key}</span>&rdquo; as custom name
                                              </button>
                                            </CommandEmpty>
                                            <CommandGroup heading="From Templates">
                                              {allSpecKeys.map((key) => (
                                                <CommandItem
                                                  key={key}
                                                  value={key}
                                                  onSelect={(val) => {
                                                    updateSpec(index, 'key', val);
                                                    setSpecKeyPopoverOpen(null);
                                                  }}
                                                >
                                                  <Check className={cn("mr-2 h-4 w-4", spec.key === key ? "opacity-100" : "opacity-0")} />
                                                  {key}
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                  ) : (
                                    <Input 
                                      placeholder="e.g. Special Feature" 
                                      value={spec.key}
                                      onChange={(e) => updateSpec(index, 'key', e.target.value)}
                                      className="border-transparent shadow-none focus:bg-gray-50 hover:bg-gray-50 transition-colors font-medium text-gray-700" 
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="p-2">
                                  <Input 
                                    placeholder="Value..." 
                                    value={spec.value}
                                    onChange={(e) => updateSpec(index, 'value', e.target.value)}
                                    className="border-transparent shadow-none focus:bg-gray-50 hover:bg-gray-50 transition-colors text-gray-600" 
                                  />
                                </TableCell>
                                <TableCell className="p-2 text-center pr-4">
                                  <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-all"
                                    onClick={() => removeSpecRow(index)}
                                  >
                                    <Trash2 className="h-4 w-4"/>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                             {specs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-gray-400 italic">
                                        No custom specifications added.
                                    </TableCell>
                                </TableRow>
                             )}
                          </TableBody>
                        </Table>
                      </div>
                      </div>
                   </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 6: Media */}
            <TabsContent value="media" className="m-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <Card className="border-0 shadow-md ring-1 ring-gray-100 bg-white overflow-hidden rounded-2xl min-h-[500px]">
                <CardHeader className="border-b border-gray-50 bg-gray-50/50 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-pink-500" /> Media Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  
                  {/* Gallery Uploader */}
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <label className="block text-sm font-bold text-gray-900">
                            Product Images
                          </label>
                          <span className="text-xs text-gray-500">
                             {galleryImages.length} images uploaded • First image is thumbnail
                          </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {/* Upload Button */}
                          <div className="relative aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-400 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-4 group">
                              <input 
                                  type="file" 
                                  multiple 
                                  accept="image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                  onChange={(e) => handleGalleryUpload(e.target.files)}
                              />
                              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <Plus className="h-5 w-5 text-blue-500" />
                              </div>
                              <span className="text-xs font-medium text-gray-600">Upload</span>
                          </div>

                          {/* Library Button */}
                          <div 
                              className="relative aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-400 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-4 group"
                              onClick={() => setIsMediaLibraryOpen(true)}
                          >
                              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                  <ImageIcon className="h-5 w-5 text-purple-500" />
                              </div>
                              <span className="text-xs font-medium text-gray-600">From Library</span>
                          </div>

                          {/* Image List */}
                          {galleryImages.map((img, index) => (
                              <div key={img.id} className={`relative aspect-square rounded-xl overflow-hidden border group ${img.isThumbnail ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}>
                                  <img src={img.url} className="w-full h-full object-cover" />
                                  
                                  {/* Overlay Actions */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-10">
                                      <div className="flex justify-end">
                                          <button 
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                removeGalleryImage(img.id);
                                              }}
                                              className="p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-red-50 shadow-sm"
                                          >
                                              <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                      </div>
                                      <div className="flex justify-center">
                                          {img.isThumbnail ? (
                                              <span className="px-2 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                                  Thumbnail
                                              </span>
                                          ) : (
                                              <button 
                                                  type="button"
                                                  onClick={() => setThumbnail(img.id)}
                                                  className="px-2 py-1 bg-white/90 text-gray-700 text-[10px] font-medium rounded-full hover:bg-blue-50 hover:text-blue-600 shadow-sm"
                                              >
                                                  Set Thumbnail
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="space-y-2 pt-6 border-t border-gray-100">
                    <label className="text-sm font-medium text-gray-700">Video Preview URL</label>
                    <Input {...register('videoUrl')} placeholder="https://youtube.com/..." className="h-10 bg-gray-50/50" />
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

          </div>
        </Tabs>

        {/* Image Selection Dialog */}
        <Dialog open={isImageSelectorOpen} onOpenChange={setIsImageSelectorOpen}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Select Variant Image</DialogTitle>
                    <DialogDescription>
                        Choose an image from the gallery for this variation.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="relative aspect-square border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-400 transition-all cursor-pointer flex flex-col items-center justify-center text-center p-4 group">
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            onChange={(e) => handleGalleryUpload(e.target.files)}
                        />
                        <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-500 mb-2" />
                        <span className="text-xs text-gray-500">Upload New</span>
                    </div>

                    {galleryImages.map((img) => (
                        <div 
                            key={img.id} 
                            className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                            onClick={() => currentVariationIndex !== null && selectImageForVariation(currentVariationIndex, img.id)}
                        >
                            <img src={img.url} className="w-full h-full object-cover" />
                            {img.isThumbnail && (
                                <div className="absolute top-1 right-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 drop-shadow-sm" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>

        <MediaLibrary 
           open={isMediaLibraryOpen}
           onOpenChange={setIsMediaLibraryOpen}
           onSelect={handleLibrarySelect}
        />

        {/* Product Preview Modal */}
        {isPreviewOpen && (() => {
          // Flatten category hierarchy to find name
          const findCatName = (cats: any[], id: string): string | undefined => {
            for (const c of cats) {
              if (c.id === id || c.id?.toString() === id) return c.name;
              if (c.children?.length) { const r = findCatName(c.children, id); if (r) return r; }
              if (c.subcategories?.length) { const r = findCatName(c.subcategories, id); if (r) return r; }
            }
          };
          const brandName  = brands.find((b: any) => b.id === watchedValues.brandId || b.id?.toString() === watchedValues.brandId)?.name;
          const catName    = findCatName(categories as any[], watchedValues.categoryId);
          return (
            <ProductPreviewModal
              open={isPreviewOpen}
              onClose={() => setIsPreviewOpen(false)}
              data={{
                name:           watchedValues.name,
                description:    watchedValues.description || '',
                price:          Number(watchedValues.price) || 0,
                offerPrice:     Number(watchedValues.offerPrice) || 0,
                costPrice:      Number(watchedValues.costPrice) || 0,
                stock:          Number(watchedValues.stock) || 0,
                sku:            watchedValues.sku || '',
                upc:            watchedValues.upc || '',
                unit:           watchedValues.unit || '',
                warrantyMonths: Number(watchedValues.warrantyMonths) || 0,
                isActive:       watchedValues.isActive,
                isFlashSale:    watchedValues.isFlashSale,
                productType:    watchedValues.productType,
                galleryImages,
                variations,
                attributes,
                specs,
                templateSpecs,
                categoryName:   catName,
                brandName,
              }}
            />
          );
        })()}
      </div>

      {/* ── Confirm Dialog Modal ── */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, open: false }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 pt-1">
              {confirmDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            >
              বাতিল
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
            >
              নিশ্চিত করুন
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
