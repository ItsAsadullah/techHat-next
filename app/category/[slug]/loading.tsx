export default function CategoryLoading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-64 bg-gray-200 rounded mb-8"></div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filter Skeleton */}
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 w-24 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-gray-100 rounded"></div>
                    <div className="h-4 w-32 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-xl">
            <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
          </div>

          {/* Product Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col gap-3 bg-white p-3 rounded-xl border border-gray-100">
                <div className="aspect-square w-full bg-gray-100 rounded-lg"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded mt-2"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                <div className="flex items-center justify-between mt-2">
                  <div className="h-6 w-20 bg-gray-200 rounded-lg"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
