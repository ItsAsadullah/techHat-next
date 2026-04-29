'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MoreHorizontal, Pencil, Trash2, Tags } from 'lucide-react';
import { createBrand, updateBrand, deleteBrand } from '@/lib/actions/brand-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Brand {
  id: string;
  name: string;
  slug: string;
  shortCode?: string | null;
  logo?: string | null;
  _count?: { products: number };
}

export function BrandManager({ initialBrands }: { initialBrands: Brand[] }) {
  const router = useRouter();
  const brands = initialBrands;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);

  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    shortCode: '',
  });

  const handleCreate = async () => {
    if (submittingRef.current) return;
    if (!formData.name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    try {
      const res = await createBrand(
        formData.name.trim(),
        undefined,
        formData.shortCode.trim().toUpperCase()
      );
      if (res.success) {
        toast.success('Brand created successfully');
        setIsCreateOpen(false);
        setFormData({ name: '', shortCode: '' });
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to create brand');
      }
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentBrand || submittingRef.current) return;
    if (!formData.name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    try {
      const res = await updateBrand(currentBrand.id, {
        name: formData.name,
        shortCode: formData.shortCode,
      });
      if (res.success) {
        toast.success('Brand updated successfully');
        setIsEditOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to update brand');
      }
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentBrand || submittingRef.current) return;
    submittingRef.current = true;
    setIsLoading(true);
    try {
      const res = await deleteBrand(currentBrand.id);
      if (res.success) {
        toast.success('Brand deleted successfully');
        setIsDeleteOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Failed to delete brand');
      }
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">All Brands</h2>
          <p className="text-sm text-gray-600 mt-1 font-medium">{brands.length} brands total</p>
        </div>
        <Button
          onClick={() => {
            setFormData({ name: '', shortCode: '' });
            setIsCreateOpen(true);
          }}
          className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-md font-medium px-5"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Brand
        </Button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
              <TableHead className="pl-6 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">Brand Name</TableHead>
              <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">Slug</TableHead>
              <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">Short Code</TableHead>
              <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">Products</TableHead>
              <TableHead className="text-right pr-6 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <Tags className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-base font-bold text-gray-900 mb-1">No brands yet</p>
                    <p className="text-sm text-gray-600">Create your first brand to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              brands.map((brand) => (
                <TableRow key={brand.id} className="hover:bg-gray-50 group border-b border-gray-100 last:border-0 transition-all">
                  <TableCell className="font-medium py-4 pl-6 text-sm text-gray-900">{brand.name}</TableCell>
                  <TableCell className="text-gray-600 text-sm font-medium py-4">{brand.slug}</TableCell>
                  <TableCell className="text-gray-600 text-sm py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-xs font-mono">
                      {brand.shortCode || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium text-xs">
                      {brand._count?.products || 0} products
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded-lg">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-5 w-5 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl border border-gray-200 shadow-lg">
                        <DropdownMenuLabel className="text-xs font-bold uppercase text-gray-500">Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setCurrentBrand(brand);
                            setFormData({
                              name: brand.name,
                              shortCode: brand.shortCode || '',
                            });
                            setIsEditOpen(true);
                          }}
                          className="rounded-lg cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg cursor-pointer"
                          onClick={() => {
                            setCurrentBrand(brand);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="rounded-2xl border-2 border-gray-200 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Create New Brand</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm font-medium">Add a new brand for products</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-2.5">
              <Label className="text-sm font-bold text-gray-700">Brand Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Samsung"
                className="h-11 rounded-lg border-2 border-gray-200"
              />
            </div>
            <div className="grid gap-2.5">
              <Label className="text-sm font-bold text-gray-700">Short Code (optional)</Label>
              <Input
                value={formData.shortCode}
                onChange={(e) => setFormData({ ...formData, shortCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) })}
                placeholder="e.g. SAM"
                className="h-11 rounded-lg border-2 border-gray-200 font-mono uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Brand'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl border-2 border-gray-200 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Edit Brand</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm font-medium">Update brand details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="grid gap-2.5">
              <Label className="text-sm font-bold text-gray-700">Brand Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-lg border-2 border-gray-200"
              />
            </div>
            <div className="grid gap-2.5">
              <Label className="text-sm font-bold text-gray-700">Short Code (optional)</Label>
              <Input
                value={formData.shortCode}
                onChange={(e) => setFormData({ ...formData, shortCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) })}
                className="h-11 rounded-lg border-2 border-gray-200 font-mono uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="rounded-2xl border-2 border-gray-200 shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Delete Brand</DialogTitle>
            <DialogDescription className="text-gray-600 text-sm font-medium">This action cannot be undone</DialogDescription>
          </DialogHeader>
          <div className="py-2 text-sm text-gray-700">
            Are you sure you want to delete &quot;{currentBrand?.name}&quot;?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>{isLoading ? 'Deleting...' : 'Delete Brand'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
