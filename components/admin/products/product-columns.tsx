"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ProductCellAction } from "./product-cell-action";
import Image from "next/image";
import { format } from "date-fns";

export type ProductColumn = {
  id: string;
  name: string;
  price: number;
  offerPrice?: number | null;
  costPrice: number;
  stock: number;
  category: string;
  status: string; // ProductLifecycleStatus
  lifecycleStatus?: string; // ProductLifecycleStatus
  images: any[];
  variants: any[];
  minStock: number;
  updatedAt: Date;
  sku: string | null;
  slug: string | null;
};

export const columns: ColumnDef<ProductColumn>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "images",
    header: "Image",
    cell: ({ row }) => {
        const images = row.original.images;
        // Logic to find thumbnail or first image
        const thumbnail = images?.find((img: any) => img.isThumbnail) || images?.[0];
        const imageUrl = thumbnail?.url || null;

        return (
            <div className="relative w-10 h-10 rounded-md overflow-hidden border border-gray-200 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {imageUrl ? (
                    <Image 
                        src={imageUrl} 
                        alt={row.original.name} 
                        fill 
                        className="object-cover"
                        sizes="40px"
                    />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                    </svg>
                )}
            </div>
        )
    }
  },
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
        <div className="flex flex-col gap-1 py-1">
            <span className="font-bold text-gray-900 truncate max-w-[200px]" title={row.original.name}>{row.original.name}</span>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                    {row.original.sku || row.original.variants?.[0]?.sku || "NO SKU"}
                </span>
            </div>
        </div>
    )
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
        <Badge variant="outline" className="font-normal bg-gray-50 text-gray-600 border-gray-200">
            {row.original.category}
        </Badge>
    )
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = parseFloat(row.original.price?.toString() || "0");
      const offerPrice = row.original.offerPrice ? parseFloat(row.original.offerPrice.toString()) : null;
      
      const displayPrice = (offerPrice && offerPrice > 0) ? offerPrice : price;
      
      const formatted = new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 0
      }).format(displayPrice);

      return (
        <div className="flex flex-col gap-0.5">
          <div className="font-bold text-gray-900">{formatted}</div>
          {(offerPrice && offerPrice > 0 && offerPrice !== price) ? (
            <div className="text-[10px] text-gray-400 line-through">
              {new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(price)}
            </div>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "costPrice",
    header: "Cost",
    cell: ({ row }) => {
      const cost = parseFloat((row.original.costPrice || 0).toString());
      const formatted = new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 0
      }).format(cost);
      return <div className="text-xs font-medium text-gray-500">{formatted}</div>;
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
        const stock = row.original.stock;
        const minStock = row.original.minStock || 5;
        let color = "text-emerald-600";
        let label = "Healthy";

        if (stock <= 0) {
            color = "text-red-600";
            label = "Out of Stock";
        } else if (stock <= minStock / 2) {
            color = "text-rose-600";
            label = "Critical";
        } else if (stock <= minStock) {
            color = "text-amber-600";
            label = "Low Stock";
        }

        return (
            <div className="flex flex-col items-start gap-0.5">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${color}`}>
                    {label}
                </span>
                <div className="flex items-baseline gap-1">
                    <span className={`text-sm font-bold ${color}`}>
                        {stock}
                    </span>
                    <span className="text-xs font-medium text-slate-400">units</span>
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: "minStock",
    header: "Threshold",
    cell: ({ row }) => (
        <div className="flex items-center justify-center w-12 h-8 rounded bg-gray-50 text-gray-500 text-xs font-medium border border-gray-100">
            {row.original.minStock || 5}
        </div>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status || 'DRAFT';
      const cfg: Record<string, { label: string; cls: string }> = {
        DRAFT:          { label: 'Draft',         cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
        PENDING_REVIEW: { label: 'Pending',       cls: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
        PUBLISHED:      { label: 'Published',     cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
        ACTIVE:         { label: 'Active',        cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
        ARCHIVED:       { label: 'Archived',      cls: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' },
        DISCONTINUED:   { label: 'Discontinued',  cls: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
        COMING_SOON:    { label: 'Coming Soon',   cls: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
        OUT_OF_STOCK:   { label: 'Out of Stock',  cls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' },
      };
      const c = cfg[s] ?? cfg.DRAFT;
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
          {c.label}
        </span>
      );
    }
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.updatedAt), "MMM d, yyyy")}
        </span>
    )
  },
  {
    id: "actions",
    cell: ({ row }) => <ProductCellAction data={row.original} />,
    enableHiding: false,
  },
];
