'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { createAttributeValue, updateAttributeValue, deleteAttributeValue } from '@/lib/actions/attribute-actions';
import { toast } from 'sonner';

export default function AttributeValueManager({ attribute, initialValues }: { attribute: any, initialValues: any[] }) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentVal, setCurrentVal] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    label: '',
    value: '',
    shortCode: '',
    colorCode: '#000000',
    imageUrl: '',
    displayOrder: 0,
  });

  const handleOpenCreate = () => {
    setCurrentVal(null);
    setFormData({
      label: '',
      value: '',
      shortCode: '',
      colorCode: '#000000',
      imageUrl: '',
      displayOrder: values.length,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (val: any) => {
    setCurrentVal(val);
    setFormData({
      label: val.label,
      value: val.value,
      shortCode: val.shortCode || '',
      colorCode: val.colorCode || '#000000',
      imageUrl: val.imageUrl || '',
      displayOrder: val.displayOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.label || !formData.value) {
      toast.error('Label and Value are required');
      return;
    }
    setLoading(true);

    try {
      if (currentVal) {
        const res = await updateAttributeValue(currentVal.id, formData);
        if (res.success) {
          toast.success('Updated successfully');
          setValues((prev) =>
            prev.map((v) => (v.id === currentVal.id ? { ...v, ...formData } : v)).sort((a, b) => a.displayOrder - b.displayOrder)
          );
          setIsDialogOpen(false);
        } else {
          toast.error(res.error || 'Failed to update');
        }
      } else {
        const res = await createAttributeValue({
          attributeId: attribute.id,
          ...formData,
        });
        if (res.success && res.attrValue) {
          toast.success('Created successfully');
          setValues((prev) => [...prev, res.attrValue].sort((a: any, b: any) => a.displayOrder - b.displayOrder));
          setIsDialogOpen(false);
        } else {
          toast.error(res.error || 'Failed to create');
        }
      }
    } catch (e) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentVal) return;
    setLoading(true);
    try {
      const res = await deleteAttributeValue(currentVal.id);
      if (res.success) {
        toast.success('Deleted successfully');
        setValues((prev) => prev.filter((v) => v.id !== currentVal.id));
        setIsDeleteOpen(false);
      } else {
        toast.error(res.error || 'Failed to delete');
      }
    } catch (e) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.push('/admin/settings/attributes')} className="text-gray-500 rounded-xl">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Attributes
        </Button>
        <Button onClick={handleOpenCreate} className="rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Add Value
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Value (Internal)</TableHead>
              <TableHead>Short Code (SKU)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {values.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                  No values found. Click 'Add Value' to create options.
                </TableCell>
              </TableRow>
            ) : (
              values.map((val) => (
                <TableRow key={val.id} className="hover:bg-gray-50">
                  <TableCell>
                    {attribute.dataType === 'COLOR' ? (
                      <div className="w-8 h-8 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: val.colorCode || '#000' }} />
                    ) : attribute.dataType === 'IMAGE_OPTION' && val.imageUrl ? (
                      <img src={val.imageUrl} alt={val.label} className="w-8 h-8 rounded object-cover border" />
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{val.label}</TableCell>
                  <TableCell className="text-gray-500 font-mono text-sm">{val.value}</TableCell>
                  <TableCell className="text-gray-500 font-mono text-sm">{val.shortCode || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(val)} className="rounded-lg text-gray-500 hover:text-blue-600">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setCurrentVal(val); setIsDeleteOpen(true); }} className="rounded-lg text-gray-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{currentVal ? 'Edit Value' : 'Add New Value'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label (Display Name)</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => {
                    const l = e.target.value;
                    setFormData({ ...formData, label: l, value: currentVal ? formData.value : l.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
                  }}
                  placeholder="e.g., Space Black"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Value (System ID)</Label>
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g., space-black"
                  className="rounded-xl font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Short Code (For SKU)</Label>
                <Input
                  value={formData.shortCode}
                  onChange={(e) => setFormData({ ...formData, shortCode: e.target.value })}
                  placeholder="e.g., BLK"
                  className="rounded-xl font-mono text-sm uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>
            </div>

            {attribute.dataType === 'COLOR' && (
              <div className="space-y-2">
                <Label>Color Code (HEX/RGB)</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    value={formData.colorCode}
                    onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                    className="w-12 h-12 p-1 rounded-xl cursor-pointer"
                  />
                  <Input
                    value={formData.colorCode}
                    onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                    className="rounded-xl font-mono text-sm flex-1"
                  />
                </div>
              </div>
            )}

            {attribute.dataType === 'IMAGE_OPTION' && (
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="rounded-xl"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="rounded-xl">
              {loading ? 'Saving...' : 'Save Value'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Value</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{currentVal?.label}</strong>? This may break existing variants using this value.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="rounded-xl">
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
