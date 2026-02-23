export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-64 bg-gray-200 rounded mb-8"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square w-full bg-gray-100 rounded-2xl"></div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 w-20 bg-gray-100 rounded-lg flex-shrink-0"></div>
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-3/4 bg-gray-200 rounded-lg"></div>
            <div className="h-6 w-1/2 bg-gray-200 rounded-lg"></div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
          </div>

          <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>

          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-100 rounded"></div>
            <div className="h-4 w-full bg-gray-100 rounded"></div>
            <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
          </div>

          <div className="pt-6 space-y-4">
            <div className="h-12 w-full bg-gray-200 rounded-xl"></div>
            <div className="h-12 w-full bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
