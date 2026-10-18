export default function SettingsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-3 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>

      {/* Header Skeleton */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-80 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl" />
      </div>

      {/* Cards Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col space-y-4 shadow-sm"
          >
            <div className="w-11 h-11 rounded-xl bg-gray-100" />
            <div className="h-5 w-36 bg-gray-200 rounded" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-full bg-gray-100 rounded" />
              <div className="h-3.5 w-4/5 bg-gray-100 rounded" />
            </div>
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
