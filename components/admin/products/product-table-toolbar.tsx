"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Search, SlidersHorizontal, Download, Upload, Plus } from "lucide-react";
import Link from "next/link";
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

  return (
    <div className="space-y-4 mb-6">
      {/* Header Actions - MOVED TO PAGE HEADER but kept imports if needed later */}
      
      {/* Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <Input
                    placeholder="Search by name, SKU, barcode..."
                    className="pl-10 h-11 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all rounded-xl font-medium text-gray-700 placeholder:text-gray-400"
                    defaultValue={searchParams.get("search")?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            {/* Per-page selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap hidden md:block">Show</span>
                <Select value={currentLimit} onValueChange={handleLimitChange}>
                    <SelectTrigger className="h-11 w-24 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium text-gray-700">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap hidden md:block">per page</span>
            </div>
            
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`h-11 px-4 rounded-xl border-dashed border-2 font-medium transition-all ${
                        showFilters 
                        ? "bg-blue-50 text-blue-700 border-blue-200" 
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                    {Array.from(searchParams.entries()).filter(([key]) => key !== 'page' && key !== 'search').length > 0 && (
                        <span className="ml-2 bg-blue-100 text-blue-700 text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                            {Array.from(searchParams.entries()).filter(([key]) => key !== 'page' && key !== 'search').length}
                        </span>
                    )}
                </Button>

                {(searchParams.toString().length > 0 && searchParams.get("page") !== searchParams.toString().split("=")[1]) && (
                    <Button 
                        variant="ghost" 
                        onClick={clearFilters} 
                        className="h-11 px-3 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Clear all filters"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Category</label>
                    <Select 
                        value={searchParams.get("category") || "all"} 
                        onValueChange={(val) => updateParam("category", val === "all" ? null : val)}
                    >
                        <SelectTrigger className="bg-white border-gray-200 h-10 rounded-lg focus:ring-2 focus:ring-blue-500/20">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium text-gray-500">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Brand</label>
                    <Select 
                        value={searchParams.get("brand") || "all"} 
                        onValueChange={(val) => updateParam("brand", val === "all" ? null : val)}
                    >
                        <SelectTrigger className="bg-white border-gray-200 h-10 rounded-lg focus:ring-2 focus:ring-blue-500/20">
                            <SelectValue placeholder="All Brands" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium text-gray-500">All Brands</SelectItem>
                            {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Stock Level</label>
                    <Select 
                        value={searchParams.get("stock_status") || "all"} 
                        onValueChange={(val) => updateParam("stock_status", val === "all" ? null : val)}
                    >
                        <SelectTrigger className="bg-white border-gray-200 h-10 rounded-lg focus:ring-2 focus:ring-blue-500/20">
                            <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium text-gray-500">All Levels</SelectItem>
                            <SelectItem value="in" className="text-green-600">In Stock</SelectItem>
                            <SelectItem value="low" className="text-orange-600">Low Stock</SelectItem>
                            <SelectItem value="out" className="text-red-600">Out of Stock</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Status</label>
                    <Select 
                        value={searchParams.get("status") || "all"} 
                        onValueChange={(val) => updateParam("status", val === "all" ? null : val)}
                    >
                        <SelectTrigger className="bg-white border-gray-200 h-10 rounded-lg focus:ring-2 focus:ring-blue-500/20">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-medium text-gray-500">All Status</SelectItem>
                            <SelectItem value="active" className="text-blue-600">Active</SelectItem>
                            <SelectItem value="draft" className="text-gray-600">Draft</SelectItem>
                            <SelectItem value="inactive" className="text-gray-400">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
