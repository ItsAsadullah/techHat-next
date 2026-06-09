import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50/50">
      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
        {/* Logo Animation */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
          <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-xl ring-4 ring-white">
            <span className="text-4xl font-bold text-white">T</span>
          </div>
        </div>
        
        {/* Brand Name & Spinner */}
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 font-heading tracking-tight">
            TechHat
          </h2>
          <div className="flex items-center gap-2 text-muted-foreground bg-white/80 px-4 py-2 rounded-full shadow-sm border border-gray-100">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium">Loading amazing products...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
