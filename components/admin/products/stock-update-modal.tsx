"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateStock } from "@/lib/actions/product-stock-actions";
import { StockAction } from "@prisma/client";
import { toast } from "sonner"; // Assuming sonner is used, or use-toast

const stockUpdateSchema = z.object({
  action: z.enum(["ADD", "REDUCE", "ADJUST"]),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  reason: z.string().min(1, "Reason is required"),
  note: z.string().optional(),
});

interface StockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    stock: number;
    variantId?: string | null;
    variantName?: string;
  } | null;
}

export function StockUpdateModal({ isOpen, onClose, product }: StockUpdateModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof stockUpdateSchema>>({
    resolver: zodResolver(stockUpdateSchema) as any,
    defaultValues: {
      action: "ADD",
      quantity: 1,
      reason: "Purchase",
      note: "",
    },
  });

  async function onSubmit(values: z.infer<typeof stockUpdateSchema>) {
    if (!product) return;
    
    setIsLoading(true);
    try {
      const result = await updateStock(
        product.id,
        product.variantId || null,
        values.action as StockAction,
        values.quantity,
        values.reason,
        values.note
      );

      if (result.success) {
        // toast.success("Stock updated successfully");
        onClose();
        form.reset();
      } else {
        // toast.error(result.error || "Failed to update stock");
        console.error(result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Stock</DialogTitle>
          <DialogDescription>
            {product?.name} {product?.variantName ? `(${product.variantName})` : ""}
            <br />
            Current Stock: <span className="font-semibold">{product?.stock}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADD">Add Stock</SelectItem>
                      <SelectItem value="REDUCE">Reduce Stock</SelectItem>
                      <SelectItem value="ADJUST">Set Exact Quantity</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Purchase">Purchase / Restock</SelectItem>
                      <SelectItem value="Damage">Damage</SelectItem>
                      <SelectItem value="Return">Return</SelectItem>
                      <SelectItem value="Manual">Manual Adjustment</SelectItem>
                      <SelectItem value="POS correction">POS Correction</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Stock"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
