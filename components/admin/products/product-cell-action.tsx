"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, History, Copy, Trash, BoxSelect } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { StockUpdateModal } from "./stock-update-modal";
import { StockHistoryModal } from "./stock-history-modal";
import Link from "next/link";
import { toast } from "sonner";
import { duplicateProduct } from "@/lib/actions/product-actions";

interface ProductCellActionProps {
  data: any; // Product type
}

export function ProductCellAction({ data }: ProductCellActionProps) {
  const [showStockUpdate, setShowStockUpdate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Product ID copied to clipboard.");
  };

  const onDuplicate = async () => {
    try {
        setIsLoading(true);
        const result = await duplicateProduct(data.id);
        if (result.success) {
            toast.success("Product duplicated successfully");
        } else {
            toast.error(result.error || "Failed to duplicate product");
        }
    } catch (error) {
        toast.error("Something went wrong");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-gray-500 hover:text-blue-600" 
        asChild
        title="Edit Product"
      >
        <Link href={`/admin/products/edit/${data.id}`}>
            <Edit className="h-4 w-4" />
        </Link>
      </Button>

      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-gray-500 hover:text-green-600" 
        onClick={() => setShowStockUpdate(true)}
        title="Quick Stock Update"
      >
        <BoxSelect className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onCopy(data.id)}>
            <Copy className="mr-2 h-4 w-4" /> Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/products/${data.slug}`} target="_blank">
                <BoxSelect className="mr-2 h-4 w-4" /> View Product
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate} disabled={isLoading}>
            <Copy className="mr-2 h-4 w-4" /> 
            {isLoading ? "Duplicating..." : "Duplicate"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowHistory(true)}>
            <History className="mr-2 h-4 w-4" /> View Stock History
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">
            <Trash className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <StockUpdateModal 
        isOpen={showStockUpdate} 
        onClose={() => setShowStockUpdate(false)}
        product={data}
      />
      
      <StockHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        productId={data.id}
        productName={data.name}
      />
    </div>
  );
}
