'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AttributeDataType, AttributeUIType } from '@prisma/client';
import { Plus, Pencil, Trash2, Settings2, ListTodo } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createAttribute, updateAttribute, deleteAttribute } from '@/lib/actions/attribute-actions';
import { toast } from 'sonner';

export default function AttributeManager({ initialAttributes }: { initialAttributes: any[] }) {
  const router = useRouter();
  const [attributes, setAttributes] = useState(initialAttributes);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentAttr, setCurrentAttr] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    dataType: 'TEXT' as AttributeDataType,
    uiType: 'INPUT' as AttributeUIType,
    isVariant: false,
    isFilterable: true,
    isSearchable: true,
    status: 'ACTIVE',
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleOpenCreate = () => {
    setCurrentAttr(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      dataType: 'TEXT',
      uiType: 'INPUT',
      isVariant: false,
      isFilterable: true,
      isSearchable: true,
      status: 'ACTIVE',
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (attr: any) => {
    setCurrentAttr(attr);
    setFormData({
      name: attr.name,
      slug: attr.slug,
      description: attr.description || '',
      dataType: attr.dataType,
      uiType: attr.uiType,
      isVariant: attr.isVariant,
      isFilterable: attr.isFilterable,
      isSearchable: attr.isSearchable,
      status: attr.status,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Name and Slug are required');
      return;
    }
    setLoading(true);

    try {
      if (currentAttr) {
        const res = await updateAttribute(currentAttr.id, formData);
        if (res.success) {
          toast.success('Attribute updated successfully');
          setAttributes((prev) =>
            prev.map((a) => (a.id === currentAttr.id ? { ...a, ...formData } : a))
          );
          setIsDialogOpen(false);
        } else {
          toast.error(res.error || 'Failed to update attribute');
        }
      } else {
        const res = await createAttribute(formData);
        if (res.success && res.attribute) {
          toast.success('Attribute created successfully');
          setAttributes((prev) => [...prev, { ...res.attribute, values: [] }]);
          setIsDialogOpen(false);
        } else {
          toast.error(res.error || 'Failed to create attribute');
        }
      }
    } catch (e) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentAttr) return;
    setLoading(true);
    try {
      const res = await deleteAttribute(currentAttr.id);
      if (res.success) {
        toast.success('Attribute deleted');
        setAttributes((prev) => prev.filter((a) => a.id !== currentAttr.id));
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
        <Input placeholder="Search attributes..." className="max-w-sm rounded-xl" />
        <Button onClick={handleOpenCreate} className="rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> Create Attribute
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Values</TableHead>
              <TableHead>Settings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attributes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                  No attributes found. Click 'Create Attribute' to get started.
                </TableCell>
              </TableRow>
            ) : (
              attributes.map((attr) => (
                <TableRow key={attr.id} className="hover:bg-gray-50 group">
                  <TableCell>
                    <div className="font-medium text-gray-900">{attr.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{attr.slug}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{attr.dataType}</div>
                    <div className="text-xs text-gray-500">{attr.uiType}</div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                      onClick={() => router.push(`/admin/settings/attributes/${attr.id}`)}
                    >
                      <ListTodo className="w-4 h-4 mr-2" />
                      Manage Values ({attr.values?.length || 0})
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2 text-xs">
                      {attr.isVariant && (
                        <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 font-medium">Variant</span>
                      )}
                      {attr.isFilterable && (
                        <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">Filterable</span>
                      )}
                      {!attr.isVariant && !attr.isFilterable && (
                        <span className="text-gray-400">Standard</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(attr)}
                        className="rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentAttr(attr);
                          setIsDeleteOpen(true);
                        }}
                        className="rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
                      >
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

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{currentAttr ? 'Edit Attribute' : 'Create New Attribute'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: currentAttr ? formData.slug : generateSlug(e.target.value),
                  });
                }}
                className="rounded-xl"
                placeholder="e.g., Color, Size, RAM"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="rounded-xl font-mono text-sm"
                placeholder="e.g., color, size, ram"
                disabled={!!currentAttr} // Cannot easily change slug after creation without migration
              />
            </div>

            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select
                value={formData.dataType}
                onValueChange={(val: any) => setFormData({ ...formData, dataType: val })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEXT">Text</SelectItem>
                  <SelectItem value="NUMBER">Number</SelectItem>
                  <SelectItem value="DROPDOWN">Dropdown / Select</SelectItem>
                  <SelectItem value="COLOR">Color</SelectItem>
                  <SelectItem value="IMAGE_OPTION">Image Option</SelectItem>
                  <SelectItem value="BOOLEAN">Boolean (Yes/No)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>UI Type (Storefront)</Label>
              <Select
                value={formData.uiType}
                onValueChange={(val: any) => setFormData({ ...formData, uiType: val })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUTTON_SELECTOR">Button Selector</SelectItem>
                  <SelectItem value="COLOR_SWATCH">Color Swatch</SelectItem>
                  <SelectItem value="IMAGE_SWATCH">Image Swatch</SelectItem>
                  <SelectItem value="DROPDOWN">Dropdown</SelectItem>
                  <SelectItem value="RADIO">Radio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-gray-500" /> Advanced Settings
              </h3>
              
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                <div>
                  <Label className="text-base font-medium">Use as Variant?</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Allow this attribute to generate product variants (e.g. Color, Size).</p>
                </div>
                <Switch
                  checked={formData.isVariant}
                  onCheckedChange={(c) => setFormData({ ...formData, isVariant: c })}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                <div>
                  <Label className="text-base font-medium">Is Filterable?</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Show this attribute in the sidebar filter on the storefront.</p>
                </div>
                <Switch
                  checked={formData.isFilterable}
                  onCheckedChange={(c) => setFormData({ ...formData, isFilterable: c })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="rounded-xl">
              {loading ? 'Saving...' : 'Save Attribute'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Attribute</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{currentAttr?.name}</strong>? This will remove it from all products and categories.
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
