export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg mb-8"></div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Checkout Form Skeleton */}
        <div className="flex-1 space-y-8">
          {/* Contact Info */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-6">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-12 w-full bg-gray-100 rounded-lg"></div>
              <div className="h-12 w-full bg-gray-100 rounded-lg"></div>
            </div>
            <div className="h-12 w-full bg-gray-100 rounded-lg"></div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-6">
            <div className="h-6 w-40 bg-gray-200 rounded"></div>
            <div className="h-12 w-full bg-gray-100 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-12 w-full bg-gray-100 rounded-lg"></div>
              <div className="h-12 w-full bg-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Order Summary Skeleton */}
        <div className="w-full lg:w-[400px] flex-shrink-0">
          <div className="bg-gray-50 p-6 rounded-2xl space-y-6">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
            
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
              <div className="flex justify-between pt-2">
                <div className="h-6 w-24 bg-gray-300 rounded"></div>
                <div className="h-6 w-20 bg-gray-300 rounded"></div>
              </div>
            </div>

            <div className="h-12 w-full bg-blue-200 rounded-xl mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
