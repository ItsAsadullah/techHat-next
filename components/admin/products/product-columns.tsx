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
  costPrice: number;
  stock: number;
  category: string;
  status: boolean; // isActive
  images: any[];
  variants: any[];
  minStock: number;
  updatedAt: Date;
  sku: string | null;
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
      const price = parseFloat(row.original.price.toString());
      const formatted = new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 0
      }).format(price);
      return <div className="font-bold text-gray-900">{formatted}</div>;
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
        let color = "text-emerald-700";
        let bg = "bg-emerald-50";
        let border = "border-emerald-200";
        let label = "In Stock";

        if (stock <= 0) {
            color = "text-red-700";
            bg = "bg-red-50";
            border = "border-red-200";
            label = "Out of Stock";
        } else if (stock <= minStock) {
            color = "text-amber-700";
            bg = "bg-amber-50";
            border = "border-amber-200";
            label = "Low Stock";
        }

        return (
            <div className="flex flex-col items-start gap-1.5">
                <Badge variant="outline" className={`${bg} ${color} ${border} font-semibold shadow-sm`}>
                    {label}
                </Badge>
                <div className="flex items-baseline gap-1">
                    <span className={`text-sm font-bold ${stock <= minStock ? 'text-red-600' : 'text-gray-700'}`}>
                        {stock}
                    </span>
                    <span className="text-xs text-gray-400">units</span>
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
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
        <div className="flex items-center">
            {row.original.status ? (
                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-xs font-semibold">Active</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
                    <span className="h-2 w-2 rounded-full bg-gray-400"></span>
                    <span className="text-xs font-medium">Draft</span>
                </div>
            )}
        </div>
    )
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
