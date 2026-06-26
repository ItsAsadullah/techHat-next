import Link from 'next/link';
import {
  Package, Layers, Tags, ListChecks, ChevronRight, ArrowRight,
  CheckCircle2, FileStack, Star, Cpu,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function ProductsWorkspacePage() {
  const [categoryCount, brandCount, attrCount, specCount] = await Promise.all([
    prisma.category.count(),
    prisma.brand.count(),
    prisma.attribute.count().catch(() => 0),
    prisma.specTemplate.count().catch(() => 0),
  ]);

  const SECTIONS = [
    {
      title: 'Categories',
      href: '/admin/settings/categories',
      icon: Layers,
      color: 'from-violet-500 to-violet-700',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-600',
      description: 'Create and manage the product category hierarchy. Set parent categories, icons, and display order.',
      count: categoryCount,
      countLabel: 'categories',
      items: ['Category Hierarchy', 'Parent Categories', 'Category Icons', 'Display Order', 'Category SEO'],
      status: 'configured',
    },
    {
      title: 'Brands',
      href: '/admin/settings/brands',
      icon: Tags,
      color: 'from-fuchsia-500 to-fuchsia-700',
      bgLight: 'bg-fuchsia-50',
      textColor: 'text-fuchsia-600',
      description: 'Create and manage product brands with logos and short codes for SKU generation.',
      count: brandCount,
      countLabel: 'brands',
      items: ['Brand List', 'Brand Logos', 'Short Codes', 'Featured Brands', 'Brand Filtering'],
      status: 'configured',
    },
    {
      title: 'Attributes',
      href: '/admin/settings/attributes',
      icon: ListChecks,
      color: 'from-blue-500 to-blue-700',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      description: 'Define product attributes like Color, Size, Storage that are used to create product variants.',
      count: attrCount,
      countLabel: 'attributes',
      items: ['Attribute Types', 'Attribute Values', 'Variant Generation', 'Display Order', 'Filter Attributes'],
      status: attrCount > 0 ? 'configured' : 'needs-setup',
    },
    {
      title: 'Spec Templates',
      href: '/admin/settings/spec-templates',
      icon: FileStack,
      color: 'from-cyan-500 to-cyan-700',
      bgLight: 'bg-cyan-50',
      textColor: 'text-cyan-600',
      description: 'Reusable specification templates for specific product types like smartphones, laptops, or TVs.',
      count: specCount,
      countLabel: 'templates',
      items: ['Template List', 'Spec Fields', 'Field Types', 'Required Fields', 'Category Mapping'],
      status: specCount > 0 ? 'configured' : 'needs-setup',
    },
    {
      title: 'Collections',
      href: '/admin/settings/products',
      icon: Star,
      color: 'from-amber-500 to-amber-700',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      description: 'Group products into curated collections for homepage features and promotions.',
      count: 0,
      countLabel: 'collections',
      items: ['New Collection', 'Add Products', 'Collection Banner', 'Homepage Feature'],
      status: 'coming-soon',
    },
    {
      title: 'AI Product Settings',
      href: '/admin/settings/ai-assistant',
      icon: Cpu,
      color: 'from-purple-500 to-purple-700',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      description: 'Configure AI-powered product description generation, spec extraction, and auto-categorization.',
      count: 0,
      countLabel: 'rules',
      items: ['Description AI', 'Spec Extraction', 'Auto Category', 'Image Analysis'],
      status: 'configured',
    },
  ];

  const configuredCount = SECTIONS.filter((s) => s.status === 'configured').length;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Products & Catalog</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-200 shrink-0">
            <Package className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products & Catalog</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Manage your product catalog structure — categories, brands, attributes, and specification templates.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Live counts */}
          <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <div className="text-center">
              <p className="text-lg font-bold text-violet-600">{categoryCount}</p>
              <p className="text-[10px] text-gray-400 font-semibold">Categories</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-center">
              <p className="text-lg font-bold text-fuchsia-600">{brandCount}</p>
              <p className="text-[10px] text-gray-400 font-semibold">Brands</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">{configuredCount} of {SECTIONS.length} configured</span>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isComingSoon = section.status === 'coming-soon';

          return (
            <Link
              key={section.title}
              href={isComingSoon ? '#' : section.href}
              className={`group relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col transition-all duration-200 ${
                isComingSoon
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:border-violet-300 hover:shadow-lg hover:shadow-violet-50 hover:-translate-y-0.5'
              }`}
              
            >
              {isComingSoon && (
                <div className="absolute top-3 right-3 bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Coming Soon
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                {section.count > 0 && (
                  <span className={`text-xs font-bold ${section.textColor} ${section.bgLight} px-2.5 py-1 rounded-lg`}>
                    {section.count} {section.countLabel}
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{section.description}</p>

              <div className="space-y-1 mb-4">
                {section.items.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <span className="text-[11px] text-gray-500">{item}</span>
                  </div>
                ))}
              </div>

              {!isComingSoon && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className={`text-[11px] font-semibold ${section.textColor}`}>
                    {section.items.length} settings
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
                    Configure <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
