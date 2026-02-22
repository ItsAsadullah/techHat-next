// ─── Filter & Sort types ──────────────────────────────────────────────────────

export type SortOption =
  | 'popularity'   // soldCount desc
  | 'newest'       // createdAt desc
  | 'price-asc'    // price asc
  | 'price-desc'   // price desc
  | 'discount'     // discountPercentage desc
  | 'rating';      // avgRating desc

export interface FilterParams {
  sort: SortOption;
  minPrice: number;
  maxPrice: number;
  brands: string[];    // brand slugs
  rating: number;      // minimum star rating (0 = no filter)
  inStock: boolean;
  onSale: boolean;
  page: number;
  perPage: number;
  // Dynamic spec filters: key = spec name (lower-case-dashed), values = selected values
  specs: Record<string, string[]>;
}

export const DEFAULT_FILTER_PARAMS: FilterParams = {
  sort: 'popularity',
  minPrice: 0,
  maxPrice: 0,
  brands: [],
  rating: 0,
  inStock: false,
  onSale: false,
  page: 1,
  perPage: 20,
  specs: {},
};

// ─── Category page data ───────────────────────────────────────────────────────

export interface CategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
}

export interface CategoryPageInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  breadcrumbs: CategoryBreadcrumb[];
  childCategories: { id: string; name: string; slug: string; image: string | null }[];
}

// ─── Product card data ────────────────────────────────────────────────────────

export interface CategoryProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  offerPrice: number | null;
  discountPercentage: number | null;
  stock: number;
  minStock: number;
  isFeatured: boolean;
  isFlashSale: boolean;
  isBestSeller: boolean;
  soldCount: number;
  viewCount: number;
  shortDesc: string | null;
  images: string[];
  primaryImage: string | null;
  hoverImage: string | null;
  brand: { id: string; name: string; slug: string } | null;
  avgRating: number;
  reviewCount: number;
  warrantyMonths: number | null;
  warrantyType: string | null;
  specifications: Record<string, string> | null;
}

// ─── Filter options (aggregated from products) ────────────────────────────────

export interface BrandFilterOption {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface SpecFilterOption {
  key: string;           // e.g. "RAM"
  displayKey: string;    // e.g. "RAM"
  values: { value: string; count: number }[];
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface FilterOptions {
  brands: BrandFilterOption[];
  priceRange: PriceRange;
  specFilters: SpecFilterOption[];
  ratingCounts: { stars: number; count: number }[];
}

// ─── Full page response ───────────────────────────────────────────────────────

export interface CategoryPageData {
  category: CategoryPageInfo;
  products: CategoryProduct[];
  totalCount: number;
  totalPages: number;
  filterOptions: FilterOptions;
  appliedFilters: FilterParams;
}

// ─── URL params helpers ───────────────────────────────────────────────────────

export function parseSearchParams(searchParams: Record<string, string | string[] | undefined>): FilterParams {
  const get = (key: string) => {
    const v = searchParams[key];
    return Array.isArray(v) ? v[0] : v ?? '';
  };

  const specEntries: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (key.startsWith('spec_') && value) {
      const specKey = key.replace('spec_', '');
      specEntries[specKey] = (Array.isArray(value) ? value : [value]).flatMap(v => v.split(','));
    }
  }

  return {
    sort: (get('sort') as SortOption) || 'popularity',
    minPrice: parseInt(get('minPrice')) || 0,
    maxPrice: parseInt(get('maxPrice')) || 0,
    brands: get('brands') ? get('brands').split(',').filter(Boolean) : [],
    rating: parseFloat(get('rating')) || 0,
    inStock: get('inStock') === 'true',
    onSale: get('onSale') === 'true',
    page: parseInt(get('page')) || 1,
    perPage: 20,
    specs: specEntries,
  };
}

export function buildSearchParams(filters: Partial<FilterParams>): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.sort && filters.sort !== 'popularity') params.set('sort', filters.sort);
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.brands?.length) params.set('brands', filters.brands.join(','));
  if (filters.rating) params.set('rating', String(filters.rating));
  if (filters.inStock) params.set('inStock', 'true');
  if (filters.onSale) params.set('onSale', 'true');
  if (filters.page && filters.page > 1) params.set('page', String(filters.page));
  if (filters.specs) {
    for (const [key, values] of Object.entries(filters.specs)) {
      if (values.length) params.set(`spec_${key}`, values.join(','));
    }
  }
  return params;
}
