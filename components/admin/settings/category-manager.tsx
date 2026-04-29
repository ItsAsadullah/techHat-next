'use client';

import React, { useState, useRef, type ElementType } from 'react';
import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import {
    createCategory,
    updateCategory,
    deleteCategory
} from '@/lib/actions/category-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconPicker } from '@/components/ui/icon-picker';
import { isLucideIcon } from '@/lib/category-icon';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from '@/components/ui/dialog';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    FolderTree,
    ChevronRight,
    ChevronDown,
    Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Category {
    id: string;
    name: string;
    slug: string;
    shortCode?: string | null;
    parentId: string | null;
    description?: string | null;
    image?: string | null;
    children?: Category[];
    _count?: {
        products: number;
    }
}

// Helper to flatten tree for select options (with indentation)
const flattenCategories = (categories: Category[], level = 0): { id: string, name: string, level: number }[] => {
    let result: { id: string, name: string, level: number }[] = [];
    for (const cat of categories) {
        result.push({ id: cat.id, name: cat.name, level });
        if (cat.children && cat.children.length > 0) {
            result = [...result, ...flattenCategories(cat.children, level + 1)];
        }
    }
    return result;
};

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>(initialCategories);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const submittingRef = useRef(false); // prevents double-click duplicate submissions
    
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        shortCode: '',
        parentId: 'root',
        description: '',
        image: ''
    });

    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Recursive render for table rows
    const renderRows = (cats: Category[], level = 0) => {
        return cats.map(cat => (
            <React.Fragment key={cat.id}>
                <TableRow className="hover:bg-gray-50 group border-b border-gray-100 last:border-0 transition-all">
                    <TableCell className="font-medium py-4 pl-6">
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 28}px` }}>
                            {cat.children && cat.children.length > 0 ? (
                                <button 
                                    onClick={() => toggleExpand(cat.id)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {expanded[cat.id] ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronRight className="w-4 h-4 text-gray-600" />}
                                </button>
                            ) : (
                                <span className="w-7" /> // spacer
                            )}
                            
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-gray-200"
                                    style={cat.image && isLucideIcon(cat.image)
                                        ? { background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }
                                        : { background: '#f3f4f6' }
                                    }
                                >
                                    {cat.image && isLucideIcon(cat.image) ? (() => {
                                        const Icon = (Icons as any)[cat.image!] as ElementType | undefined;
                                        return Icon ? <Icon className="w-5 h-5 text-white" /> : <ImageIcon className="w-5 h-5 text-gray-400" />;
                                    })() : cat.image ? (
                                        <img src={cat.image} className="w-full h-full object-cover" alt={cat.name} />
                                    ) : (
                                        <ImageIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <span className={cn("text-sm font-medium", level === 0 ? "text-gray-900" : "text-gray-700")}>
                                    {cat.name}
                                </span>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm font-medium py-4">{cat.slug}</TableCell>
                    <TableCell className="text-gray-600 text-sm py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-xs font-mono">
                            {cat.shortCode || '—'}
                        </span>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium text-xs">
                            {cat._count?.products || 0} products
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
                                        setFormData({
                                            name: '',
                                            shortCode: '',
                                            parentId: cat.id,
                                            description: '',
                                            image: ''
                                        });
                                        setIsCreateOpen(true);
                                    }}
                                    className="rounded-lg cursor-pointer"
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Sub-category
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                    onClick={() => {
                                        setCurrentCategory(cat);
                                        setFormData({
                                            name: cat.name,
                                            shortCode: cat.shortCode || '',
                                            parentId: cat.parentId || 'root',
                                            description: cat.description || '',
                                            image: cat.image || ''
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
                                        setCurrentCategory(cat);
                                        setIsDeleteOpen(true);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                {/* Render children if expanded */}
                {expanded[cat.id] && cat.children && renderRows(cat.children, level + 1)}
            </React.Fragment>
        ));
    };

    const handleCreate = async () => {
        if (submittingRef.current) return; // block double-click
        submittingRef.current = true;
        setIsLoading(true);
        try {
            const formDataObj = new FormData();
            formDataObj.append('name', formData.name);
            formDataObj.append('shortCode', formData.shortCode);
            if (formData.parentId !== 'root') {
                formDataObj.append('parentId', formData.parentId);
            }
            formDataObj.append('description', formData.description);
            formDataObj.append('image', formData.image);

            const res = await createCategory(formDataObj);
            if (res.success) {
                toast.success('Category created successfully');
                setIsCreateOpen(false);
                setFormData({ name: '', shortCode: '', parentId: 'root', description: '', image: '' });
                router.refresh();
            } else {
                toast.error(res.error || 'Failed to create category');
            }
        } finally {
            submittingRef.current = false;
            setIsLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!currentCategory || submittingRef.current) return;
        submittingRef.current = true;
        setIsLoading(true);
        try {
            const formDataObj = new FormData();
            formDataObj.append('name', formData.name);
            formDataObj.append('shortCode', formData.shortCode);
            if (formData.parentId !== 'root') {
                formDataObj.append('parentId', formData.parentId);
            }
            formDataObj.append('description', formData.description);
            formDataObj.append('image', formData.image);

            const res = await updateCategory(currentCategory.id, formDataObj);
            if (res.success) {
                toast.success('Category updated successfully');
                setIsEditOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || 'Failed to update category');
            }
        } finally {
            submittingRef.current = false;
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentCategory || submittingRef.current) return;
        submittingRef.current = true;
        setIsLoading(true);
        try {
            const res = await deleteCategory(currentCategory.id);
            if (res.success) {
                toast.success('Category deleted successfully');
                setIsDeleteOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || 'Failed to delete category');
            }
        } finally {
            submittingRef.current = false;
            setIsLoading(false);
        }
    };

    const flatOptions = flattenCategories(categories);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">All Categories</h2>
                    <p className="text-sm text-gray-600 mt-1 font-medium">
                        {categories.length} {categories.length === 1 ? 'category' : 'categories'} total
                    </p>
                </div>
                <Button 
                    onClick={() => {
                        setFormData({ name: '', shortCode: '', parentId: 'root', description: '', image: '' });
                        setIsCreateOpen(true);
                    }}
                    className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-md font-medium px-5"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Category
                </Button>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                            <TableHead className="w-[450px] pl-6 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">Category Name</TableHead>
                            <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">Slug</TableHead>
                            <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">Short Code</TableHead>
                            <TableHead className="py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">Products</TableHead>
                            <TableHead className="text-right pr-6 py-3.5 text-xs font-bold uppercase tracking-wider text-gray-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-20">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                            <FolderTree className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-base font-bold text-gray-900 mb-1">No categories yet</p>
                                        <p className="text-sm text-gray-600">Create your first category to get started</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            renderRows(categories)
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="rounded-2xl border-2 border-gray-200 shadow-2xl max-w-md">
                    <DialogHeader className="space-y-3 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <Plus className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-gray-900">Create New Category</DialogTitle>
                                <DialogDescription className="text-gray-600 text-sm font-medium">Add to your store hierarchy</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="grid gap-5 py-2">
                        <div className="grid gap-2.5">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                Category Name
                            </Label>
                            <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Smartphones"
                                className="h-11 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium"
                            />
                        </div>
                        <div className="grid gap-2.5">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                Short Code <span className="text-gray-400 font-normal text-xs">(SKU suffix, optional)</span>
                            </Label>
                            <Input 
                                value={formData.shortCode}
                                onChange={(e) => setFormData({...formData, shortCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)})}
                                placeholder="e.g. HP"
                                className="h-11 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono font-medium uppercase"
                            />
                        </div>
                        <div className="grid gap-2.5">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                Parent Category
                            </Label>
                            <Select 
                                value={formData.parentId} 
                                onValueChange={(val) => setFormData({...formData, parentId: val})}
                            >
                                <SelectTrigger className="h-11 rounded-lg border-2 border-gray-200 font-medium focus:border-green-500 focus:ring-2 focus:ring-green-100">
                                    <SelectValue placeholder="Select parent..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2 border-gray-200 shadow-xl">
                                    <SelectItem value="root" className="font-medium rounded-lg">None (Root Category)</SelectItem>
                                    {flatOptions.map(opt => (
                                        <SelectItem key={opt.id} value={opt.id} className="font-medium rounded-lg">
                                            <span style={{ paddingLeft: `${opt.level * 10}px` }}>
                                                {opt.level > 0 && '↳ '}{opt.name}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2.5">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                Description <span className="text-gray-400 font-normal">(optional)</span>
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Brief description of this category..."
                                className="rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 font-medium min-h-[100px]"
                            />
                        </div>
                        <div className="grid gap-2.5">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                Category Icon <span className="text-gray-400 font-normal">(optional)</span>
                            </Label>
                            <IconPicker
                                value={formData.image}
                                onChange={(val) => setFormData({...formData, image: val})}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isLoading} className="rounded-lg font-medium border-2 border-gray-200 hover:bg-gray-50">Cancel</Button>
                        <Button onClick={handleCreate} disabled={isLoading} className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg">
                            {isLoading ? 'Creating...' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="rounded-2xl border-2 border-gray-200 shadow-2xl max-w-md">
                    <DialogHeader className="space-y-3 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                                <Pencil className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-gray-900">Edit Category</DialogTitle>
                                <DialogDescription className="text-gray-600 text-sm font-medium">Update category information</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="grid gap-5 py-2">
                        <div className="grid gap-2.5">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                Category Name
                            </Label>
                            <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="h-11 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-medium"
                            />
                        </div>
                        <div className="grid gap-2.5">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                Short Code <span className="text-gray-400 font-normal text-xs">(SKU suffix, optional)</span>
                            </Label>
                            <Input 
                                value={formData.shortCode}
                                onChange={(e) => setFormData({...formData, shortCode: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)})}
                                placeholder="e.g. HP"
                                className="h-11 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-mono font-medium uppercase"
                            />
                        </div>
                        <div className="grid gap-2.5">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                Parent Category
                            </Label>
                            <Select 
                                value={formData.parentId} 
                                onValueChange={(val) => setFormData({...formData, parentId: val})}
                                disabled={currentCategory?.children && currentCategory.children.length > 0}
                            >
                                <SelectTrigger className="h-11 rounded-lg border-2 border-gray-200 font-medium focus:border-green-500 focus:ring-2 focus:ring-green-100">
                                    <SelectValue placeholder="Select parent..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-2 border-gray-200 shadow-xl">
                                    <SelectItem value="root" className="font-medium rounded-lg">None (Root Category)</SelectItem>
                                    {flatOptions
                                        .filter(opt => opt.id !== currentCategory?.id)
                                        .map(opt => (
                                            <SelectItem key={opt.id} value={opt.id} className="font-medium rounded-lg">
                                                <span style={{ paddingLeft: `${opt.level * 10}px` }}>
                                                    {opt.level > 0 && '↳ '}{opt.name}
                                                </span>
                                            </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {currentCategory?.children && currentCategory.children.length > 0 && (
                                <div className="flex items-start gap-2 text-xs text-amber-700 font-medium bg-amber-50 border-2 border-amber-200 px-3 py-2.5 rounded-lg">
                                    <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-xs font-bold">!</span>
                                    </div>
                                    <span>Cannot move a category that has sub-categories. Move children first.</span>
                                </div>
                            )}
                        </div>
                        <div className="grid gap-2.5">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                Description <span className="text-gray-400 font-normal">(optional)</span>
                            </Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 font-medium min-h-[100px]"
                            />
                        </div>
                        <div className="grid gap-2.5">
                            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                Category Icon <span className="text-gray-400 font-normal">(optional)</span>
                            </Label>
                            <IconPicker
                                value={formData.image}
                                onChange={(val) => setFormData({...formData, image: val})}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading} className="rounded-lg font-medium border-2 border-gray-200 hover:bg-gray-50">Cancel</Button>
                        <Button onClick={handleUpdate} disabled={isLoading} className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-lg">
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="rounded-2xl border-2 border-gray-200 shadow-2xl max-w-md">
                    <DialogHeader className="space-y-3 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                <Trash2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-gray-900">Delete Category</DialogTitle>
                                <DialogDescription className="text-gray-600 text-sm font-medium">This action cannot be undone</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="py-2">
                        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-sm font-bold">!</span>
                            </div>
                            <p className="text-sm text-gray-700 font-medium">
                                Are you sure you want to delete <span className="font-bold text-red-700">"{currentCategory?.name}"</span>? All associated data will be permanently removed.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isLoading} className="rounded-lg font-medium border-2 border-gray-200 hover:bg-gray-50">Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isLoading} className="rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium shadow-lg">
                            {isLoading ? 'Deleting...' : 'Delete Category'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
