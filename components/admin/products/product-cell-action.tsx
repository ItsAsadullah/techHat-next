"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Edit, History, Copy, Trash, BoxSelect, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { toast } from "sonner";
import { duplicateProduct } from "@/lib/actions/product-actions";
import { bulkDeleteProducts } from "@/lib/actions/product-stock-actions";
import { useConfirm } from "@/components/providers/confirm-provider";
import { StockHistoryModal } from "./stock-history-modal";

interface ProductCellActionProps {
  data: any; // Product type
}

export function ProductCellAction({ data }: ProductCellActionProps) {
  const router = useRouter();
  const confirm = useConfirm();
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
        router.refresh();
      } else {
        toast.error(result.error || "Failed to duplicate product");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    const ok = await confirm(
      `Are you sure you want to permanently delete "${data.name}"? This action cannot be undone.`
    );
    if (!ok) return;

    try {
      setIsLoading(true);
      const result = await bulkDeleteProducts([data.id]);
      if (result.success) {
        toast.success(result.message || "Product permanently deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Failed to delete product");
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
            <span className="sr-only">Open menu</span>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
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
          <DropdownMenuItem
            onSelect={() => {
              setTimeout(() => setShowHistory(true), 50);
            }}
          >
            <History className="mr-2 h-4 w-4" /> View Stock History
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onDelete}
            disabled={isLoading}
            className="text-red-600 focus:text-red-600 cursor-pointer"
          >
            <Trash className="mr-2 h-4 w-4" /> Delete Permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <StockHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        productId={data.id}
        productName={data.name}
      />
    </div>
  );
}
