"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface ProductTableToolbarProps {
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}

export function ProductTableToolbar({ categories, brands }: ProductTableToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // Helper to update URL params
  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset page on filter change
    router.push(`?${params.toString()}`);
  };

  const handleSearch = useDebouncedCallback((term: string) => {
    updateParam("search", term || null);
  }, 300);

  const clearFilters = () => {
    router.push("/admin/products");
  };

  const currentLimit = searchParams.get("limit") || "20";

  const handleLimitChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", value);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  // Count active filters (excluding page, search, limit, and category since category is always visible now)
  const activeFiltersCount = Array.from(searchParams.entries()).filter(
    ([key]) => key !== 'page' && key !== 'search' && key !== 'limit' && key !== 'category'
  ).length;

  return (
    <div className="space-y-2 md:space-y-3 pb-0 md:pb-0">
      <div className="flex flex-col gap-2">
        
        {/* ── Search & Actions Bar ── */}
        <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <Input
                    placeholder="Search products, SKU..."
                    className="pl-8 h-8 md:h-9 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all rounded text-[13px] font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
                    defaultValue={searchParams.get("search")?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
            
            <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={`relative h-8 md:h-9 px-2.5 md:px-3 rounded border-slate-200 dark:border-zinc-800 transition-all shrink-0 active:scale-95 ${
                    showFilters 
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50" 
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
                }`}
            >
                <SlidersHorizontal className="h-3.5 w-3.5 md:mr-1.5" />
                <span className="hidden md:inline font-semibold text-[13px]">Filters</span>
                {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 md:static md:ml-1 bg-indigo-600 text-white text-[9px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-sm">
                        {activeFiltersCount}
                    </span>
                )}
            </Button>
        </div>

        {/* ── Operational Filter Chips ── */}
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1 md:pb-0 -mx-2 px-2 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <button
                onClick={() => {
                    updateParam("stock_status", null);
                    updateParam("status", null);
                }}
                className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    !searchParams.get("stock_status") && !searchParams.get("status")
                    ? "bg-slate-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
                    : "bg-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
            >
                All
            </button>
            <button
                onClick={() => updateParam("stock_status", "low")}
                className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    searchParams.get("stock_status") === "low"
                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400"
                    : "bg-transparent text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                }`}
            >
                Low Stock
            </button>
            <button
                onClick={() => updateParam("stock_status", "out")}
                className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    searchParams.get("stock_status") === "out"
                    ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400"
                    : "bg-transparent text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                }`}
            >
                Out of Stock
            </button>
            <button
                onClick={() => updateParam("status", "draft")}
                className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    searchParams.get("status") === "draft"
                    ? "bg-slate-200 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200"
                    : "bg-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
            >
                Draft
            </button>
        </div>

        {/* ── Advanced Filters Container ── */}
        {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 md:p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-md border border-slate-200 dark:border-zinc-800 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Brand</label>
                    <Select 
                        value={searchParams.get("brand") || "all"} 
                        onValueChange={(val) => updateParam("brand", val === "all" ? null : val)}
                    >
                        <SelectTrigger className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 h-9 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm font-medium">
                            <SelectValue placeholder="All Brands" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                            <SelectItem value="all" className="font-medium text-slate-500">All Brands</SelectItem>
                            {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Stock Level</label>
                    <Select 
                        value={searchParams.get("stock_status") || "all"} 
                        onValueChange={(val) => updateParam("stock_status", val === "all" ? null : val)}
                    >
                        <SelectTrigger className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 h-9 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm font-medium">
                            <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                            <SelectItem value="all" className="font-medium text-slate-500">All Levels</SelectItem>
                            <SelectItem value="in" className="text-emerald-600 font-medium">In Stock</SelectItem>
                            <SelectItem value="low" className="text-amber-600 font-medium">Low Stock</SelectItem>
                            <SelectItem value="out" className="text-red-600 font-medium">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Status</label>
                    <Select 
                        value={searchParams.get("status") || "all"} 
                        onValueChange={(val) => updateParam("status", val === "all" ? null : val)}
                    >
                        <SelectTrigger className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 h-9 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm font-medium">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md">
                            <SelectItem value="all" className="font-medium text-slate-500">All Status</SelectItem>
                            <SelectItem value="active" className="text-indigo-600 font-medium">Active</SelectItem>
                            <SelectItem value="draft" className="text-slate-600 font-medium">Draft</SelectItem>
                            <SelectItem value="inactive" className="text-slate-400 font-medium">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Per Page */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wide">Per Page</label>
                    <div className="flex items-center gap-2">
                        <Select value={currentLimit} onValueChange={handleLimitChange}>
                            <SelectTrigger className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 h-9 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm font-medium w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-md">
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        {(searchParams.toString().length > 0 && searchParams.get("page") !== searchParams.toString().split("=")[1]) && (
                            <Button 
                                variant="ghost" 
                                onClick={clearFilters} 
                                className="h-9 px-2.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                                title="Clear all filters"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
