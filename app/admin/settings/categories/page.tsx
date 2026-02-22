import { prisma } from '@/lib/prisma';
import { CategoryManager } from '@/components/admin/settings/category-manager';
import { FolderTree } from 'lucide-react';
import { cache } from 'react';

// Cache the categories fetch
const getCategoriesTree = cache(async () => {
    // Fetch categories with only needed fields
    const categories = await prisma.category.findMany({
        select: {
            id: true,
            name: true,
            slug: true,
            parentId: true,
            image: true,
            description: true,
            _count: {
                select: { products: true }
            }
        },
        orderBy: { name: 'asc' },
    });

    const buildTree = (parentId: string | null = null): any[] => {
        return categories
            .filter(cat => cat.parentId === parentId)
            .map(cat => ({
                ...cat,
                children: buildTree(cat.id)
            }));
    };

    return buildTree(null);
});

export default async function CategoriesSettingsPage() {
    const categories = await getCategoriesTree();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                            <FolderTree className="w-6 h-6 text-gray-700" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
                            <p className="text-gray-600 font-medium mt-1">Organize your product categories in a hierarchical structure</p>
                        </div>
                    </div>
                </div>
                
                <CategoryManager initialCategories={categories} />
            </div>
        </div>
    );
}
