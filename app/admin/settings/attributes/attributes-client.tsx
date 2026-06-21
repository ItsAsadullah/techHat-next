'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { AttributeDialog } from './attribute-dialog';
import { Badge } from '@/components/ui/badge';
import { deleteAttribute } from '@/lib/actions/attribute-actions';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  initialAttributes: any[];
}

export function AttributesClient({ initialAttributes }: Props) {
  const [attributes, setAttributes] = useState(initialAttributes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<any | null>(null);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = () => {
    setSelectedAttribute(null);
    setDialogOpen(true);
  };

  const handleEdit = (attribute: any) => {
    setSelectedAttribute(attribute);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteAttribute(deleteId);
      if (res.success) {
        toast.success('Attribute deleted');
        setAttributes(prev => prev.filter(a => a.id !== deleteId));
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate} className="h-9">
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Values</th>
              <th className="px-4 py-3 font-medium w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {attributes.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No attributes found. Click "Add Attribute" to create one.
                </td>
              </tr>
            ) : (
              attributes.map((attr) => (
                <tr key={attr.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{attr.name}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{attr.type}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {attr.values?.map((v: any) => (
                        <Badge key={v.id} variant="secondary" className="font-normal text-xs">
                          {v.colorCode && (
                            <span 
                              className="w-2 h-2 rounded-full mr-1.5 inline-block border"
                              style={{ backgroundColor: v.colorCode }}
                            />
                          )}
                          {v.value}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(attr)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteId(attr.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AttributeDialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            // In a real app we'd refetch from server, but here we can just reload the window to be simple
            // or we rely on the server action revalidatePath and just router.refresh() 
            // Wait, we are keeping state, so let's just do window.location.reload() for simplicity 
            // since we used setAttributes from initial data.
            window.location.reload();
          }
        }} 
        attribute={selectedAttribute} 
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this attribute and all its values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
