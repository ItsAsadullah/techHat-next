"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, AlertTriangle, CheckCircle2, Trash2, Archive, PackagePlus, PackageMinus } from "lucide-react";
import { toast } from "sonner";
import { bulkUpdateStock, bulkUpdateStatus, bulkDeleteProducts } from "@/lib/actions/product-stock-actions";

export type BulkActionType = 'add_stock' | 'reduce_stock' | 'change_status' | 'delete' | null;

interface BulkActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  actionType: BulkActionType;
  onSuccess: () => void;
}

export function BulkActionModal({ 
  open, 
  onOpenChange, 
  selectedIds, 
  actionType, 
  onSuccess 
}: BulkActionModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Stock State
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [stockReason, setStockReason] = useState<string>("");
  const [stockNote, setStockNote] = useState<string>("");
  
  // Status State
  const [statusValue, setStatusValue] = useState<string>("active");
  
  // Delete State
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const resetForm = () => {
    setStockQuantity(0);
    setStockReason("");
    setStockNote("");
    setStatusValue("active");
    setDeleteConfirmation("");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Don't reset immediately to allow fade out animation
    setTimeout(resetForm, 300);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let result;

      if (actionType === 'add_stock') {
        if (stockQuantity <= 0) throw new Error("Quantity must be greater than 0");
        if (!stockReason) throw new Error("Please select a reason");
        
        result = await bulkUpdateStock(selectedIds, 'ADD', stockQuantity, stockReason, stockNote);
      } 
      else if (actionType === 'reduce_stock') {
        if (stockQuantity <= 0) throw new Error("Quantity must be greater than 0");
        if (!stockReason) throw new Error("Please select a reason");

        result = await bulkUpdateStock(selectedIds, 'REDUCE', stockQuantity, stockReason, stockNote);
      } 
      else if (actionType === 'change_status') {
        const isActive = statusValue === 'active';
        result = await bulkUpdateStatus(selectedIds, isActive);
      } 
      else if (actionType === 'delete') {
        if (deleteConfirmation !== 'DELETE') return;
        result = await bulkDeleteProducts(selectedIds);
      }

      if (result?.success) {
        toast.success(`Successfully processed ${selectedIds.length} products`);
        onSuccess();
        handleClose();
      } else {
        toast.error(result?.error || "An error occurred");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
    } finally {
      setLoading(false);
    }
  };

  const getModalContent = () => {
    switch (actionType) {
      case 'add_stock':
        return (
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
              <PackagePlus className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900">Adding Stock</h4>
                <p className="text-xs text-blue-700">This will increase inventory for {selectedIds.length} products.</p>
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity to Add</Label>
                  <Input 
                    type="number" 
                    min="1"
                    value={stockQuantity || ''} 
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 10" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select value={stockReason} onValueChange={setStockReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Purchase">New Purchase</SelectItem>
                      <SelectItem value="Return">Customer Return</SelectItem>
                      <SelectItem value="Adjustment">Inventory Adjustment</SelectItem>
                      <SelectItem value="Found">Stock Found</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea 
                  value={stockNote} 
                  onChange={(e) => setStockNote(e.target.value)}
                  placeholder="Reference number, supplier info, etc." 
                  rows={2}
                />
              </div>
            </div>
          </div>
        );

      case 'reduce_stock':
        return (
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-3">
              <PackageMinus className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900">Reducing Stock</h4>
                <p className="text-xs text-amber-700">This will decrease inventory for {selectedIds.length} products.</p>
              </div>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity to Remove</Label>
                  <Input 
                    type="number" 
                    min="1"
                    value={stockQuantity || ''} 
                    onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 5" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select value={stockReason} onValueChange={setStockReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sale">Manual Sale</SelectItem>
                      <SelectItem value="Damage">Damaged/Expired</SelectItem>
                      <SelectItem value="Theft">Loss/Theft</SelectItem>
                      <SelectItem value="Correction">Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea 
                  value={stockNote} 
                  onChange={(e) => setStockNote(e.target.value)}
                  placeholder="Reason details..." 
                  rows={2}
                />
              </div>
            </div>
          </div>
        );

      case 'change_status':
        return (
          <div className="space-y-4 py-4">
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex items-start gap-3">
              <Archive className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-purple-900">Update Status</h4>
                <p className="text-xs text-purple-700">Change visibility for {selectedIds.length} products.</p>
              </div>
            </div>
            
            <RadioGroup value={statusValue} onValueChange={setStatusValue} className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <RadioGroupItem value="active" id="active" className="peer sr-only" />
                <Label
                  htmlFor="active"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer"
                >
                  <CheckCircle2 className="mb-2 h-6 w-6" />
                  Active
                </Label>
              </div>
              <div>
                <RadioGroupItem value="draft" id="draft" className="peer sr-only" />
                <Label
                  htmlFor="draft"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:text-primary cursor-pointer"
                >
                  <Archive className="mb-2 h-6 w-6" />
                  Draft
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 'delete':
        return (
          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-red-900">Danger Zone</h4>
                <p className="text-xs text-red-700">
                  You are about to permanently delete <strong>{selectedIds.length} products</strong>. 
                  This action cannot be undone and will remove all associated stock history.
                </p>
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <Label className="text-red-600 font-semibold">Type "DELETE" to confirm</Label>
              <Input 
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="border-red-300 focus:ring-red-200"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch(actionType) {
      case 'add_stock': return 'Bulk Add Stock';
      case 'reduce_stock': return 'Bulk Reduce Stock';
      case 'change_status': return 'Change Product Status';
      case 'delete': return 'Delete Products';
      default: return 'Bulk Action';
    }
  };

  const getActionLabel = () => {
    if (loading) return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>;
    
    switch(actionType) {
      case 'add_stock': return 'Add Stock';
      case 'reduce_stock': return 'Reduce Stock';
      case 'change_status': return 'Update Status';
      case 'delete': return 'Delete Permanently';
      default: return 'Apply';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Applying action to {selectedIds.length} selected item{selectedIds.length !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>
        
        {getModalContent()}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || (actionType === 'delete' && deleteConfirmation !== 'DELETE')}
            variant={actionType === 'delete' ? "destructive" : "default"}
          >
            {getActionLabel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
