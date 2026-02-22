"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStockHistory } from "@/lib/actions/product-stock-actions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  productName?: string;
}

export function StockHistoryModal({ isOpen, onClose, productId, productName }: StockHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      setIsLoading(true);
      getStockHistory(productId)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, productId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock History</DialogTitle>
          <DialogDescription>
             History for {productName}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center p-4">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No history found</TableCell>
                </TableRow>
              ) : (
                history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(record.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.action === "ADD" ? "default" : record.action === "REDUCE" ? "destructive" : "secondary"}>
                        {record.action}
                      </Badge>
                    </TableCell>
                    <TableCell className={record.action === "ADD" ? "text-green-600" : record.action === "REDUCE" ? "text-red-600" : ""}>
                      {record.action === "ADD" ? "+" : record.action === "REDUCE" ? "-" : ""}{record.quantity}
                    </TableCell>
                    <TableCell>{record.newStock}</TableCell>
                    <TableCell className="text-xs">{record.reason}</TableCell>
                    <TableCell className="text-xs">{record.source}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
